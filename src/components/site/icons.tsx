// Thin-stroke line icons, 32px, drawn in the illustration's isometric idiom.
const base = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinejoin: "round" as const,
  className: "size-8",
  "aria-hidden": true,
};

export const IsolateIcon = () => (
  <svg {...base}>
    <path d="M16 4 27 10v12L16 28 5 22V10z" />
    <path d="M5 10l11 6 11-6M16 16v12" />
    <circle cx="16" cy="11" r="1.6" fill="currentColor" />
  </svg>
);

export const SimulateIcon = () => (
  <svg {...base}>
    <path d="M3 20c4 0 4-8 8-8s4 10 8 10 4-14 8-14 2 4 2 4" />
    <path d="M3 27h26" strokeDasharray="2 3" />
  </svg>
);

export const GuardIcon = () => (
  <svg {...base}>
    <path d="M16 3.5 26 7v8c0 6.5-4.3 11-10 13.5C10.3 26 6 21.5 6 15V7z" />
    <path d="m11.5 15.5 3.2 3.2 6-6.4" />
  </svg>
);

export const ObserveIcon = () => (
  <svg {...base}>
    <path d="M4 7h16M4 13h24M4 19h12M4 25h20" />
    <circle cx="25" cy="7" r="2" />
    <circle cx="21" cy="19" r="2" />
  </svg>
);
