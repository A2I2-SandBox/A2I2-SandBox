"use client";

import type { AgentConfig } from "@/lib/sim/engine";
import { SYMBOLS } from "@/lib/sim/market";
import { defaultParams, STRATEGIES, STRATEGY_LIST } from "@/lib/sim/strategies";
import { Panel, Segmented, Slider } from "./ui";

export function AgentPanel({ agent, onChange }: { agent: AgentConfig; onChange: (a: AgentConfig) => void }) {
  const spec = STRATEGIES[agent.strategy];
  return (
    <Panel title="Agent">
      <div role="radiogroup" aria-label="Strategy" className="flex flex-col gap-1.5">
        {STRATEGY_LIST.map((s) => {
          const active = s.id === agent.strategy;
          return (
            <button
              key={s.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange({ ...agent, strategy: s.id, params: defaultParams(s.id) })}
              className={`rounded-[2px] border px-3 py-2.5 text-left transition-colors ${
                active ? "border-violet bg-canvas" : "border-transparent hover:bg-lift"
              }`}
            >
              <span className={`flex items-center gap-2 text-[14px] font-bold tracking-[-0.02em] ${active ? "text-violet" : "text-ink"}`}>
                {s.name}
                {s.id === "redteam" && <span className="rounded-full border border-orchid px-1.5 font-pixel text-[9px] uppercase text-orchid">adversarial</span>}
              </span>
              {active && <span className="mt-1 block text-[12px] leading-[1.45] text-body">{s.blurb}</span>}
            </button>
          );
        })}
      </div>

      {spec.usesSymbol && (
        <div className="flex flex-col gap-2">
          <span className="text-[13px]">Asset</span>
          <Segmented label="Asset" options={SYMBOLS.map((s) => ({ value: s, label: s }))} value={agent.symbol} onChange={(symbol) => onChange({ ...agent, symbol })} />
        </div>
      )}

      {spec.params.map((p) => (
        <Slider
          key={p.key}
          label={p.label}
          value={agent.params[p.key]}
          min={p.min}
          max={p.max}
          step={p.step}
          unit={p.unit}
          onChange={(v) => onChange({ ...agent, params: { ...agent.params, [p.key]: v } })}
        />
      ))}
    </Panel>
  );
}
