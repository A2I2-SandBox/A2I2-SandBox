"use client";

import type { ReactNode } from "react";

export function Panel({ title, aside, children, className = "" }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="tag">{title}</h2>
        {aside}
      </header>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </section>
  );
}

export function formatValue(value: number, unit?: "usd" | "pct" | "ticks") {
  if (unit === "usd") return `$${value.toLocaleString()}`;
  if (unit === "pct") return `${value}%`;
  if (unit === "ticks") return `${value} ${value === 1 ? "tick" : "ticks"}`;
  return String(value);
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: "usd" | "pct" | "ticks";
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between text-[13px]">
        <span className="text-body">{label}</span>
        <span className="font-pixel text-[12px] text-ink">{formatValue(value, unit)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[2px] border border-line bg-canvas p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-[2px] px-2.5 py-1.5 font-pixel text-[11px] uppercase transition-colors ${
            o.value === value ? "bg-violet text-white" : "text-body hover:bg-lift"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-pixel text-[11px] uppercase transition-colors ${
        active ? "border-violet bg-haze text-violet" : "border-line text-muted line-through hover:border-line-strong"
      }`}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[13px]">
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-violet" : "bg-steel"}`}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "good" | "bad" | "signal" }) {
  const color = tone === "good" ? "text-lime" : tone === "bad" ? "text-orchid" : tone === "signal" ? "text-violet" : "text-ink";
  return (
    <div className="flex flex-col gap-1">
      <span className="font-pixel text-[10px] uppercase text-muted">{label}</span>
      <span className={`text-[15px] font-bold tracking-[-0.02em] tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
