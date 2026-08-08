export default function SpeakerTranscript({ turns = [] }) {
  if (turns.length === 0) return null;

  return (
    <section className="card">
      <h3 className="card__heading">Speaker transcript</h3>
      <div className="speaker-transcript">
        {turns.map((turn, i) => (
          <div key={i} className="speaker-turn">
            <div className="speaker-turn__label">{turn.speaker}</div>
            <div className="speaker-turn__text">{turn.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}