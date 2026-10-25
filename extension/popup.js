let recording = false;
let transcript = [];
let timerInterval = null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const transcriptBox = document.getElementById("transcriptBox");
const statusDot = document.getElementById("statusDot");
const connectionLabel = document.getElementById("connectionLabel");
const transcriptCount = document.getElementById("transcriptCount");
const timerEl = document.getElementById("timer");
const emptyStateTemplate = transcriptBox.querySelector(".empty-state");

// Load saved state whenever the popup opens
chrome.storage.local.get("liveTranscript", ({ liveTranscript = [] }) => {
  transcript = liveTranscript;
  renderTranscript();
});
chrome.storage.session.get(["recording", "startedAt"], ({ recording, startedAt }) => {
  setRecordingUI(!!recording, startedAt);
});

// React to storage changes (works even if messages are missed)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.liveTranscript) {
    transcript = changes.liveTranscript.newValue || [];
    renderTranscript();
  }
  if (area === "session" && changes.recording) {
    chrome.storage.session.get("startedAt", ({ startedAt }) => {
      setRecordingUI(!!changes.recording.newValue, startedAt);
    });
  }
});

startBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.runtime.sendMessage({ action: "START_CAPTURE", tabId: tabs[0].id });
  });
});

stopBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "STOP_CAPTURE" });
});

summarizeBtn.addEventListener("click", () => {
  chrome.storage.local.set({ pendingTranscript: transcript.join(" ") }, () => {
    chrome.tabs.create({ url: "http://localhost:5173/?from=extension" });
  });
});

function refreshSummarizeBtn() {
  summarizeBtn.disabled = recording || transcript.length === 0;
}

function setRecordingUI(isRecording, startedAt) {
  recording = isRecording;
  startBtn.hidden = isRecording;
  stopBtn.hidden = !isRecording;
  statusDot.className = "status-dot" + (isRecording ? " recording" : "");
  connectionLabel.textContent = isRecording ? "Recording" : "Ready";

  clearInterval(timerInterval);
  if (isRecording) {
    const tick = () => {
      const secs = Math.floor((Date.now() - (startedAt || Date.now())) / 1000);
      const m = Math.floor(secs / 60).toString().padStart(2, "0");
      const s = (secs % 60).toString().padStart(2, "0");
      timerEl.textContent = `Recording ${m}:${s}`;
    };
    tick();
    timerInterval = setInterval(tick, 1000);
  } else {
    timerEl.textContent = "";
  }
  refreshSummarizeBtn();
}

function renderTranscript() {
  transcriptCount.textContent = transcript.length
    ? `${transcript.length} ${transcript.length === 1 ? "line" : "lines"}`
    : "No speech yet";

  if (!transcript.length) {
    transcriptBox.replaceChildren(emptyStateTemplate.cloneNode(true));
    refreshSummarizeBtn();
    return;
  }

  const lines = transcript.map((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  });
  transcriptBox.replaceChildren(...lines);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
  refreshSummarizeBtn();
}