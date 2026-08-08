import { AlertTriangle } from "lucide-react";

export default function RisksBlockers({ items = [] }) {
  return (
    <section className="card">
      <h3 className="card__heading">Risks &amp; blockers</h3>
      {items.length === 0 ? (
        <p className="empty-note">No risks or blockers were flagged in this meeting.</p>
      ) : (
        <ul className="risk-list">
          {items.map((risk, i) => (
            <li key={i}>
              <span className="risk-list__mark">
                <AlertTriangle size={12} />
              </span>
              <span>{risk}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}