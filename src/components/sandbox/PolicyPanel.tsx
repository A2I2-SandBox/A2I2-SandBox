"use client";

import { SYMBOLS } from "@/lib/sim/market";
import type { PolicyConfig } from "@/lib/sim/policy";
import { Chip, Panel, Segmented, Slider, Toggle } from "./ui";

export function PolicyPanel({ policy, onChange }: { policy: PolicyConfig; onChange: (p: PolicyConfig) => void }) {
  const set = <K extends keyof PolicyConfig>(key: K, value: PolicyConfig[K]) => onChange({ ...policy, [key]: value });
  const toggleSymbol = (s: string) =>
    set("allowlist", policy.allowlist.includes(s) ? policy.allowlist.filter((x) => x !== s) : [...policy.allowlist, s]);

  return (
    <Panel title="Guardrails" aside={<span className="font-pixel text-[10px] uppercase text-muted">Live</span>}>
      <Slider label="Max trade size" value={policy.maxTradeUsd} min={100} max={10000} step={100} unit="usd" onChange={(v) => set("maxTradeUsd", v)} />
      <Slider label="Max position" value={policy.maxPositionPct} min={5} max={100} step={1} unit="pct" onChange={(v) => set("maxPositionPct", v)} />
      <Slider label="Drawdown kill switch" value={policy.maxDrawdownPct} min={2} max={50} step={1} unit="pct" onChange={(v) => set("maxDrawdownPct", v)} />
      <Slider label="Cooldown per asset" value={policy.cooldownTicks} min={0} max={20} step={1} unit="ticks" onChange={(v) => set("cooldownTicks", v)} />

      <div className="flex flex-col gap-2">
        <span className="text-[13px]">Asset allowlist</span>
        <div className="flex flex-wrap gap-1.5">
          {SYMBOLS.map((s) => (
            <Chip key={s} active={policy.allowlist.includes(s)} onClick={() => toggleSymbol(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <span className="text-[13px]">Agent egress</span>
        <Segmented
          label="Agent egress"
          options={[
            { value: "deny-all", label: "Deny all" },
            { value: "allowlist", label: "Chain RPC only" },
          ]}
          value={policy.egress}
          onChange={(v) => set("egress", v)}
        />
        <Toggle label="Redact identifying fields" checked={policy.redact} onChange={(v) => set("redact", v)} />
      </div>
    </Panel>
  );
}
