function computeScore(summary, transcript) {
  let score = 0;

  // Transcript length
  const wordCount = transcript ? transcript.split(" ").length : 0;
  if (wordCount > 300) score += 3;
  else if (wordCount > 100) score += 2;
  else if (wordCount > 30) score += 1;

  // Structured content extracted
  score += Math.min((summary?.key_decisions?.length ?? 0), 3);
  score += Math.min((summary?.action_items?.length ?? 0), 3);
  score += Math.min((summary?.risks_blockers?.length ?? 0), 2);
  score += Math.min((summary?.topics_discussed?.length ?? 0), 2);

  return score; // max ~13
}

function getLabel(score) {
  if (score >= 9) return { label: "High quality", color: "quality--high" };
  if (score >= 5) return { label: "Good", color: "quality--good" };
  if (score >= 2) return { label: "Limited insights", color: "quality--limited" };
  return { label: "Very short meeting", color: "quality--low" };
}

export default function MeetingQualityScore({ summary, transcript }) {
  const score = computeScore(summary, transcript);
  const { label, color } = getLabel(score);

  return (
    <div className={`quality-badge ${color}`} aria-label={`Meeting quality: ${label}`}>
      <span className="quality-badge__dot" />
      {label}
    </div>
  );
}