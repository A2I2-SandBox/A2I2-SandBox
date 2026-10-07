"use client";

import { useState } from "react";
import { bytes } from "@/lib/format";
import { CHAIN, redactAddress, type Snapshot } from "@/lib/sim/engine";
import { syncFromTestnet } from "@/lib/sim/store";
import { Panel } from "./ui";

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "signal" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 text-[13px] last:border-0">
      <span>{label}</span>
      <span className={`font-pixel text-[12px] ${tone === "good" ? "text-lime" : tone === "signal" ? "text-violet" : "text-ink"}`}>{value}</span>
    </div>
  );
}

export function PrivacyPanel({ snap }: { snap: Snapshot }) {
  const [syncing, setSyncing] = useState(false);
  const p = snap.privacy;
  const redact = snap.config.policy.redact;

  async function sync() {
    setSyncing(true);
    await syncFromTestnet();
    setSyncing(false);
  }

  return (
    <Panel title="Privacy ledger" aside={<span className="tag text-lime">Local only</span>}>
      <div>
        <Row label="Agent wallet" value={redact ? redactAddress(p.sessionAddress) : p.sessionAddress} />
        <Row label="Stored on a server" value="nothing" tone="good" />
        <Row label="Saved to this device" value="nothing" tone="good" />
        <Row label="Agent egress attempts" value={String(p.egressAttempts)} />
        <Row label="Blocked" value={String(p.egressBlocked)} />
        <Row label="Intercepted (never sent)" value={bytes(p.egressBytesIntercepted)} tone="signal" />
        <Row label="Fields redacted" value={String(p.fieldsRedacted)} />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-baseline justify-between">
          <span className="tag">Real network</span>
          <span className="font-pixel text-[11px] text-ink">
            {p.networkRequests} req · ↑{bytes(p.networkBytesOut)} ↓{bytes(p.networkBytesIn)}
          </span>
        </div>
        <p className="text-[12px] leading-[1.5] text-muted">
          Reads the current block and gas price from <span className="font-pixel text-ink">{CHAIN.rpcHost}</span>. Two JSON-RPC
          calls with no wallet, no cookies and no referrer. Nothing else in the sandbox touches the network.
        </p>
        <button className="btn btn-ghost btn-sm" onClick={sync} disabled={syncing}>
          {syncing ? "Reading…" : snap.anchoredToTestnet ? "Re-sync testnet head" : "Sync testnet head"}
        </button>
      </div>
    </Panel>
  );
}
