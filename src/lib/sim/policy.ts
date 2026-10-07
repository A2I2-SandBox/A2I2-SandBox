import type { Asset } from "./market";
import type { EgressIntent, Position, Rule, TradeIntent } from "./types";

export interface PolicyConfig {
  maxTradeUsd: number;
  maxPositionPct: number;
  maxDrawdownPct: number;
  cooldownTicks: number;
  allowlist: string[];
  egress: "deny-all" | "allowlist";
  egressHosts: string[];
  redact: boolean;
}

export const DEFAULT_POLICY: PolicyConfig = {
  maxTradeUsd: 1500,
  maxPositionPct: 35,
  maxDrawdownPct: 15,
  cooldownTicks: 3,
  allowlist: ["ETH", "AAPL", "NVDA", "TSLA", "AMZN"],
  egress: "allowlist",
  egressHosts: ["rpc.testnet.chain.robinhood.com"],
  redact: true,
};

export const RULE_LABELS: Record<Rule, string> = {
  "kill-switch": "Kill switch",
  allowlist: "Asset allowlist",
  "max-trade": "Max trade size",
  cooldown: "Cooldown",
  funds: "Insufficient funds",
  concentration: "Concentration",
  "no-position": "No position",
  "egress-deny": "Egress denied",
  "egress-host": "Host not allowed",
};

/** Payload fields that identify the user or reveal their strategy. Stripped when redaction is on. */
export const SENSITIVE_FIELDS = new Set(["sessionAddress", "positions", "strategyPrompt", "wallet"]);

export type Verdict =
  | { ok: true; notional: number }
  | { ok: false; rule: Rule; reason: string };

export interface TradeContext {
  tick: number;
  halted: boolean;
  cash: number;
  equity: number;
  market: Map<string, Asset>;
  positions: Record<string, Position>;
  lastTrade: Record<string, number>;
}

export function checkTrade(intent: TradeIntent, policy: PolicyConfig, ctx: TradeContext): Verdict {
  const fail = (rule: Rule, reason: string): Verdict => ({ ok: false, rule, reason });
  if (ctx.halted) return fail("kill-switch", "Session is halted");

  const asset = ctx.market.get(intent.symbol);
  if (!asset || !policy.allowlist.includes(intent.symbol))
    return fail("allowlist", `${intent.symbol} is not on the allowlist`);

  if (intent.notional > policy.maxTradeUsd)
    return fail("max-trade", `$${Math.round(intent.notional).toLocaleString()} exceeds the $${policy.maxTradeUsd.toLocaleString()} cap`);

  const since = ctx.tick - (ctx.lastTrade[intent.symbol] ?? -Infinity);
  if (since < policy.cooldownTicks)
    return fail("cooldown", `${intent.symbol} traded ${since === 0 ? "this tick" : `${since} ticks ago`}`);

  const held = (ctx.positions[intent.symbol]?.qty ?? 0) * asset.price;
  if (intent.side === "buy") {
    if (intent.notional > ctx.cash) return fail("funds", `Needs $${Math.round(intent.notional)}, has $${Math.round(ctx.cash)}`);
    const weight = ((held + intent.notional) / ctx.equity) * 100;
    if (weight > policy.maxPositionPct)
      return fail("concentration", `${intent.symbol} would be ${weight.toFixed(1)}% of equity (limit ${policy.maxPositionPct}%)`);
    return { ok: true, notional: intent.notional };
  }

  if (held < 1) return fail("no-position", `No ${intent.symbol} to sell`);
  return { ok: true, notional: Math.min(intent.notional, held) };
}

export type EgressVerdict =
  | { ok: true; fields: string[]; bytes: number; redacted: string[] }
  | { ok: false; rule: Rule; reason: string };

export function checkEgress(intent: EgressIntent, policy: PolicyConfig): EgressVerdict {
  if (policy.egress === "deny-all") return { ok: false, rule: "egress-deny", reason: "All agent egress is denied" };
  if (!policy.egressHosts.includes(intent.host))
    return { ok: false, rule: "egress-host", reason: `${intent.host} is not an allowed host` };
  if (!policy.redact) return { ok: true, fields: intent.fields, bytes: intent.bytes, redacted: [] };

  const redacted = intent.fields.filter((f) => SENSITIVE_FIELDS.has(f));
  const fields = intent.fields.filter((f) => !SENSITIVE_FIELDS.has(f));
  // Approximate: payload shrinks in proportion to the fields removed.
  const bytes = Math.round((intent.bytes * fields.length) / Math.max(intent.fields.length, 1));
  return { ok: true, fields, bytes, redacted };
}
