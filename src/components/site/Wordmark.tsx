import Link from "next/link";

/** Small-size rendering of the A2I2 logo: the broken square frame with the violet slash. */
export function Mark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path d="M3.5 10V3.5h17V10M3.5 14v6.5h17V14" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10.4h5.2l-1.3 3.2H7.2z" fill="var(--color-violet)" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-ink" aria-label="A2I2 Sandbox home">
      <Mark />
      <span className="text-[17px] font-bold tracking-[-0.03em]">A2I2</span>
      <span className="tag tag-plain hidden text-muted sm:inline-flex">Sandbox</span>
    </Link>
  );
}
