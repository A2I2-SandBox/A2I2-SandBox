import Link from "next/link";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#chain", label: "Chain" },
  { href: "/sandbox", label: "Sandbox" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-4 py-[18px] sm:px-6">
        <Wordmark />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="tag hover:text-violet">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/sandbox" className="btn btn-primary btn-sm">
          Launch sandbox
        </Link>
      </div>
    </header>
  );
}
