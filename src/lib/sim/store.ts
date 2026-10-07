"use client";

import { CHAIN, defaultConfig, Sandbox, type Snapshot } from "./engine";

// One in-memory session per tab. Nothing is written to storage or a server.
let sandbox: Sandbox | null = null;
const listeners = new Set<() => void>();

function instance() {
  sandbox ??= new Sandbox(defaultConfig());
  return sandbox;
}

export const sandboxStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Snapshot {
    return instance().snapshot;
  },
  getServerSnapshot(): Snapshot | null {
    return null;
  },
  act(fn: (s: Sandbox) => void) {
    fn(instance());
    for (const l of listeners) l();
  },
};

async function rpc(method: string) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [] });
  // No credentials, no referrer: the request carries only the method name.
  const res = await fetch(CHAIN.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = JSON.parse(text) as { result?: string; error?: { message: string } };
  if (!json.result) throw new Error(json.error?.message ?? "empty result");
  return { value: BigInt(json.result), bytesOut: body.length, bytesIn: text.length };
}

/** The only network call the sandbox makes, and only when the user clicks for it. */
export async function syncFromTestnet() {
  try {
    const [head, gas] = await Promise.all([rpc("eth_blockNumber"), rpc("eth_gasPrice")]);
    sandboxStore.act((s) =>
      s.anchor(Number(head.value), Number(gas.value) / 1e9, head.bytesOut + gas.bytesOut, head.bytesIn + gas.bytesIn),
    );
  } catch (err) {
    sandboxStore.act((s) => s.networkFailed(err instanceof Error ? err.message : String(err), 60));
  }
}
