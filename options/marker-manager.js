/**
 * Custom Marker management
 */
import { Log } from './utils.js';

export function initMarkerManager() {
    const addBtn = document.getElementById("addBookmarkButton");
    const resetBtn = document.getElementById("resetBookmarkButton");

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const name = document.getElementById("bookmarkName").value;
            const color = document.getElementById("colorBookmarks").value;
            const style = document.getElementById("customBorderStyleSelect").value;

            if (name && color) {
                chrome.storage.local.get("customBookmarks", (data) => {
                    const existing = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
                    const newMarker = { name, color, style };
                    chrome.storage.local.set({ customBookmarks: [...existing, newMarker] }, () => {
                        Log(`Added marker: ${name}`);
                        document.getElementById("bookmarkName").value = "";
                        renderMarkers();
                    });
                });
            } else {
                alert("Please enter a name for the marker.");
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to remove all custom markers?")) {
                chrome.storage.local.remove("customBookmarks", () => {
                    Log("All custom markers removed.");
                    renderMarkers();
                });
            }
        });
    }

    renderMarkers();
}

export function renderMarkers() {
    chrome.storage.local.get("customBookmarks", (data) => {
        const bookmarks = data.customBookmarks || [];
        const container = document.getElementById("CustomBookmarksContainer");
        if (!container) return;

        container.innerHTML = "";

        if (bookmarks.length === 0) {
            const emptyMsg = document.createElement("span");
            emptyMsg.className = "description";
            emptyMsg.style.margin = "0";
            emptyMsg.textContent = "No active markers.";
            container.appendChild(emptyMsg);
            return;
        }

        bookmarks.forEach((bookmark, index) => {
            const pill = document.createElement("div");
            pill.className = "marker-pill";
            pill.style.backgroundColor = `${bookmark.color}33`;
            pill.style.border = `2px ${bookmark.style} ${bookmark.color}CC`;
            pill.textContent = bookmark.name;
            pill.title = "Click to remove";

            pill.addEventListener("click", () => {
                if (confirm(`Remove marker "${bookmark.name}"?`)) {
                    removeMarker(index);
                }
            });

            container.appendChild(pill);
        });
    });
}

function removeMarker(index) {
    chrome.storage.local.get("customBookmarks", (data) => {
        const bookmarks = data.customBookmarks || [];
        if (index >= 0 && index < bookmarks.length) {
            bookmarks.splice(index, 1);
            chrome.storage.local.set({ customBookmarks: bookmarks }, () => {
                Log("Marker removed.");
                renderMarkers();
            });
        }
    });
}
