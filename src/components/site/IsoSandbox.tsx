import type { ReactNode } from "react";

// Isometric line drawing of the sandbox: a tray of sealed cells, an agent
// (the asterisk) in one, the glass cube from the banner in another, and the
// agent's dashed trace between them.

const U = 78;
const COS = Math.cos(Math.PI / 6);
const OX = 260;
const OY = 150;
const N = 3;
const WALL = 0.42;

type Pt = [number, number];
const P = (x: number, y: number, z = 0): Pt => [OX + (x - y) * COS * U, OY + (x + y) * 0.5 * U - z * U];
const pts = (...p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const INK = "var(--color-ink)";
const VIOLET = "var(--color-violet)";

function wall(x0: number, y0: number, x1: number, y1: number, alongX: boolean) {
  return (
    <polygon
      points={pts(P(x0, y0), P(x1, y1), P(x1, y1, WALL), P(x0, y0, WALL))}
      fill={alongX ? "var(--color-lavender)" : "var(--color-haze)"}
      stroke={INK}
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
  );
}

function Agent({ cx, cy }: { cx: number; cy: number }) {
  const [bx, by] = P(cx, cy, 0);
  const [tx, ty] = P(cx, cy, 1.25);
  const r = 17;
  return (
    <g stroke={VIOLET} strokeWidth={5}>
      <line x1={bx} y1={by - 4} x2={tx} y2={ty + r + 8} />
      <g className="anim-spin">
        {[0, 45, 90, 135].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return <line key={deg} x1={tx - r * Math.cos(a)} y1={ty - r * Math.sin(a)} x2={tx + r * Math.cos(a)} y2={ty + r * Math.sin(a)} />;
        })}
      </g>
    </g>
  );
}

function GlassCube({ cx, cy }: { cx: number; cy: number }) {
  const s = 0.32;
  const h = 0.64;
  const [x0, x1, y0, y1] = [cx - s, cx + s, cy - s, cy + s];
  const [nx, ny] = P(cx, cy, h / 2);
  const nodes: Pt[] = [[-12, -6], [10, -10], [14, 6], [-4, 13], [-15, 7], [3, -15], [0, 0]];
  return (
    <g>
      {/* Hidden back edges, dashed for the glass look. */}
      <g stroke={VIOLET} strokeWidth={1} strokeDasharray="3 3" opacity={0.6}>
        <line x1={P(x0, y0)[0]} y1={P(x0, y0)[1]} x2={P(x1, y0)[0]} y2={P(x1, y0)[1]} />
        <line x1={P(x0, y0)[0]} y1={P(x0, y0)[1]} x2={P(x0, y1)[0]} y2={P(x0, y1)[1]} />
        <line x1={P(x0, y0)[0]} y1={P(x0, y0)[1]} x2={P(x0, y0, h)[0]} y2={P(x0, y0, h)[1]} />
      </g>
      <g stroke={VIOLET} strokeWidth={0.8} opacity={0.75}>
        {nodes.flatMap(([ax, ay], i) =>
          nodes.slice(i + 1, i + 3).map(([bx, by], j) => <line key={`${i}-${j}`} x1={nx + ax} y1={ny + ay} x2={nx + bx} y2={ny + by} />),
        )}
      </g>
      {nodes.map(([ax, ay], i) => (
        <circle key={i} cx={nx + ax} cy={ny + ay} r={i === nodes.length - 1 ? 3.5 : 2} fill={VIOLET} className={i === nodes.length - 1 ? "anim-pulse" : undefined} />
      ))}
      {/* Visible faces */}
      <g fill={VIOLET} fillOpacity={0.05} stroke={VIOLET} strokeWidth={1.4} strokeLinejoin="round">
        <polygon points={pts(P(x0, y1), P(x1, y1), P(x1, y1, h), P(x0, y1, h))} />
        <polygon points={pts(P(x1, y0), P(x1, y1), P(x1, y1, h), P(x1, y0, h))} />
        <polygon points={pts(P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h))} />
      </g>
    </g>
  );
}

export function IsoSandbox({ className = "" }: { className?: string }) {
  const items: { depth: number; node: ReactNode }[] = [];
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j < N; j++) {
      items.push({ depth: i + j + 0.5, node: wall(j, i, j + 1, i, true) });
      items.push({ depth: i + j + 0.5, node: wall(i, j, i, j + 1, false) });
    }
  }
  items.push({ depth: 2, node: <Agent cx={0.5} cy={1.5} /> });
  items.push({ depth: 3, node: <GlassCube cx={1.5} cy={1.5} /> });
  items.sort((a, b) => a.depth - b.depth);

  const [ax, ay] = P(0.5, 1.5, 1.25);
  const [bx, by] = P(1.5, 1.5, 0.95);
  const [cx, cy] = P(2.5, 0.5, 0.75);
  const [kx, ky] = P(2.5, 0.5, 0.02);

  return (
    <svg viewBox="40 80 440 320" className={className} role="img" aria-label="An agent inside an isolated grid of sandbox cells">
      <polygon points={pts(P(0, 0), P(N, 0), P(N, N), P(0, N))} fill="var(--color-canvas)" stroke={INK} strokeWidth={1.3} />
      {/* The agent's last destination cell, tinted. */}
      <polygon points={pts(P(2, 0), P(3, 0), P(3, 1), P(2, 1))} fill="var(--color-haze)" />
      <circle cx={kx} cy={ky} r={5} fill="none" stroke="var(--color-lime)" strokeWidth={1.5} />
      {items.map((it, i) => (
        <g key={i}>{it.node}</g>
      ))}
      <path
        d={`M${ax + 22},${ay + 6} Q${(ax + bx) / 2},${ay - 40} ${bx},${by - 30} T${cx},${cy}`}
        fill="none"
        stroke={VIOLET}
        strokeWidth={1.4}
        strokeDasharray="5 5"
        className="anim-drift"
      />
      <line x1={cx} y1={cy} x2={kx} y2={ky - 6} stroke={VIOLET} strokeWidth={1} strokeDasharray="2 3" />
    </svg>
  );
}
