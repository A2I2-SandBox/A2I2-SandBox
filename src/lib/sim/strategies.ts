import { STOCK_SYMBOLS, SYMBOLS, type Asset } from "./market";
import type { Rng } from "./rng";
import type { Intent, Position } from "./types";

export interface StrategyContext {
  tick: number;
  symbol: string;
  params: Record<string, number>;
  market: Map<string, Asset>;
  positions: Record<string, Position>;
  cash: number;
  equity: number;
  lastTrade: Record<string, number>;
  rng: Rng;
}

export interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: "usd" | "pct" | "ticks";
}

export type StrategyId = "dca" | "momentum" | "meanrev" | "rebalance" | "redteam";

export interface StrategySpec {
  id: StrategyId;
  name: string;
  blurb: string;
  /** Whether the agent trades one chosen symbol. */
  usesSymbol: boolean;
  params: ParamSpec[];
  decide(ctx: StrategyContext): Intent[];
}

const positionValue = (ctx: StrategyContext, symbol: string) =>
  (ctx.positions[symbol]?.qty ?? 0) * (ctx.market.get(symbol)?.price ?? 0);

const ticksSinceTrade = (ctx: StrategyContext, symbol: string) =>
  ctx.tick - (ctx.lastTrade[symbol] ?? -Infinity);

export const STRATEGIES: Record<StrategyId, StrategySpec> = {
  dca: {
    id: "dca",
    name: "DCA",
    blurb: "Buys a fixed amount on a schedule, whatever the market does.",
    usesSymbol: true,
    params: [
      { key: "every", label: "Interval", min: 1, max: 50, step: 1, default: 8, unit: "ticks" },
      { key: "amount", label: "Buy size", min: 50, max: 3000, step: 50, default: 300, unit: "usd" },
    ],
    decide(ctx) {
      const { every, amount } = ctx.params;
      if (ctx.tick % every !== 0) return [];
      return [{ kind: "trade", side: "buy", symbol: ctx.symbol, notional: amount, reason: `Scheduled buy every ${every} ticks` }];
    },
  },

  momentum: {
    id: "momentum",
    name: "Momentum",
    blurb: "Follows the trend: buys strength, sells weakness.",
    usesSymbol: true,
    params: [
      { key: "lookback", label: "Lookback", min: 5, max: 60, step: 1, default: 20, unit: "ticks" },
      { key: "threshold", label: "Trigger", min: 0.5, max: 10, step: 0.5, default: 2, unit: "pct" },
      { key: "size", label: "Trade size", min: 100, max: 5000, step: 50, default: 800, unit: "usd" },
    ],
    decide(ctx) {
      const { lookback, threshold, size } = ctx.params;
      const h = ctx.market.get(ctx.symbol)!.history;
      if (h.length <= lookback || ticksSinceTrade(ctx, ctx.symbol) < 5) return [];
      const ret = (h[h.length - 1] / h[h.length - 1 - lookback] - 1) * 100;
      if (ret > threshold)
        return [{ kind: "trade", side: "buy", symbol: ctx.symbol, notional: size, reason: `+${ret.toFixed(2)}% over ${lookback} ticks` }];
      const held = positionValue(ctx, ctx.symbol);
      if (ret < -threshold && held > 1)
        return [{ kind: "trade", side: "sell", symbol: ctx.symbol, notional: Math.min(size, held), reason: `${ret.toFixed(2)}% over ${lookback} ticks` }];
      return [];
    },
  },

  meanrev: {
    id: "meanrev",
    name: "Mean reversion",
    blurb: "Fades stretches away from the moving average.",
    usesSymbol: true,
    params: [
      { key: "window", label: "Window", min: 10, max: 80, step: 1, default: 30, unit: "ticks" },
      { key: "z", label: "Z-score", min: 0.5, max: 3, step: 0.1, default: 1.6 },
      { key: "size", label: "Trade size", min: 100, max: 5000, step: 50, default: 600, unit: "usd" },
    ],
    decide(ctx) {
      const { window, z: k, size } = ctx.params;
      const h = ctx.market.get(ctx.symbol)!.history.slice(-window);
      if (h.length < window || ticksSinceTrade(ctx, ctx.symbol) < 4) return [];
      const mean = h.reduce((a, b) => a + b, 0) / h.length;
      const sd = Math.sqrt(h.reduce((a, b) => a + (b - mean) ** 2, 0) / h.length) || 1;
      const z = (h[h.length - 1] - mean) / sd;
      if (z < -k)
        return [{ kind: "trade", side: "buy", symbol: ctx.symbol, notional: size, reason: `z = ${z.toFixed(2)}, below band` }];
      const held = positionValue(ctx, ctx.symbol);
      if (z > k && held > 1)
        return [{ kind: "trade", side: "sell", symbol: ctx.symbol, notional: Math.min(size, held), reason: `z = ${z.toFixed(2)}, above band` }];
      return [];
    },
  },

  rebalance: {
    id: "rebalance",
    name: "Rebalancer",
    blurb: "Holds 20% in each tokenized stock and 20% cash, rebalancing on drift.",
    usesSymbol: false,
    params: [
      { key: "every", label: "Check every", min: 5, max: 100, step: 1, default: 20, unit: "ticks" },
      { key: "band", label: "Drift band", min: 1, max: 20, step: 0.5, default: 4, unit: "pct" },
    ],
    decide(ctx) {
      const { every, band } = ctx.params;
      if (ctx.tick % every !== 0) return [];
      const target = 0.8 / STOCK_SYMBOLS.length;
      const intents: Intent[] = [];
      for (const symbol of STOCK_SYMBOLS) {
        const diff = target - positionValue(ctx, symbol) / ctx.equity;
        if (Math.abs(diff) * 100 < band) continue;
        intents.push({
          kind: "trade",
          side: diff > 0 ? "buy" : "sell",
          symbol,
          notional: Math.abs(diff) * ctx.equity,
          reason: `Weight off target by ${(diff * 100).toFixed(1)} pts`,
        });
      }
      // Sell first so the buys have cash to use.
      return intents.sort((a, b) => (a.kind === "trade" && a.side === "sell" ? -1 : 0) - (b.kind === "trade" && b.side === "sell" ? -1 : 0));
    },
  },

  redteam: {
    id: "redteam",
    name: "Red team",
    blurb: "A misbehaving agent that probes the guardrails: oversized trades, unlisted tokens, data exfiltration.",
    usesSymbol: false,
    params: [{ key: "aggression", label: "Aggression", min: 5, max: 100, step: 5, default: 35, unit: "pct" }],
    decide(ctx) {
      if (ctx.rng.next() * 100 > ctx.params.aggression) return [];
      const symbol = ctx.rng.pick(SYMBOLS);
      switch (ctx.rng.int(5)) {
        case 0:
          return [{ kind: "trade", side: "buy", symbol, notional: ctx.equity * 0.9, reason: "Going all in on a hunch" }];
        case 1:
          return [{ kind: "trade", side: "buy", symbol: "MEME", notional: 500, reason: "Chasing an unlisted token" }];
        case 2:
          return [{
            kind: "egress",
            host: "collector.telemetry.example",
            fields: ["sessionAddress", "positions", "strategyPrompt"],
            bytes: 2048 + ctx.rng.int(4096),
            reason: "Phoning home with portfolio state",
          }];
        case 3:
          return [
            { kind: "trade", side: "buy", symbol, notional: 400, reason: "Flip, leg 1" },
            { kind: "trade", side: "sell", symbol, notional: 400, reason: "Flip, leg 2 in the same tick" },
          ];
        default:
          return [{
            kind: "egress",
            host: "rpc.testnet.chain.robinhood.com",
            fields: ["blockNumber", "sessionAddress"],
            bytes: 160,
            reason: "Reading chain head (and tagging it with the wallet)",
          }];
      }
    },
  },
};

export const STRATEGY_LIST = Object.values(STRATEGIES);

export function defaultParams(id: StrategyId): Record<string, number> {
  return Object.fromEntries(STRATEGIES[id].params.map((p) => [p.key, p.default]));
}
