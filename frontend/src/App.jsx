import { useRef, useState, useEffect } from "react";
import {
  Copy,
  Download,
  Check,
  AlertCircle,
  Mail,
  LogOut,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Plus,
} from "lucide-react";
import FileUpload from "./components/FileUpload";
import ProcessingStatus from "./components/ProcessingStatus";
import ActionItems from "./components/ActionItems";
import { processMeeting, generateEmail, summarizeText } from "./api/client";
import SummaryDisplay from "./components/SummaryDisplay";
import RisksBlockers from "./components/RisksBlockers";
import SpeakerTranscript from "./components/SpeakerTranscript";
import MeetingQualityScore from "./components/MeetingQualityScore";
import HistorySidebar from "./components/HistorySidebar";
import Auth from "./components/Auth";

const TRANSCRIBE_STAGE_MS = 4000;

function buildMarkdown(result) {
  const { summary, transcript } = result;
  const lines = ["# Meeting Summary", "", summary?.summary || "", ""];

  lines.push("## Key Decisions");
  (summary?.key_decisions ?? []).forEach((d) => lines.push(`- ${d}`));
  lines.push("");

  lines.push("## Risks & Blockers");
  (summary?.risks_blockers ?? []).forEach((r) => lines.push(`- ${r}`));
  lines.push("");

  lines.push("## Action Items");
  (summary?.action_items ?? []).forEach((a) =>
    lines.push(`- [ ] ${a.task} — **${a.owner || "Unassigned"}** (${a.due || "no date"})`)
  );
  lines.push("");

  lines.push("## Topics Discussed");
  (summary?.topics_discussed ?? []).forEach((t) => lines.push(`- ${t}`));

  if (transcript) {
    lines.push("", "## Full Transcript", "", transcript);
  }

  return lines.join("\n");
}

export default function App() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [stage, setStage] = useState("uploading");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const stageTimer = useRef(null);
  const handledExtension = useRef(false);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [email, setEmail] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("recap_user") || sessionStorage.getItem("recap_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("recap_user");
        sessionStorage.removeItem("recap_user");
      }
    }
  }, []);

  // Receives the live transcript from the Chrome extension (via content.js)
  useEffect(() => {
    // Wait until logged in so the transcript isn't consumed on the login screen
    if (!user) return;
    if (new URLSearchParams(window.location.search).get("from") !== "extension") return;

    const handler = async (e) => {
      if (e.source !== window) return;
      if (e.data?.source !== "echonote-extension") return;
      if (!e.data.transcript || handledExtension.current) return;
      handledExtension.current = true;

      setStatus("processing");
      setStage("summarizing");
      setProgress(100);
      setError("");

      try {
        const data = await summarizeText(e.data.transcript);
        setResult(data);
        setStatus("done");
        setActiveHistoryId(null);
        setHistoryRefreshKey((k) => k + 1);
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        handledExtension.current = false;
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Could not summarize the live transcript."
        );
        setStatus("error");
      }
    };

    window.addEventListener("message", handler);
    window.postMessage({ source: "echonote-page", type: "REQUEST_TRANSCRIPT" }, "*");
    return () => window.removeEventListener("message", handler);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("recap_user");
    sessionStorage.removeItem("recap_user");
    setUser(null);
  };

  async function handleFileSubmit(file) {
    setStatus("processing");
    setStage("uploading");
    setProgress(0);
    setError("");

    try {
      const data = await processMeeting(file, {
        onUploadProgress: (pct) => {
          setProgress(pct);
          if (pct >= 100) {
            setStage("transcribing");
            stageTimer.current = setTimeout(() => {
              setStage("summarizing");
            }, TRANSCRIBE_STAGE_MS);
          }
        },
      });

      clearTimeout(stageTimer.current);
      setResult(data);
      setStatus("done");
      setActiveHistoryId(null);
      setHistoryRefreshKey((k) => k + 1);
    } catch (err) {
      clearTimeout(stageTimer.current);
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong while processing the recording.";
      setError(message);
      setStatus("error");
    }
  }

  function handleHistorySelect(meeting) {
    setActiveHistoryId(meeting.id);
    setResult({
      transcript: meeting.transcript,
      summary: meeting.summary,
      speaker_transcript: meeting.speaker_transcript,
    });
    setStatus("done");
    setError("");
  }

  async function handleGenerateEmail() {
    if (!result?.summary) return;
    setEmailLoading(true);
    setEmail(null);
    try {
      const data = await generateEmail(result.summary);
      setEmail(data);
    } catch (err) {
      console.error("Failed to generate email:", err);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleCopyEmail() {
    if (!email) return;
    await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  function handleReset() {
    setStatus("idle");
    setStage("uploading");
    setProgress(0);
    setResult(null);
    setError("");
    setCopied(false);
    setEmail(null);
    setEmailCopied(false);
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(buildMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([buildMarkdown(result)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting-summary.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadExport(format) {
    if (!result) return;
    const res = await fetch(`http://localhost:8000/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.summary),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-notes.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!user) {
    return <Auth onAuthSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div className="app-layout">
      {sidebarOpen && <button className="workspace-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <HistorySidebar
        key={historyRefreshKey}
        activeId={activeHistoryId}
        onSelect={(meeting) => {
          handleHistorySelect(meeting);
          setSidebarOpen(false);
        }}
        search={searchQuery}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewMeeting={() => {
          handleReset();
          setSidebarOpen(false);
        }}
      />
      <div className="app-shell">
        <header className="app-header">
          <button
            type="button"
            className="workspace-menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>

          <div className="workspace-heading">
            <p className="workspace-heading__breadcrumb">EchoNote <span>/</span> Workspace</p>
            <h1>{status === "done" ? "Meeting notes" : status === "processing" ? "Processing meeting" : "Your workspace"}</h1>
            <p>{status === "done" ? "Review the conversation and share the important details." : "Turn your recordings into clear, useful meeting notes."}</p>
          </div>

          <div className="header-actions">
            <label className="workspace-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search meetings"
                aria-label="Search meeting history"
              />
              <kbd>/</kbd>
            </label>
            <div className="workspace-popover-anchor">
              <button
                type="button"
                className={`workspace-icon-button${notificationsOpen ? " is-active" : ""}`}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setProfileOpen(false);
                }}
              >
                <Bell size={17} />
                <span className="workspace-notification-dot" />
              </button>
              {notificationsOpen && (
                <div className="workspace-popover workspace-notice">
                  <strong>You’re all caught up</strong>
                  <span>New meeting updates will appear here.</span>
                </div>
              )}
            </div>
            <div className="workspace-popover-anchor">
              <button
                type="button"
                className="workspace-profile"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
              >
                <span className="workspace-profile__avatar">{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</span>
                <span className="workspace-profile__name">{user.name || user.email}</span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="workspace-popover workspace-profile-menu">
                  <span>{user.email}</span>
                  <button type="button" onClick={handleLogout}><LogOut size={15} /> Sign out</button>
                </div>
              )}
            </div>
            {status !== "processing" && (
              <button type="button" className="btn btn--primary workspace-new-meeting" onClick={handleReset}>
                <Plus size={16} />
                New meeting
              </button>
            )}
          </div>
        </header>

        <main className="app-main">
          {status === "error" && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {(status === "idle" || status === "error") && (
            <section className="upload-intro">
              <div className="upload-intro__copy">
                <p className="upload-intro__eyebrow">Meeting notes, made clear</p>
                <h1 className="upload-intro__title">Bring the conversation into focus.</h1>
                <p className="upload-intro__description">
                  Upload a recording to get a readable transcript, decisions, and next steps.
                </p>
              </div>
              <FileUpload onSubmit={handleFileSubmit} />
            </section>
          )}

          {status === "processing" && <ProcessingStatus stage={stage} progress={progress} />}

          {status === "done" && result && (
            <>
              <div className="summary-toolbar">
                <span className="summary-toolbar__title">Summary ready</span>
                <MeetingQualityScore summary={result.summary} transcript={result.transcript} />
                <div className="summary-toolbar__actions">
                  <button type="button" className="btn btn--ghost" onClick={handleCopy}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={handleDownload}>
                    <Download size={15} />
                    Download .md
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => downloadExport("pdf")}>
                    <Download size={15} />
                    PDF
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => downloadExport("docx")}>
                    <Download size={15} />
                    DOCX
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={handleGenerateEmail} disabled={emailLoading}>
                    <Mail size={15} />
                    {emailLoading ? "Writing…" : "Follow-up Email"}
                  </button>
                </div>
              </div>
              <SummaryDisplay summary={result.summary} transcript={result.transcript} />
              <RisksBlockers items={result.summary?.risks_blockers ?? []} />
              <ActionItems items={result.summary?.action_items ?? []} />
              <SpeakerTranscript turns={result.speaker_transcript ?? []} />

              {email && (
                <div className="email-panel">
                  <div className="email-panel__header">
                    <span className="email-panel__title">Follow-up Email</span>
                    <button type="button" className="btn btn--ghost" onClick={handleCopyEmail}>
                      {emailCopied ? <Check size={15} /> : <Copy size={15} />}
                      {emailCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="email-panel__subject">Subject: {email.subject}</div>
                  <div className="email-panel__body">{email.body}</div>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="app-footer">Audio stays local to your server — nothing is stored after processing.</footer>
      </div>
    </div>
  );
}