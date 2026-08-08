import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export default function SummaryDisplay({ summary, transcript }) {
  const [showTranscript, setShowTranscript] = useState(false);

  const decisions = summary?.key_decisions ?? [];
  const topics = summary?.topics_discussed ?? [];

  return (
    <>
      <section className="card">
        <p className="card__eyebrow">Overview</p>
        <p className="summary-text">{summary?.summary || "No summary was returned."}</p>
      </section>

      <section className="card">
        <h3 className="card__heading">Key decisions</h3>
        {decisions.length > 0 ? (
          <ul className="decision-list">
            {decisions.map((decision, i) => (
              <li key={i}>
                <span className="decision-list__mark">
                  <Check size={12} />
                </span>
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">No explicit decisions were detected in this meeting.</p>
        )}
      </section>

      <section className="card">
        <h3 className="card__heading">Topics discussed</h3>
        {topics.length > 0 ? (
          <div className="topic-pills">
            {topics.map((topic, i) => (
              <span key={i} className="topic-pill">
                {topic}
              </span>
            ))}
          </div>
        ) : (
          <p className="empty-note">No topics were extracted.</p>
        )}
      </section>

      {transcript && (
        <section className="card">
          <button
            type="button"
            className="transcript-toggle"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
          >
            {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showTranscript ? "Hide full transcript" : "Show full transcript"}
          </button>
          {showTranscript && <div className="transcript-body">{transcript}</div>}
        </section>
      )}
    </>
  );
}
