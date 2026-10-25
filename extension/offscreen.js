let stream = null, recorder = null, timer = null, active = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target !== "offscreen") return;

  if (msg.action === "OFFSCREEN_START") startCapture(msg.streamId);
  if (msg.action === "OFFSCREEN_STOP") stopCapture();
});

async function startCapture(streamId) {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    // Capturing a tab mutes it, so play the audio back to the user
    const ctx = new AudioContext();
    ctx.createMediaStreamSource(stream).connect(ctx.destination);

    active = true;
    startSegment();
    chrome.runtime.sendMessage({ action: "CAPTURE_STARTED" }).catch(() => {});
  } catch (err) {
    console.error("Capture failed:", err);
  }
}

// Each 30s segment is a complete, valid webm file
function startSegment() {
  recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const parts = [];
  recorder.ondataavailable = (e) => e.data.size && parts.push(e.data);
  recorder.onstop = () => {
    if (parts.length) sendChunk(new Blob(parts, { type: "audio/webm" }));
    if (active) startSegment();
  };
  recorder.start();
  timer = setTimeout(() => {
    if (recorder.state === "recording") recorder.stop();
  }, 30000);
}

function stopCapture() {
  active = false;
  clearTimeout(timer);
  if (recorder && recorder.state === "recording") recorder.stop();
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  chrome.runtime.sendMessage({ action: "CAPTURE_STOPPED" }).catch(() => {});
}

async function sendChunk(blob) {
  const formData = new FormData();
  formData.append("file", blob, "chunk.webm");
  try {
    const res = await fetch("http://localhost:8000/api/live/chunk", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    console.log("Chunk transcribed:", data.text);
    chrome.runtime
      .sendMessage({ action: "TRANSCRIPT_UPDATE", text: data.text })
      .catch(() => {});
  } catch (err) {
    console.error("Failed to send chunk:", err);
  }
}