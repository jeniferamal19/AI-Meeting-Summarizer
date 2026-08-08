function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ActionItems({ items = [] }) {
  return (
    <section className="card">
      <h3 className="card__heading">Action items</h3>
      {items.length === 0 ? (
        <p className="empty-note">No action items were detected in this meeting.</p>
      ) : (
        <div className="action-table">
          {items.map((item, i) => (
            <div className="action-row" key={i}>
              <div className="action-row__owner">
                <span className="avatar-chip">{getInitials(item.owner)}</span>
                <span className="action-row__owner-name">{item.owner || "Unassigned"}</span>
              </div>
              <div className="action-row__task">{item.task}</div>
              <div className="action-row__due">{item.due || "No date"}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
