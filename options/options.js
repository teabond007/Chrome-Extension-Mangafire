document.addEventListener("DOMContentLoaded", () => {
  function Log(txt) {
    const logContainer = document.getElementById("logContainer");
    if (!logContainer) return;
    const logLine = document.createElement("div");
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

document.getElementById("sendMessageBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
});

document.getElementById("resetBookmarkButton").addEventListener("click", () => {
  chrome.storage.local.remove("customBookmarks");
  location.reload();
});

document.getElementById("addBookmarkButton").addEventListener("click", () => {
  console.log("Add Bookmark button clicked");
  const bookmarkName = document.getElementById("bookmarkName").value;
  const bookmarkColor = document.getElementById("colorBookmarks").value;
  const borderStyle = document.getElementById("customBorderStyleSelect").value;
  if (bookmarkName && bookmarkColor) {
    chrome.storage.local.get("customBookmarks", (data) => {
      const existing = Array.isArray(data.customBookmarks)
        ? data.customBookmarks
        : [];
      const newBookmark = { name: bookmarkName, color: bookmarkColor, style: borderStyle };
      const combined = [...existing, newBookmark];
      chrome.storage.local.set({ customBookmarks: combined }, () => {
      
        document.getElementById("bookmarkName").value = ""; // Clear input field
        document.getElementById("colorBookmarks").value = "#ff0000"; // Reset color picker
      });
    });
  }
  setTimeout(LogCustoomBookmarks, 200);
});

function LogCustoomBookmarks() {
  chrome.storage.local.get("customBookmarks", (data) => {
    const bookmarks = data.customBookmarks || [];
    const container = document.getElementById("CustomBookmarksContainer");
    container.innerHTML = ""; // Clear previous content

    bookmarks.forEach((bookmark) => {
      // Container div
      const bookmarkDiv = document.createElement("div");
      bookmarkDiv.className = "bookmarkItem";

      // Color block div
      const colorBlock = document.createElement("div");
      colorBlock.style.backgroundColor = bookmark.color;
      colorBlock.style.width = "30px";
      colorBlock.style.height = "25px";
      colorBlock.style.borderRadius = "2px";
      colorBlock.style.marginRight = "8px";

      // Text span
      const text = document.createElement("span");
      text.textContent = bookmark.name;

      // Layout using flexbox
      bookmarkDiv.style.display = "flex";
      bookmarkDiv.style.alignItems = "center";
      bookmarkDiv.style.border = `4px ${bookmark.style} ${bookmark.color}`
      bookmarkDiv.appendChild(colorBlock);
      bookmarkDiv.appendChild(text);

      // Append to container
      container.appendChild(bookmarkDiv);
    });
  });
}

AutoSyncSetDaysButton = document.getElementById("AutoSyncSetDaysButton");
AutoSyncSetDaysinput = document.getElementById("AutoSyncSetDays");
const container1 = document.getElementById("logContainerSetDays");

chrome.storage.local.get("SyncEverySetDate", (data) => {
  AutoSyncSetDaysinput.value = data.SyncEverySetDate || 30; // Default to 30 days if not set
});

document
  .getElementById("AutoSyncSetDaysButton")
  .addEventListener("click", () => {
    chrome.storage.local.set({ SyncEverySetDate: AutoSyncSetDaysinput.value });
    container1.textContent = ""; // Clear previous content
    container1.textContent =
      "Auto Sync: every " + AutoSyncSetDaysinput.value + " days.";
  });

document
  .getElementById("AutoSyncSetDaysButtonReset")
  .addEventListener("click", () => {
    chrome.storage.local.set({ SyncEverySetDate: 30 });
    location.reload();
  });

BorderSetSizeButton = document.getElementById("CustomBorderSizeButton");
BorderSetSizeinput = document.getElementById("BorderSetSize");
const container2 = document.getElementById("logContainerCustomBorderSize");

chrome.storage.local.get("CustomBorderSize", (data) => {
  BorderSetSizeinput.value = data.CustomBorderSize || 4; // Default to 4 days if not set
});

document
  .getElementById("CustomBorderSizeButton")
  .addEventListener("click", () => {
    chrome.storage.local.set({ CustomBorderSize: BorderSetSizeinput.value });
    container2.textContent = ""; // Clear previous content
    container2.textContent =
      "Border size: " + BorderSetSizeinput.value + " px.";
  });

document
  .getElementById("CustomBorderSizeButtonReset")
  .addEventListener("click", () => {
    chrome.storage.local.set({ CustomBorderSize: 4 });
    location.reload();
  });
