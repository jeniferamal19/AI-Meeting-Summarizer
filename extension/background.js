async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record tab audio for live transcription"
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Save every transcript line so it survives the popup closing
  if (message.action === "TRANSCRIPT_UPDATE" && message.text) {
    chrome.storage.local.get("liveTranscript").then(({ liveTranscript = [] }) => {
      chrome.storage.local.set({ liveTranscript: [...liveTranscript, message.text] });
    });
    return;
  }

  // Offscreen reports it stopped (or failed to start)
  if (message.action === "CAPTURE_STOPPED") {
    chrome.storage.session.set({ recording: false });
    return;
  }

  if (message.action === "START_CAPTURE") {
    (async () => {
      const streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: message.tabId
      });
      await chrome.storage.local.set({ liveTranscript: [] });
      await chrome.storage.local.remove("pendingTranscript");
      await ensureOffscreen();
      chrome.runtime
        .sendMessage({ target: "offscreen", action: "OFFSCREEN_START", streamId })
        .catch(() => {});
      await chrome.storage.session.set({ recording: true, startedAt: Date.now() });
      sendResponse({ status: "started" });
    })().catch((err) => {
      console.error("Start failed:", err);
      sendResponse({ status: "error", error: String(err) });
    });
    return true;
  }

  if (message.action === "STOP_CAPTURE") {
    chrome.runtime
      .sendMessage({ target: "offscreen", action: "OFFSCREEN_STOP" })
      .catch(() => {});
    chrome.storage.session.set({ recording: false });
    sendResponse({ status: "stopped" });
    return true;
  }
});