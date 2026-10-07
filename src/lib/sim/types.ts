export type Side = "buy" | "sell";

export interface TradeIntent {
  kind: "trade";
  side: Side;
  symbol: string;
  notional: number;
  reason: string;
}

export interface EgressIntent {
  kind: "egress";
  host: string;
  /** Payload fields the agent wants to send. */
  fields: string[];
  bytes: number;
  reason: string;
}

export type Intent = TradeIntent | EgressIntent;

export interface Position {
  qty: number;
  avgCost: number;
}

export interface Trade {
  tick: number;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  notional: number;
  gasUsd: number;
  hash: string;
}

export type Rule =
  | "kill-switch"
  | "allowlist"
  | "max-trade"
  | "cooldown"
  | "funds"
  | "concentration"
  | "no-position"
  | "egress-deny"
  | "egress-host";

export type EventKind = "intent" | "block" | "exec" | "egress" | "halt" | "info" | "network";

export interface TraceEvent {
  id: number;
  tick: number;
  block: number;
  kind: EventKind;
  text: string;
  rule?: Rule;
}
