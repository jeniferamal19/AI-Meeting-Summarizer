// Small reusable waveform mark. Used both as a quiet brand mark in the
// header (static) and as the loading visual during processing (animated).
export default function Waveform({ active = false, bars = 7, className = "" }) {
  return (
    <div
      className={`waveform ${active ? "waveform--active" : ""} ${className}`.trim()}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
