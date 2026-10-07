import { createMarket, stepMarket, type Asset } from "./market";
import { checkEgress, checkTrade, DEFAULT_POLICY, RULE_LABELS, type PolicyConfig } from "./policy";
import { ephemeralAddress, Rng } from "./rng";
import { defaultParams, STRATEGIES, type StrategyId } from "./strategies";
import type { EgressIntent, EventKind, Position, Rule, Trade, TradeIntent, TraceEvent } from "./types";

export const CHAIN = {
  name: "Robinhood Chain Testnet",
  id: 46630,
  rpc: "https://rpc.testnet.chain.robinhood.com",
  rpcHost: "rpc.testnet.chain.robinhood.com",
  explorer: "https://explorer.testnet.chain.robinhood.com",
} as const;

export interface AgentConfig {
  strategy: StrategyId;
  symbol: string;
  params: Record<string, number>;
}

export interface SandboxConfig {
  seed: number;
  startCash: number;
  agent: AgentConfig;
  policy: PolicyConfig;
}

export const defaultConfig = (seed = 46630): SandboxConfig => ({
  seed,
  startCash: 10_000,
  agent: { strategy: "momentum", symbol: "NVDA", params: defaultParams("momentum") },
  policy: DEFAULT_POLICY,
});

export interface PrivacyLedger {
  sessionAddress: string;
  egressAttempts: number;
  egressBlocked: number;
  /** Bytes agents tried to send. The sandbox intercepts all agent traffic; none of it leaves the page. */
  egressBytesIntercepted: number;
  fieldsRedacted: number;
  /** Real requests the page has made, only ever on an explicit click. */
  networkRequests: number;
  networkBytesOut: number;
  networkBytesIn: number;
}

export interface Snapshot {
  config: SandboxConfig;
  tick: number;
  block: number;
  gasGwei: number;
  running: boolean;
  halted: boolean;
  haltReason: string | null;
  anchoredToTestnet: boolean;
  market: { symbol: string; name: string; price: number; changePct: number; history: number[] }[];
  cash: number;
  positions: Record<string, Position>;
  equity: number;
  pnl: number;
  pnlPct: number;
  maxDrawdownPct: number;
  gasSpentUsd: number;
  equityHistory: number[];
  trades: Trade[];
  events: TraceEvent[];
  stats: { intents: number; allowed: number; blocked: number; byRule: Partial<Record<Rule, number>> };
  privacy: PrivacyLedger;
}

const MAX_EVENTS = 400;
const MAX_TRADES = 300;

export const redactAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

export class Sandbox {
  private rng!: Rng;
  private market!: Map<string, Asset>;
  private config!: SandboxConfig;
  private tick = 0;
  private block = 0;
  private gasGwei = 0.02;
  private running = false;
  private halted = false;
  private haltReason: string | null = null;
  private anchored = false;
  private cash = 0;
  private positions: Record<string, Position> = {};
  private lastTrade: Record<string, number> = {};
  private peakEquity = 0;
  private maxDrawdown = 0;
  private gasSpent = 0;
  private equityHistory: number[] = [];
  private trades: Trade[] = [];
  private events: TraceEvent[] = [];
  private nextEventId = 1;
  private stats: Snapshot["stats"] = { intents: 0, allowed: 0, blocked: 0, byRule: {} };
  private privacy!: PrivacyLedger;

  snapshot!: Snapshot;

  constructor(config: SandboxConfig) {
    this.reset(config);
  }

  reset(config: SandboxConfig = this.config) {
    this.config = config;
    this.rng = new Rng(config.seed);
    this.market = createMarket(this.rng);
    this.tick = 0;
    this.block = 1_000_000 + this.rng.int(500_000);
    this.gasGwei = 0.02;
    this.running = false;
    this.halted = false;
    this.haltReason = null;
    this.anchored = false;
    this.cash = config.startCash;
    this.positions = {};
    this.lastTrade = {};
    this.peakEquity = config.startCash;
    this.maxDrawdown = 0;
    this.gasSpent = 0;
    this.equityHistory = [config.startCash];
    this.trades = [];
    this.events = [];
    this.stats = { intents: 0, allowed: 0, blocked: 0, byRule: {} };
    this.privacy = {
      sessionAddress: ephemeralAddress(),
      egressAttempts: 0,
      egressBlocked: 0,
      egressBytesIntercepted: 0,
      fieldsRedacted: 0,
      networkRequests: 0,
      networkBytesOut: 0,
      networkBytesIn: 0,
    };
    this.log("info", `New session. Seed ${config.seed}, agent wallet ${this.addr()}, $${config.startCash.toLocaleString()} simulated cash.`);
    this.commit();
  }

  setRunning(running: boolean) {
    if (this.halted && running) return;
    this.running = running;
    this.commit();
  }

  setAgent(agent: AgentConfig) {
    const switched = agent.strategy !== this.config.agent.strategy || agent.symbol !== this.config.agent.symbol;
    this.config = { ...this.config, agent };
    if (switched) {
      const spec = STRATEGIES[agent.strategy];
      this.log("info", `Agent set to ${spec.name}${spec.usesSymbol ? ` on ${agent.symbol}` : ""}.`);
    }
    this.commit();
  }

  setPolicy(policy: PolicyConfig) {
    this.config = { ...this.config, policy };
    this.commit();
  }

  kill(reason = "Manual kill switch") {
    this.halt(reason);
    this.commit();
  }

  /** Align the simulated head with the real testnet head after an explicit, user-triggered read. */
  anchor(block: number, gasGwei: number, bytesOut: number, bytesIn: number) {
    this.block = block;
    this.gasGwei = gasGwei;
    this.anchored = true;
    this.privacy.networkRequests += 2;
    this.privacy.networkBytesOut += bytesOut;
    this.privacy.networkBytesIn += bytesIn;
    this.log("network", `Read head from ${CHAIN.rpcHost}: block ${block.toLocaleString()}, ${gasGwei.toFixed(4)} gwei. Sent ${bytesOut} B, nothing about you.`);
    this.commit();
  }

  networkFailed(message: string, bytesOut: number) {
    this.privacy.networkRequests += 1;
    this.privacy.networkBytesOut += bytesOut;
    this.log("network", `Testnet read failed: ${message}`);
    this.commit();
  }

  step() {
    if (this.halted) return;
    this.tick++;
    this.block += 1 + this.rng.int(4);
    this.gasGwei = Math.max(0.005, this.gasGwei * Math.exp(this.rng.normal() * 0.05));
    stepMarket(this.market, this.rng);

    const spec = STRATEGIES[this.config.agent.strategy];
    const intents = spec.decide({
      tick: this.tick,
      symbol: this.config.agent.symbol,
      params: this.config.agent.params,
      market: this.market,
      positions: this.positions,
      cash: this.cash,
      equity: this.equity(),
      lastTrade: this.lastTrade,
      rng: this.rng,
    });

    for (const intent of intents) {
      this.stats.intents++;
      if (intent.kind === "trade") this.handleTrade(intent);
      else this.handleEgress(intent);
    }

    const equity = this.equity();
    this.equityHistory.push(equity);
    if (this.equityHistory.length > 240) this.equityHistory.shift();
    this.peakEquity = Math.max(this.peakEquity, equity);
    const drawdown = ((this.peakEquity - equity) / this.peakEquity) * 100;
    this.maxDrawdown = Math.max(this.maxDrawdown, drawdown);
    if (drawdown >= this.config.policy.maxDrawdownPct)
      this.halt(`Drawdown ${drawdown.toFixed(1)}% hit the ${this.config.policy.maxDrawdownPct}% limit`);

    this.commit();
  }

  private handleTrade(intent: TradeIntent) {
    const verb = intent.side === "buy" ? "Buy" : "Sell";
    this.log("intent", `${verb} $${Math.round(intent.notional).toLocaleString()} ${intent.symbol}: ${intent.reason}`);
    const verdict = checkTrade(intent, this.config.policy, {
      tick: this.tick,
      halted: this.halted,
      cash: this.cash,
      equity: this.equity(),
      market: this.market,
      positions: this.positions,
      lastTrade: this.lastTrade,
    });
    if (!verdict.ok) return this.reject(verdict.rule, verdict.reason);

    this.stats.allowed++;
    const asset = this.market.get(intent.symbol)!;
    // Slippage grows with size: 5 bps per $10k.
    const slip = 0.0005 * (verdict.notional / 10_000);
    const price = asset.price * (intent.side === "buy" ? 1 + slip : 1 - slip);
    const qty = verdict.notional / price;
    const gasUsd = (95_000 + this.rng.int(45_000)) * this.gasGwei * 1e-9 * this.market.get("ETH")!.price;

    const pos = this.positions[intent.symbol] ?? { qty: 0, avgCost: 0 };
    if (intent.side === "buy") {
      this.cash -= verdict.notional;
      pos.avgCost = (pos.avgCost * pos.qty + verdict.notional) / (pos.qty + qty);
      pos.qty += qty;
    } else {
      this.cash += verdict.notional;
      pos.qty = Math.max(0, pos.qty - qty);
    }
    if (pos.qty * asset.price < 0.01) delete this.positions[intent.symbol];
    else this.positions[intent.symbol] = pos;
    this.cash -= gasUsd;
    this.gasSpent += gasUsd;
    this.lastTrade[intent.symbol] = this.tick;

    const trade: Trade = { tick: this.tick, symbol: intent.symbol, side: intent.side, qty, price, notional: verdict.notional, gasUsd, hash: this.rng.hex(32) };
    this.trades.push(trade);
    if (this.trades.length > MAX_TRADES) this.trades.shift();
    this.log("exec", `${verb === "Buy" ? "Bought" : "Sold"} ${qty.toFixed(4)} ${intent.symbol} @ $${price.toFixed(2)} · gas $${gasUsd.toFixed(4)} · tx ${redactAddress(trade.hash)}`);
  }

  private handleEgress(intent: EgressIntent) {
    this.privacy.egressAttempts++;
    this.privacy.egressBytesIntercepted += intent.bytes;
    this.log("intent", `Send ${intent.bytes.toLocaleString()} B to ${intent.host} [${intent.fields.join(", ")}]: ${intent.reason}`);
    const verdict = checkEgress(intent, this.config.policy);
    if (!verdict.ok) {
      this.privacy.egressBlocked++;
      return this.reject(verdict.rule, verdict.reason);
    }
    this.stats.allowed++;
    this.privacy.fieldsRedacted += verdict.redacted.length;
    const stripped = verdict.redacted.length ? ` Stripped ${verdict.redacted.join(", ")}.` : "";
    this.log("egress", `Allowed ${verdict.bytes.toLocaleString()} B to ${intent.host}.${stripped} Simulated: agent traffic never leaves the sandbox.`);
  }

  private reject(rule: Rule, reason: string) {
    this.stats.blocked++;
    this.stats.byRule[rule] = (this.stats.byRule[rule] ?? 0) + 1;
    this.log("block", `${RULE_LABELS[rule]}: ${reason}`, rule);
  }

  private halt(reason: string) {
    if (this.halted) return;
    this.halted = true;
    this.running = false;
    this.haltReason = reason;
    this.log("halt", `Halted. ${reason}.`);
  }

  private equity() {
    let total = this.cash;
    for (const [symbol, pos] of Object.entries(this.positions)) total += pos.qty * this.market.get(symbol)!.price;
    return total;
  }

  private addr() {
    const a = this.privacy.sessionAddress;
    return this.config.policy.redact ? redactAddress(a) : a;
  }

  private log(kind: EventKind, text: string, rule?: Rule) {
    this.events.unshift({ id: this.nextEventId++, tick: this.tick, block: this.block, kind, text, rule });
    if (this.events.length > MAX_EVENTS) this.events.pop();
  }

  private commit() {
    const equity = this.equity();
    this.snapshot = {
      config: this.config,
      tick: this.tick,
      block: this.block,
      gasGwei: this.gasGwei,
      running: this.running,
      halted: this.halted,
      haltReason: this.haltReason,
      anchoredToTestnet: this.anchored,
      market: [...this.market.values()].map((a) => ({
        symbol: a.symbol,
        name: a.name,
        price: a.price,
        changePct: (a.price / a.history[Math.max(0, a.history.length - 60)] - 1) * 100,
        history: a.history.slice(),
      })),
      cash: this.cash,
      positions: structuredClone(this.positions),
      equity,
      pnl: equity - this.config.startCash,
      pnlPct: (equity / this.config.startCash - 1) * 100,
      maxDrawdownPct: this.maxDrawdown,
      gasSpentUsd: this.gasSpent,
      equityHistory: this.equityHistory.slice(),
      trades: this.trades.slice(),
      events: this.events.slice(),
      stats: { ...this.stats, byRule: { ...this.stats.byRule } },
      privacy: { ...this.privacy },
    };
  }
}
