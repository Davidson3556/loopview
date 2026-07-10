export function LoopMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-[9px] bg-gradient-to-br from-brand via-accent-violet to-accent-cyan opacity-90 blur-[1px]" />
      <span className="absolute inset-[1.5px] rounded-[7.5px] bg-ink-950" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        <path
          d="M5 12a7 7 0 1 1 2 4.9"
          stroke="url(#lg)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M4 19.5V15h4.5"
          stroke="url(#lg)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="lg" x1="4" y1="4" x2="20" y2="20">
            <stop stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
