import Image from "next/image";
import Link from "next/link";
import { GuardIcon, IsolateIcon, ObserveIcon, SimulateIcon } from "@/components/site/icons";
import { IsoSandbox } from "@/components/site/IsoSandbox";
import { Nav } from "@/components/site/Nav";
import { SocialLinks } from "@/components/site/Social";
import { WaveField } from "@/components/site/WaveField";
import { Mark } from "@/components/site/Wordmark";
import { CHAIN } from "@/lib/sim/engine";

const FEATURES = [
  {
    icon: IsolateIcon,
    title: "Isolate",
    body: "Each run is a sealed session with a throwaway wallet, an in-memory chain fork and no account. Close the tab and it's gone.",
  },
  {
    icon: SimulateIcon,
    title: "Simulate",
    body: "Synthetic tokenized-stock and ETH markets on seeded price paths, so any experiment replays block for block.",
  },
  {
    icon: GuardIcon,
    title: "Guard",
    body: "Every intent passes the policy before it executes: trade caps, allowlists, cooldowns, concentration limits and a drawdown kill switch.",
  },
  {
    icon: ObserveIcon,
    title: "Observe",
    body: "A full decision trace shows what the agent wanted, what the policy allowed, what executed and what it cost in gas.",
  },
];

const PRIVACY_POINTS = [
  ["No accounts", "Nothing to sign up for, nothing tied to you."],
  ["No server", "The simulation runs entirely in your browser tab."],
  ["Egress intercepted", "Agent network calls are caught and checked. None of them are actually sent."],
  ["Redacted by default", "Wallet addresses and strategy state are stripped from traces and payloads."],
];

const STEPS = [
  ["01", "Pick an agent", "DCA, momentum, mean reversion, a rebalancer, or a red-team agent that tries to break the rules."],
  ["02", "Set the guardrails", "Choose what the agent may touch, how much it can risk, and where its data may go."],
  ["03", "Run, step, replay", "Watch decisions at block speed, pause on any tick, and replay the same seed to compare policies."],
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line">
          <WaveField />
          <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-4 pt-20 text-center sm:px-6 sm:pt-28">
            <span className="tag text-violet">Privacy-first · Robinhood Chain</span>
            <h1 className="display mt-6 max-w-[880px] text-[44px] text-violet sm:text-[72px]">
              Agents need a safe place to be wrong
            </h1>
            <p className="mt-6 max-w-[560px] text-[16px] leading-[1.55] text-body">
              A2I2 Sandbox is an isolated lab for AI agent experiments on Robinhood Chain. Run strategies against a
              simulated fork, enforce guardrails before any transaction, and keep every byte of your data on your machine.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/sandbox" className="btn btn-primary">
                Launch sandbox
              </Link>
              <Link href="#privacy" className="btn btn-ghost">
                How it stays private <span aria-hidden>→</span>
              </Link>
            </div>
            <IsoSandbox className="mt-10 w-full max-w-[600px]" />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-[640px] text-center">
            <span className="tag">What the sandbox does</span>
            <h2 className="display mt-5 text-[32px] text-ink sm:text-[44px]">Four walls around every experiment</h2>
            <p className="mt-4 text-[16px] leading-[1.55]">
              Agents get room to act, but they can&apos;t reach real funds, real keys or your data.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="panel flex flex-col gap-4 p-6">
                <span className="text-violet">
                  <Icon />
                </span>
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
                <p className="text-[14px] leading-[1.55]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Privacy split */}
        <section id="privacy" className="scroll-mt-20 border-y border-line bg-panel">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
            <div>
              <span className="tag">Privacy model</span>
              <h2 className="display mt-5 text-[32px] text-violet sm:text-[44px]">Nothing leaves the box unless you send it</h2>
              <p className="mt-5 max-w-[520px] text-[16px] leading-[1.55]">
                The sandbox makes one kind of network request: a read of the testnet head, and only when you click for
                it. Everything else, including agent traffic, is simulated, intercepted and logged in a ledger you can
                inspect.
              </p>
              <dl className="mt-8 grid gap-px overflow-hidden rounded-[2px] border border-line bg-line sm:grid-cols-2">
                {PRIVACY_POINTS.map(([k, v]) => (
                  <div key={k} className="bg-canvas p-5">
                    <dt className="tag text-violet">{k}</dt>
                    <dd className="mt-3 text-[14px] leading-[1.5]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative overflow-hidden rounded-[2px] border border-line bg-canvas">
              <Image
                src="/brand/a2i2banner.png"
                alt="A glass cube containing a network of nodes, with data streams flowing past"
                width={2056}
                height={765}
                className="h-[320px] w-full object-cover sm:h-[400px]"
                priority={false}
              />
              <span className="tag absolute left-4 top-4 bg-canvas/80 px-2 py-1.5">Sealed session</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <span className="tag">How it works</span>
              <h2 className="display mt-5 text-[32px] text-ink sm:text-[40px]">Three steps, one tab</h2>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-[2px] border border-line bg-line">
              {STEPS.map(([n, title, body]) => (
                <li key={n} className="grid gap-2 bg-canvas p-6 sm:grid-cols-[80px_200px_1fr] sm:items-baseline sm:gap-6">
                  <span className="font-pixel text-[13px] text-violet">{n}</span>
                  <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
                  <p className="text-[14px] leading-[1.55]">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Chain band */}
        <section id="chain" className="scroll-mt-20 bg-violet text-white">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <span className="tag text-white">{CHAIN.name}</span>
              <span className="tag text-white">Chain ID {CHAIN.id}</span>
              <span className="tag text-white">Arbitrum Orbit L2</span>
              <span className="tag text-white">ETH gas</span>
            </div>
            <p className="max-w-[440px] text-[14px] leading-[1.5] text-white/85">
              The sandbox simulates a fork locally. No real funds, no signing, no private keys stored.
            </p>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative overflow-hidden">
          <div className="grid-floor absolute inset-0 opacity-60" aria-hidden />
          <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-4 py-24 text-center sm:px-6">
            <h2 className="display max-w-[640px] text-[32px] text-ink sm:text-[44px]">
              Let the agent break things <span className="text-violet">here</span>
            </h2>
            <Link href="/sandbox" className="btn btn-primary mt-8">
              Launch sandbox
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-8 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2 text-ink">
            <Mark className="size-5" /> <span className="font-bold">A2I2 Sandbox</span>
          </span>
          <div className="flex items-center gap-4">
            <span>Experimental. Simulated markets only. Not financial advice.</span>
            <SocialLinks />
          </div>
        </div>
      </footer>
    </>
  );
}
