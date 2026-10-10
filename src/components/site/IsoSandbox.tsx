// The sandbox as one glass cube on a faint isometric floor. Inside, the A2I2
// mascot keeps trying to break out: it charges the right wall, the left wall,
// then jumps for the ceiling. The glass flashes and holds every time
// (keyframes in globals.css).

const U = 150;
const COS = Math.cos(Math.PI / 6);
const OX = 260;
const OY = 292;
const S = 0.5; // half the cube's footprint
const H = 1; // cube height
const MASCOT_SCALE = 2.2;

type Pt = [number, number];
const P = (x: number, y: number, z = 0): Pt => [OX + (x - y) * COS * U, OY + (x + y) * 0.5 * U - z * U];
const pts = (...p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const INK = "var(--color-ink)";
const VIOLET = "var(--color-violet)";
const DEEP = "var(--color-violet-hover)";

/** The mascot, drawn with its feet at the origin. */
function Mascot() {
  return (
    <g className="mascot-run">
      <rect x={-9.5} y={-8} width={6} height={8} rx={2.4} fill={DEEP} />
      <rect x={3.5} y={-8} width={6} height={8} rx={2.4} fill={DEEP} />
      <g stroke={DEEP} strokeWidth={3.4} strokeLinecap="round">
        <line x1={-17} y1={-25} x2={-23} y2={-15} />
        <line x1={17} y1={-25} x2={23} y2={-15} />
      </g>
      <line x1={0} y1={-38} x2={0} y2={-44} stroke={DEEP} strokeWidth={1.6} />
      <g stroke={VIOLET} strokeWidth={1.6} strokeLinecap="square">
        {[0, 45, 90, 135].map((d) => {
          const a = (d * Math.PI) / 180;
          return <line key={d} x1={-3.4 * Math.cos(a)} y1={-47.5 - 3.4 * Math.sin(a)} x2={3.4 * Math.cos(a)} y2={-47.5 + 3.4 * Math.sin(a)} />;
        })}
      </g>
      <rect x={-17.5} y={-38.5} width={35} height={31} rx={7.5} fill={VIOLET} stroke={DEEP} strokeWidth={0.8} />
      <rect x={-13} y={-34.5} width={26} height={18.5} rx={4.5} fill="#fff" />
      <g className="mascot-eyes-open" fill={INK}>
        <rect x={-6.8} y={-30} width={3} height={6} rx={1.5} />
        <rect x={3.8} y={-30} width={3} height={6} rx={1.5} />
      </g>
      <g className="mascot-eyes-shut" stroke={INK} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M-7.5,-29.5 L-4,-27 L-7.5,-24.5" />
        <path d="M7.5,-29.5 L4,-27 L7.5,-24.5" />
      </g>
      <path d="M-2.6,-20.6 Q0,-18.6 2.6,-20.6" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      <path d="M-2.4,-12 h3.6 l-1,2 h-3.6 z" fill="#fff" opacity={0.9} />
    </g>
  );
}

/** Faint isometric floor grid that fades out away from the cube. */
function Floor() {
  const lines: { a: Pt; b: Pt; o: number }[] = [];
  const R = 1.5;
  for (let k = -R; k <= R + 0.001; k += 0.5) {
    const o = 0.9 - Math.abs(k) / (R + 0.5);
    lines.push({ a: P(k, -R), b: P(k, R), o });
    lines.push({ a: P(-R, k), b: P(R, k), o });
  }
  return (
    <g stroke="var(--color-line-strong)" strokeWidth={1} strokeDasharray="2 5">
      {lines.map(({ a, b, o }, i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} opacity={o} />
      ))}
    </g>
  );
}

export function IsoSandbox({ className = "" }: { className?: string }) {
  const [x0, x1, y0, y1] = [-S, S, -S, S];
  const [fx, fy] = P(0, 0, 0);
  const face = { fill: VIOLET, stroke: VIOLET, strokeWidth: 2, strokeLinejoin: "round" as const };
  const back: [Pt, Pt][] = [
    [P(x0, y0), P(x1, y0)],
    [P(x0, y0), P(x0, y1)],
    [P(x0, y0), P(x0, y0, H)],
  ];
  // Reflections on the front-left pane.
  const glint = (t: number): [Pt, Pt] => [P(x0 + t, y1, 0.25), P(x0 + t + 0.22, y1, 0.75)];

  return (
    <svg viewBox="40 52 440 336" className={className} role="img" aria-label="The A2I2 mascot inside a glass cube, trying and failing to break out">
      <Floor />
      {/* Glass floor */}
      <polygon points={pts(P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1))} fill="var(--color-haze)" stroke={VIOLET} strokeWidth={1} strokeOpacity={0.4} />
      {/* Back panes and hidden edges */}
      <polygon points={pts(P(x0, y0), P(x1, y0), P(x1, y0, H), P(x0, y0, H))} fill={VIOLET} fillOpacity={0.03} />
      <polygon points={pts(P(x0, y0), P(x0, y1), P(x0, y1, H), P(x0, y0, H))} fill={VIOLET} fillOpacity={0.05} />
      <g stroke={VIOLET} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.5}>
        {back.map(([a, b], i) => (
          <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
        ))}
      </g>

      <g transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${MASCOT_SCALE})`}>
        <Mascot />
      </g>

      {/* Front panes: each one flashes when the mascot hits it */}
      <polygon className="glass glass-left" points={pts(P(x0, y1), P(x1, y1), P(x1, y1, H), P(x0, y1, H))} {...face} />
      <polygon className="glass glass-right" points={pts(P(x1, y0), P(x1, y1), P(x1, y1, H), P(x1, y0, H))} {...face} />
      <polygon className="glass glass-top" points={pts(P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H))} {...face} />
      <g stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.85}>
        {[0.12, 0.2].map((t) => {
          const [a, b] = glint(t);
          return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
        })}
      </g>
    </svg>
  );
}
