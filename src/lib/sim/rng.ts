// Seeded PRNG (mulberry32). Every market path and tx hash in a session
// derives from the seed, so a run can be replayed exactly.
export class Rng {
  constructor(private state: number) {}

  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Standard normal via Box–Muller. */
  normal(): number {
    const u = 1 - this.next();
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }

  hex(bytes: number): string {
    let out = "0x";
    for (let i = 0; i < bytes; i++) out += this.int(256).toString(16).padStart(2, "0");
    return out;
  }
}

/** Address for the session's agent wallet. Uses real entropy, never the seed, and is never persisted. */
export function ephemeralAddress(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
