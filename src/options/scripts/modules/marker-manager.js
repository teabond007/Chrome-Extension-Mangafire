/**
 * @fileoverview Manages Custom Markers for the extension.
 * Allows users to create, view, and delete personalized markers with custom colors and border styles.
 */

import { Log } from '../ui/logger.js';

/**
 * Initializes the marker manager module.
 * Attaches listeners for adding new markers and resetting the entire list.
 * Triggers the initial render of existing markers.
 * 
 * @returns {void}
 */
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
                    
                    // Add the new marker to the local storage array
                    chrome.storage.local.set({ customBookmarks: [...existing, newMarker] }, () => {
                        Log(`Added custom marker: ${name}`);
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

    // Perform initial render
    renderMarkers();
}

/**
 * Renders the list of active custom markers from storage into the UI container.
 * Creates interactive pills for each marker that allow for individual deletion.
 * 
 * @returns {void}
 */
export function renderMarkers() {
    chrome.storage.local.get("customBookmarks", (data) => {
        const bookmarks = data.customBookmarks || [];
        const container = document.getElementById("CustomBookmarksContainer");
        if (!container) return;

        container.innerHTML = "";

        // Display empty state message if no markers exist
        if (bookmarks.length === 0) {
            const emptyMsg = document.createElement("span");
            emptyMsg.className = "description";
            emptyMsg.style.margin = "0";
            emptyMsg.textContent = "No active markers.";
            container.appendChild(emptyMsg);
            return;
        }

        // Construct and append marker pills
        bookmarks.forEach((bookmark, index) => {
            const pill = document.createElement("div");
            pill.className = "marker-pill";
            // Use 20% opacity for the background color background
            pill.style.backgroundColor = `${bookmark.color}33`;
            // Use 80% opacity for the border
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

/**
 * Removes a single marker from the list by its index.
 * Persists the updated list back to storage and re-renders the UI.
 * 
 * @param {number} index - The index of the marker to remove from the array.
 * @returns {void}
 */
function removeMarker(index) {
    chrome.storage.local.get("customBookmarks", (data) => {
        const bookmarks = data.customBookmarks || [];
        if (index >= 0 && index < bookmarks.length) {
            const removed = bookmarks.splice(index, 1);
            chrome.storage.local.set({ customBookmarks: bookmarks }, () => {
                Log(`Marker removed: ${removed[0].name}`);
                renderMarkers();
            });
        }
    });
}

