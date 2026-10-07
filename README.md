# A2I2 Sandbox

A privacy-first sandbox for AI agent experiments on Robinhood Chain.

Agents run against a **simulated fork** of Robinhood Chain Testnet (chain ID 46630) inside the browser tab. Every intent an agent produces passes a policy layer before it executes, and every byte an agent tries to send out is intercepted and logged.

## Run it

```bash
npm install
npm run dev -- --port 3200
```

Open http://localhost:3200. Go to `/sandbox` for the workspace.

## What's inside

| Path | What it is |
|------|------------|
| `src/lib/sim/market.ts` | Seeded GBM price paths for ETH and tokenized stocks (synthetic prices) |
| `src/lib/sim/strategies.ts` | Agents: DCA, momentum, mean reversion, rebalancer, red team |
| `src/lib/sim/policy.ts` | Guardrails: trade cap, allowlist, cooldown, concentration, egress rules, redaction |
| `src/lib/sim/engine.ts` | The step loop: market → agent intents → policy → execution → trace |
| `src/lib/sim/store.ts` | In-memory session store, plus the one opt-in network call (testnet head read) |
| `src/components/sandbox/` | Workspace UI |
| `src/components/site/` | Landing page pieces, including the isometric sandbox illustration |

## Privacy model

- No accounts, no backend, nothing written to storage. Close the tab and the session is gone.
- The agent wallet is a throwaway address made from local entropy and is never persisted.
- Agent egress is never actually sent. The policy decides whether it *would* be allowed and strips identifying fields when redaction is on.
- The only real request is **Sync testnet head**, which runs only on click: two JSON-RPC calls (`eth_blockNumber`, `eth_gasPrice`) to `rpc.testnet.chain.robinhood.com`, with no credentials and no referrer.

## Design

The structure follows the Vana reference (flat surface stack with no shadows, 2px corners, mono metadata labels with dot prefixes, one signal color). The palette follows the A2I2 logo and banner: white canvas, ink black, electric violet `#4b22f4`. Tokens live in `src/app/globals.css`.

Simulated markets only. Not financial advice.
