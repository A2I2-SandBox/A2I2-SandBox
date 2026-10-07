"use client";

import { useState } from "react";
import type { Snapshot } from "@/lib/sim/engine";
import type { EventKind, TraceEvent } from "@/lib/sim/types";
import { Panel, Segmented } from "./ui";

const KIND_STYLE: Record<EventKind, { label: string; className: string }> = {
  intent: { label: "intent", className: "text-muted" },
  block: { label: "block", className: "text-orchid" },
  exec: { label: "exec", className: "text-lime" },
  egress: { label: "egress", className: "text-violet" },
  network: { label: "net", className: "text-violet" },
  halt: { label: "halt", className: "text-orchid font-bold" },
  info: { label: "info", className: "text-muted" },
};

type Filter = "all" | "decisions" | "blocked" | "privacy";

const FILTERS: Record<Filter, (e: TraceEvent) => boolean> = {
  all: () => true,
  decisions: (e) => e.kind === "exec" || e.kind === "block" || e.kind === "halt",
  blocked: (e) => e.kind === "block" || e.kind === "halt",
  privacy: (e) => e.kind === "egress" || e.kind === "network" || (e.kind === "block" && !!e.rule?.startsWith("egress")),
};

export function TracePanel({ snap }: { snap: Snapshot }) {
  const [filter, setFilter] = useState<Filter>("all");
  const events = snap.events.filter(FILTERS[filter]);

  return (
    <Panel
      title="Decision trace"
      aside={
        <Segmented
          label="Filter trace"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "decisions", label: "Decisions" },
            { value: "blocked", label: "Blocked" },
            { value: "privacy", label: "Privacy" },
          ]}
        />
      }
    >
      <ol className="-mx-4 -my-4 max-h-[420px] overflow-y-auto font-pixel text-[11.5px] leading-[1.5]" aria-live="off">
        {events.length === 0 && <li className="px-4 py-6 text-muted">Nothing here yet. Press run or step.</li>}
        {events.map((e) => {
          const style = KIND_STYLE[e.kind];
          return (
            <li key={e.id} className="grid grid-cols-[52px_56px_1fr] gap-2 border-b border-line px-4 py-1.5 last:border-0">
              <span className="text-muted">T{e.tick}</span>
              <span className={`uppercase ${style.className}`}>{style.label}</span>
              <span className={e.kind === "intent" || e.kind === "info" ? "text-body" : "text-ink"}>{e.text}</span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
