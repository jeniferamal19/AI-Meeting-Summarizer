import { useRef, useState } from "react";
import { Copy, Download, RotateCcw, Check, AlertCircle } from "lucide-react";
import FileUpload from "./components/FileUpload";
import ProcessingStatus from "./components/ProcessingStatus";
import ActionItems from "./components/ActionItems";
import Waveform from "./components/Waveform";
import { processMeeting } from "./api/client";
import SummaryDisplay from "./components/SummaryDisplay";
import RisksBlockers from "./components/RisksBlockers";
import SpeakerTranscript from "./components/SpeakerTranscript";

// How long to optimistically show the "transcribing" stage before
// flipping to "summarizing", since the backend returns one response
// for the whole pipeline rather than streaming stage updates.
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
  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [stage, setStage] = useState("uploading"); // uploading | transcribing | summarizing
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const stageTimer = useRef(null);

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

  function handleReset() {
    setStatus("idle");
    setStage("uploading");
    setProgress(0);
    setResult(null);
    setError("");
    setCopied(false);
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <Waveform bars={4} className="brand-mark" />
          <div>
            <div className="brand-name">Recap</div>
            <div className="brand-tagline">Meetings in, takeaways out</div>
          </div>
        </div>
        {status === "done" && (
          <button type="button" className="btn btn--ghost" onClick={handleReset}>
            <RotateCcw size={15} />
            New meeting
          </button>
        )}
      </header>

      <main>
        {status === "error" && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <FileUpload onSubmit={handleFileSubmit} />
        )}

        {status === "processing" && <ProcessingStatus stage={stage} progress={progress} />}

        {status === "done" && result && (
          <>
            <div className="summary-toolbar">
              <span className="summary-toolbar__title">Summary ready</span>
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
              </div>
            </div>
            <SummaryDisplay summary={result.summary} transcript={result.transcript} />
            <RisksBlockers items={result.summary?.risks_blockers ?? []} />
            <ActionItems items={result.summary?.action_items ?? []} />
            <SpeakerTranscript turns={result.speaker_transcript ?? []} />
          </>
        )}
      </main>

      <footer className="app-footer">Audio stays local to your server — nothing is stored after processing.</footer>
    </div>
  );
}
