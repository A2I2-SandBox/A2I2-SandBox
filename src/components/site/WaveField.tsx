// ASCII rendering of the banner's flowing lines: character density traces
// a bundle of sine waves, so the texture reads as data, not decoration.
const RAMP = " ..·:-=+*#";

const WAVES = [
  { a: 7, f: 0.035, p: 0.0, w: 0.9 },
  { a: 9, f: 0.028, p: 1.1, w: 0.7 },
  { a: 6, f: 0.041, p: 2.3, w: 0.6 },
  { a: 11, f: 0.022, p: 3.7, w: 0.8 },
  { a: 5, f: 0.05, p: 4.4, w: 0.5 },
  { a: 8, f: 0.031, p: 5.9, w: 0.6 },
];

function render(rows: number, cols: number) {
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      let d = 0;
      for (const w of WAVES) {
        // Waves pinch together near the middle, like lines passing through the cube.
        const pinch = 0.35 + 0.65 * Math.abs(Math.sin((c / cols) * Math.PI - Math.PI / 2));
        const y = rows / 2 + w.a * pinch * Math.sin(c * w.f + w.p) + (w.p - 3) * pinch;
        d += Math.exp(-((r - y) ** 2) / w.w);
      }
      const i = Math.min(RAMP.length - 1, Math.floor(d * (RAMP.length - 1)));
      line += RAMP[i];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

const FIELD = render(40, 280);

export function WaveField({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}>
      <pre className="font-pixel text-[10px] leading-[12px] text-violet opacity-[0.16] select-none">{FIELD}</pre>
    </div>
  );
}
