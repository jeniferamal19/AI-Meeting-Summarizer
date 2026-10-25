window.addEventListener("message", (e) => {
  if (e.source !== window) return;
  if (e.data?.source !== "echonote-page" || e.data.type !== "REQUEST_TRANSCRIPT") return;

  chrome.storage.local.get("pendingTranscript", ({ pendingTranscript }) => {
    window.postMessage(
      { source: "echonote-extension", transcript: pendingTranscript || "" },
      "*"
    );
    if (pendingTranscript) chrome.storage.local.remove("pendingTranscript");
  });
});