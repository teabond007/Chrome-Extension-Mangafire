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


  LogCustoomBookmarks();
});

document.getElementById('sendMessageBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
  });

document.getElementById('resetBookmarkButton').addEventListener('click', () => {
  chrome.storage.local.remove('customBookmarks');
  location.reload();
  });



document.getElementById('addBookmarkButton').addEventListener('click', () => {
  console.log('Add Bookmark button clicked');
  const bookmarkName = document.getElementById('bookmarkName').value;
  const bookmarkColor = document.getElementById('colorBookmarks').value;
  console.log(`Bookmark Name: ${bookmarkName}, Color: ${bookmarkColor}`);
  if( bookmarkName && bookmarkColor) {
    chrome.storage.local.get('customBookmarks', data => {
      const existing = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
      const newBookmark = { name: bookmarkName, color: bookmarkColor };
      const combined = [...existing, newBookmark];
      chrome.storage.local.set({ customBookmarks: combined }, () => {
        console.log(`Bookmark added: ${bookmarkName}, Color: ${bookmarkColor}`);
        document.getElementById('bookmarkName').value = ''; // Clear input field
        document.getElementById('colorBookmarks').value = '#ff0000'; // Reset color picker
      });
    });
  }
  setTimeout(LogCustoomBookmarks, 200);
  
  
  });

function LogCustoomBookmarks() {
  chrome.storage.local.get('customBookmarks', data => {
    const bookmarks = data.customBookmarks || [];
    const container = document.getElementById('CustomBookmarksContainer');
    container.innerHTML = ''; // Clear previous content

    bookmarks.forEach(bookmark => {
      const bookmarkDiv = document.createElement('div');
      bookmarkDiv.style.backgroundColor = bookmark.color;
      bookmarkDiv.textContent = bookmark.name;
      bookmarkDiv.className = 'bookmarkItem';
      container.appendChild(bookmarkDiv);
    });
  }
)
}
