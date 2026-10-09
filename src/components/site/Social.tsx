export const GITHUB_URL = "https://github.com/A2I2-SandBox/A2I2-SandBox";
export const X_URL = "https://x.com/a2i2_rh";

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-[22px]" fill="currentColor" aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
  </svg>
);

/** X and GitHub links, as square icon buttons. */
export function SocialLinks() {
  const cls = "flex size-10 items-center justify-center rounded-[2px] text-ink transition-colors hover:bg-haze hover:text-violet";
  return (
    <div className="flex items-center gap-1">
      <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="A2I2 on X" className={cls}>
        <XIcon />
      </a>
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="A2I2 Sandbox on GitHub" className={cls}>
        <GitHubIcon />
      </a>
    </div>
  );
}
