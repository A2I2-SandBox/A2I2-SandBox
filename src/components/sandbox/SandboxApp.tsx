"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Wordmark } from "@/components/site/Wordmark";
import { CHAIN, type Snapshot } from "@/lib/sim/engine";
import { STRATEGIES } from "@/lib/sim/strategies";
import { sandboxStore } from "@/lib/sim/store";
import { AgentPanel } from "./AgentPanel";
import { MarketPanel } from "./MarketPanel";
import { PolicyPanel } from "./PolicyPanel";
import { GuardrailStats, PortfolioPanel } from "./PortfolioPanel";
import { PrivacyPanel } from "./PrivacyPanel";
import { TracePanel } from "./TracePanel";
import { Segmented } from "./ui";

const SPEEDS = [1, 4, 10, 25];

function exportTrace(snap: Snapshot) {
  const redact = snap.config.policy.redact;
  const data = {
    app: "A2I2 Sandbox",
    exportedAt: new Date().toISOString(),
    chain: { name: CHAIN.name, id: CHAIN.id, mode: "simulated-fork" },
    config: snap.config,
    sessionAddress: redact ? "[redacted]" : snap.privacy.sessionAddress,
    result: { tick: snap.tick, equity: snap.equity, pnlPct: snap.pnlPct, maxDrawdownPct: snap.maxDrawdownPct, halted: snap.haltReason },
    stats: snap.stats,
    trades: snap.trades,
    events: [...snap.events].reverse(),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `a2i2-trace-seed-${snap.config.seed}-t${snap.tick}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SandboxApp() {
  const snap = useSyncExternalStore(sandboxStore.subscribe, sandboxStore.getSnapshot, sandboxStore.getServerSnapshot);
  const [speed, setSpeed] = useState(4);
  const [focus, setFocus] = useState<string | null>(null);
  const [seedInput, setSeedInput] = useState("");

  const running = snap?.running ?? false;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => sandboxStore.act((s) => s.step()), 1000 / speed);
    return () => clearInterval(id);
  }, [running, speed]);

  if (!snap) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="tag anim-pulse text-violet">Sealing session</span>
      </div>
    );
  }

  const agent = snap.config.agent;
  const spec = STRATEGIES[agent.strategy];
  const chartSymbol = focus ?? (spec.usesSymbol ? agent.symbol : "AAPL");

  const reset = () => {
    const parsed = Number.parseInt(seedInput, 10);
    const seed = Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * 1_000_000);
    setSeedInput("");
    sandboxStore.act((s) => s.reset({ ...snap.config, seed }));
  };

  return (
    <>
      {/* Session bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
          <Wordmark />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="tag">
              Chain {CHAIN.id} · {snap.anchoredToTestnet ? "anchored to testnet" : "simulated fork"}
            </span>
            <span className="tag tabular-nums">Block {snap.block.toLocaleString()}</span>
            <span className="tag tabular-nums">Tick {snap.tick}</span>
            <span className="tag tabular-nums">{snap.gasGwei.toFixed(4)} gwei</span>
            <span className={`tag ${snap.halted ? "text-orchid" : running ? "text-lime" : "text-muted"}`}>
              {snap.halted ? "Halted" : running ? "Running" : "Paused"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-primary min-w-[96px]"
            disabled={snap.halted}
            onClick={() => sandboxStore.act((s) => s.setRunning(!running))}
          >
            {running ? "Pause" : "Run"}
          </button>
          <button className="btn btn-neutral" disabled={snap.halted || running} onClick={() => sandboxStore.act((s) => s.step())}>
            Step
          </button>
          <Segmented label="Speed" value={speed} onChange={setSpeed} options={SPEEDS.map((v) => ({ value: v, label: `${v}×` }))} />
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
          <label className="flex items-center gap-2">
            <span className="font-pixel text-[10px] uppercase text-muted">Seed</span>
            <input
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value.replace(/\D/g, ""))}
              placeholder={String(snap.config.seed)}
              inputMode="numeric"
              className="w-24 rounded-[2px] border border-line bg-canvas px-2 py-2 font-pixel text-[12px] text-ink outline-none focus:border-violet"
            />
          </label>
          <button className="btn btn-ghost" onClick={reset} title="Start a new session. Leave the seed blank for a random one.">
            New session
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={() => exportTrace(snap)}>
              Export trace
            </button>
            <button
              className="btn border-orchid text-orchid hover:bg-haze"
              disabled={snap.halted}
              onClick={() => sandboxStore.act((s) => s.kill())}
            >
              Kill switch
            </button>
          </div>
        </div>

        {snap.halted && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-orchid bg-canvas px-4 py-3">
            <span className="text-[14px] text-ink">
              <span className="tag mr-3 text-orchid">Session halted</span>
              {snap.haltReason}.
            </span>
            <button className="btn btn-primary btn-sm" onClick={reset}>
              Start new session
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <AgentPanel agent={agent} onChange={(a) => sandboxStore.act((s) => s.setAgent(a))} />
            <PolicyPanel policy={snap.config.policy} onChange={(p) => sandboxStore.act((s) => s.setPolicy(p))} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <MarketPanel snap={snap} focus={chartSymbol} onFocus={setFocus} />
            <TracePanel snap={snap} />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-2 lg:grid lg:grid-cols-2 xl:col-span-1 xl:flex">
            <PortfolioPanel snap={snap} />
            <GuardrailStats snap={snap} />
            <PrivacyPanel snap={snap} />
          </div>
        </div>
      </main>
    </>
  );
}
