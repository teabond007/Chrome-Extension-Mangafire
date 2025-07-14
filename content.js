

async function applyContainerStyles() {
  if (window.location.pathname === "/user/bookmark") {
  return;
}
  Log('applyContainerStyles() called');
  chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
  Log('Request scrapeBookmarks sent');
  const msg = await waitForMessage(msg => msg.type === "bookmarksExtracted");
  Log('Received bookmarksExtracted message');
  chrome.storage.local.get('userBookmarks', data => {
  const bookmarks = data.userBookmarks || [];
  // Use bookmarks here

});

  const container = document.querySelector('.original.card-lg');

  if (container) {
const mangaDivs = container.querySelectorAll(':scope > div');

mangaDivs.forEach(item => {
    const inner = item.querySelector('.inner');
    if (inner) {
  inner.style.border = '1px solid rgb(0, 255, 8)'; // Green border
    }
  });
  
}}

/*// Watch for dynamic content loading
const observer = new MutationObserver(() => {
  if (applyContainerStyles()) {
    observer.disconnect(); // Stop once it's found and styled
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
*/
// Just in case it loads immediately (rare)
window.addEventListener('load', () => {
  applyContainerStyles();
});

function Log(txt) {
  chrome.runtime.sendMessage({ type: "log", text: txt });
}

function waitForMessage(filterFn) {
  return new Promise(resolve => {
    function handler(msg, sender, sendResponse) {
      if (!filterFn || filterFn(msg, sender)) {
        chrome.runtime.onMessage.removeListener(handler);
        resolve(msg);
      }
    }
    chrome.runtime.onMessage.addListener(handler);
  });
}