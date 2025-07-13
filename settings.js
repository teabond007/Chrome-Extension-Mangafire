document.addEventListener('DOMContentLoaded', () => {
  function Log(txt) {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    const logLine = document.createElement('div');
    logLine.textContent = txt;
    logContainer.appendChild(logLine);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "log") {
      Log(msg.text);
    }
  });
});