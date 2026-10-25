import { useEffect, useState } from "react";
import { Clock, Trash2, Check, X, Plus, PanelLeftClose } from "lucide-react";
import { fetchHistory, fetchMeeting, deleteMeeting, updateMeetingTitle } from "../api/client";
import BrandLogo from "./BrandLogo";

export default function HistorySidebar({
  activeId,
  onSelect,
  search = "",
  isOpen = false,
  onClose,
  onNewMeeting,
}) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setMeetings(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleSelect(id) {
    try {
      const meeting = await fetchMeeting(id);
      onSelect(meeting);
    } catch (err) {
      console.error("Failed to load meeting:", err);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("Delete this meeting?")) return;
    try {
      await deleteMeeting(id);
      loadHistory();
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    }
  }

  function startEditing(e, id, currentTitle) {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  }

  async function saveTitle(id) {
    if (!editingTitle.trim()) return;
    try {
      await updateMeetingTitle(id, editingTitle.trim());
      setMeetings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, title: editingTitle.trim() } : m))
      );
    } catch (err) {
      console.error("Failed to update title:", err);
    } finally {
      setEditingId(null);
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  return (
    <aside className={`history-sidebar${isOpen ? " history-sidebar--open" : ""}`}>
      <div className="history-sidebar__brand-row">
        <BrandLogo surface="dark" />
        <button type="button" className="history-sidebar__close" onClick={onClose} aria-label="Close navigation">
          <PanelLeftClose size={17} />
        </button>
      </div>
      <button type="button" className="history-sidebar__new" onClick={onNewMeeting}>
        <Plus size={16} />
        New meeting
      </button>
      <div className="history-sidebar__title">
        <Clock size={15} />
        Recent meetings
      </div>
      {loading && <div className="history-sidebar__empty">Loading…</div>}
      {!loading && meetings.length === 0 && (
        <div className="history-sidebar__empty">No past meetings yet</div>
      )}
      <ul className="history-sidebar__list">
        {meetings
          .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
          .map((m) => (
            <li
              key={m.id}
              className={`history-sidebar__item ${m.id === activeId ? "history-sidebar__item--active" : ""}`}
            >
              {editingId === m.id ? (
                <div className="history-sidebar__edit" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="history-sidebar__edit-input"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle(m.id);
                      if (e.key === "Escape") cancelEditing();
                    }}
                    autoFocus
                  />
                  <div className="history-sidebar__edit-actions">
                    <button onClick={() => saveTitle(m.id)} title="Save"><Check size={12} /></button>
                    <button onClick={cancelEditing} title="Cancel"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="history-sidebar__item-select"
                    aria-current={m.id === activeId ? "page" : undefined}
                    onClick={() => handleSelect(m.id)}
                    onDoubleClick={(e) => startEditing(e, m.id, m.title)}
                    title="Double-click to rename"
                  >
                    {m.title}
                  </button>
                  <button
                    type="button"
                    className="history-sidebar__delete"
                    onClick={(e) => handleDelete(e, m.id)}
                    aria-label="Delete meeting"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </li>
          ))}
      </ul>
    </aside>
  );
}