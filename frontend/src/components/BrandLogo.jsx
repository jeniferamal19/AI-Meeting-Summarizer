export default function BrandLogo({ surface = "dark", compact = false }) {
  return (
    <span className={`brand-logo brand-logo--${surface}${compact ? " brand-logo--compact" : ""}`}>
      <svg
        className="brand-logo__mark"
        viewBox="0 0 36 36"
        role="img"
        aria-label="EchoNote"
      >
        <path
          d="M18 3.5 30.55 10.75v14.5L18 32.5 5.45 25.25v-14.5L18 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M11 19.8v-3.6m4 6.2V13.6m4 10.1V12.3m4 8.4v-5.8"
          fill="none"
          stroke="var(--color-accent-blue)"
          strokeLinecap="round"
          strokeWidth="2.2"
        />
      </svg>
      {!compact && (
        <span className="brand-logo__word">
          Echo<span>Note</span>
        </span>
      )}
    </span>
  );
}
