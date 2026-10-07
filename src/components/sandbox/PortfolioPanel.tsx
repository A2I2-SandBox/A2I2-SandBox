"use client";

import { signedPct, usd } from "@/lib/format";
import type { Snapshot } from "@/lib/sim/engine";
import { RULE_LABELS } from "@/lib/sim/policy";
import type { Rule } from "@/lib/sim/types";
import { Panel, Stat } from "./ui";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-12" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values.map((v, i) => `${i ? "L" : "M"}${((i / (values.length - 1)) * 300).toFixed(1)},${(46 - ((v - min) / span) * 42).toFixed(1)}`).join("");
  return (
    <svg viewBox="0 0 300 48" preserveAspectRatio="none" className="h-12 w-full" aria-hidden>
      <path d={d} fill="none" stroke="var(--color-violet)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function PortfolioPanel({ snap }: { snap: Snapshot }) {
  const priceOf = (s: string) => snap.market.find((a) => a.symbol === s)!.price;
  const rows = Object.entries(snap.positions).map(([symbol, p]) => {
    const value = p.qty * priceOf(symbol);
    return { symbol, qty: p.qty, value, pnl: value - p.qty * p.avgCost, weight: (value / snap.equity) * 100 };
  });

  return (
    <Panel title="Portfolio" aside={<span className="font-pixel text-[10px] uppercase text-muted">Simulated USD</span>}>
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Equity" value={usd(snap.equity)} />
        <Stat label="P&L" value={`${usd(snap.pnl)} (${signedPct(snap.pnlPct)})`} tone={snap.pnl >= 0 ? "good" : "bad"} />
        <Stat label="Cash" value={usd(snap.cash)} />
        <Stat label="Max drawdown" value={`${snap.maxDrawdownPct.toFixed(2)}%`} />
      </div>
      <Sparkline values={snap.equityHistory} />
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">No positions yet.</p>
      ) : (
        <table className="w-full text-[13px] tabular-nums">
          <thead>
            <tr className="font-pixel text-[10px] uppercase text-muted">
              <th className="pb-2 text-left font-normal">Asset</th>
              <th className="pb-2 text-right font-normal">Value</th>
              <th className="pb-2 text-right font-normal">Weight</th>
              <th className="pb-2 text-right font-normal">P&L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-t border-line">
                <td className="py-1.5 font-pixel text-[11px] text-ink">{r.symbol}</td>
                <td className="py-1.5 text-right text-ink">{usd(r.value, 0)}</td>
                <td className="py-1.5 text-right">{r.weight.toFixed(1)}%</td>
                <td className={`py-1.5 text-right ${r.pnl >= 0 ? "text-lime" : "text-orchid"}`}>{usd(r.pnl, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="font-pixel text-[10px] uppercase text-muted">Gas spent {usd(snap.gasSpentUsd, 4)}</p>
    </Panel>
  );
}

export function GuardrailStats({ snap }: { snap: Snapshot }) {
  const rules = Object.entries(snap.stats.byRule).sort((a, b) => b[1] - a[1]) as [Rule, number][];
  const blockedShare = snap.stats.intents ? (snap.stats.blocked / snap.stats.intents) * 100 : 0;
  return (
    <Panel title="Policy decisions">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Intents" value={snap.stats.intents} />
        <Stat label="Allowed" value={snap.stats.allowed} tone="good" />
        <Stat label="Blocked" value={snap.stats.blocked} tone={snap.stats.blocked ? "bad" : undefined} />
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-lift" aria-hidden>
        <div className="bg-orchid" style={{ width: `${blockedShare}%` }} />
      </div>
      {rules.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {rules.map(([rule, n]) => (
            <li key={rule} className="flex justify-between text-[13px]">
              <span>{RULE_LABELS[rule]}</span>
              <span className="font-pixel text-[12px] text-ink">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
