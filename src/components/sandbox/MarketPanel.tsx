"use client";

import { signedPct } from "@/lib/format";
import type { Snapshot } from "@/lib/sim/engine";
import { Panel } from "./ui";

const W = 640;
const H = 240;
const PAD = { l: 8, r: 64, t: 12, b: 20 };

function PriceChart({ history, trades, tick }: { history: number[]; trades: Snapshot["trades"]; tick: number }) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;
  const x = (i: number) => PAD.l + (i / (history.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);
  const line = history.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = `${line}L${x(history.length - 1)},${H - PAD.b}L${x(0)},${H - PAD.b}Z`;
  const ticks = [max, (max + min) / 2, min];
  const last = history[history.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Price history with agent trades">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray="2 4" />
          <text x={W - PAD.r + 8} y={y(v) + 4} className="fill-muted font-pixel text-[11px]">
            {v.toFixed(2)}
          </text>
        </g>
      ))}
      <path d={area} fill="var(--color-violet)" fillOpacity={0.06} />
      <path d={line} fill="none" stroke="var(--color-violet)" strokeWidth={1.6} strokeLinejoin="round" />
      {trades.map((t) => {
        const i = history.length - 1 - (tick - t.tick);
        if (i < 0) return null;
        const cx = x(i);
        const cy = y(Math.min(max, Math.max(min, t.price)));
        return t.side === "buy" ? (
          <path key={t.hash} d={`M${cx},${cy + 6}l5,9h-10z`} fill="var(--color-lime)">
            <title>{`Buy $${t.notional.toFixed(0)} @ ${t.price.toFixed(2)}`}</title>
          </path>
        ) : (
          <path key={t.hash} d={`M${cx},${cy - 6}l5,-9h-10z`} fill="var(--color-orchid)">
            <title>{`Sell $${t.notional.toFixed(0)} @ ${t.price.toFixed(2)}`}</title>
          </path>
        );
      })}
      <circle cx={x(history.length - 1)} cy={y(last)} r={3.5} fill="var(--color-violet)" />
    </svg>
  );
}

export function MarketPanel({ snap, focus, onFocus }: { snap: Snapshot; focus: string; onFocus: (s: string) => void }) {
  const asset = snap.market.find((a) => a.symbol === focus) ?? snap.market[0];
  return (
    <Panel
      title="Market · simulated fork"
      aside={
        <span className="flex items-center gap-3 font-pixel text-[10px] uppercase text-muted">
          <span className="flex items-center gap-1"><span className="inline-block size-2 bg-lime [clip-path:polygon(50%_0,100%_100%,0_100%)]" /> buy</span>
          <span className="flex items-center gap-1"><span className="inline-block size-2 bg-orchid [clip-path:polygon(0_0,100%_0,50%_100%)]" /> sell</span>
        </span>
      }
    >
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {snap.market.map((a) => {
          const active = a.symbol === asset.symbol;
          return (
            <button
              key={a.symbol}
              onClick={() => onFocus(a.symbol)}
              aria-pressed={active}
              className={`flex min-w-[112px] flex-col gap-0.5 rounded-[2px] border px-3 py-2 text-left transition-colors ${
                active ? "border-violet bg-canvas" : "border-line hover:bg-lift"
              }`}
            >
              <span className={`font-pixel text-[11px] uppercase ${active ? "text-violet" : "text-ink"}`}>{a.symbol}</span>
              <span className="text-[14px] font-bold tabular-nums text-ink">${a.price.toFixed(2)}</span>
              <span className={`font-pixel text-[10px] ${a.changePct >= 0 ? "text-lime" : "text-orchid"}`}>{signedPct(a.changePct)}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-body">{asset.name}</span>
        <span className="font-pixel text-[10px] uppercase text-muted">last {asset.history.length} ticks</span>
      </div>
      <PriceChart history={asset.history} trades={snap.trades.filter((t) => t.symbol === asset.symbol)} tick={snap.tick} />
    </Panel>
  );
}
