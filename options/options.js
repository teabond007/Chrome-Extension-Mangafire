

document.addEventListener("DOMContentLoaded", () => {
  // Theme Handling
  initTheme();
  
  // Navigation
  initTabs();

  // Feature Toggles (Sync with Popup)
  initFeatureToggles();
  
  // Initialize Rendering
  LogCustoomBookmarks();
  initRangeSlider();
  
  // Saved Entries
  initSavedEntries();

  // Import & Export
  initImportExport();
});

// --- Feature Toggles Logic ---
function initFeatureToggles() {
    const features = [
        { id: "MarkHomePage", storageKey: "MarkHomePagefeatureEnabled" },
        { id: "SyncandMarkRead", storageKey: "SyncandMarkReadfeatureEnabled" },
        { id: "CustomBookmarks", storageKey: "CustomBookmarksfeatureEnabled" },
        { id: "AutoSync", storageKey: "AutoSyncfeatureEnabled" },
        { id: "CustomBorderSize", storageKey: "CustomBorderSizefeatureEnabled" },
        { id: "FamilyFriendly", storageKey: "FamilyFriendlyfeatureEnabled" }
    ];

    features.forEach(feature => {
        const toggle = document.getElementById(feature.id);
        if(!toggle) return;

        // Load initial state
        chrome.storage.local.get(feature.storageKey, (data) => {
             toggle.checked = data[feature.storageKey] || false; 
        });

        // Listen for changes
        toggle.addEventListener("change", () => {
             const update = {};
             update[feature.storageKey] = toggle.checked;
             chrome.storage.local.set(update);
        });
    });
    
    // Sync across pages (if popup changes it)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            features.forEach(feature => {
                if (changes[feature.storageKey]) {
                    const toggle = document.getElementById(feature.id);
                    if(toggle) toggle.checked = changes[feature.storageKey].newValue;
                }
            });
        }
    });
}


// --- Tab Navigation ---
function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetTab = item.getAttribute('data-tab');
      if (!targetTab) return; // Ignore links without tab data
      
      // Update Nav State
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Update Tab Content
      tabPanes.forEach(pane => {
        if (pane.id === `tab-${targetTab}`) {
          pane.style.display = 'block';
          // Small delay to trigger animation if class is used
          setTimeout(() => pane.classList.add('active'), 10);
        } else {
          pane.style.display = 'none';
          pane.classList.remove('active');
        }
      });
    });
  });
}

// --- Theme Logic ---
function initTheme() {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const body = document.body;

  // Check storage or system preference
  chrome.storage.local.get("theme", (data) => {
    if (data.theme === "dark") {
      body.classList.add("dark-mode");
    } else if (data.theme === "light") {
      body.classList.remove("dark-mode");
    } else {
      // System Default
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add("dark-mode");
      }
    }
  });

  // Toggle Listener
  themeToggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
  });
}

// --- Range Slider Logic ---
function initRangeSlider() {
  const slider = document.getElementById("BorderSetSize");
  const display = document.getElementById("rangeValueDisplay");
  
  if (slider && display) {
    // Update display on slide
    slider.addEventListener("input", (e) => {
      display.textContent = `${e.target.value}px`;
    });
    
    // Set initial display based on loaded value (async)
    chrome.storage.local.get("CustomBorderSize", (data) => {
      const val = data.CustomBorderSize || 4;
      slider.value = val;
      display.textContent = `${val}px`;
    });
  }
}

// --- Logging Utility ---
function Log(txt) {
  const logContainer = document.getElementById("logContainer");
  if (!logContainer) return;
  const logLine = document.createElement("div");
  logLine.textContent = `> ${txt}`;
  logContainer.appendChild(logLine);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// --- Event Listeners ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "log") {
    Log(msg.text);
  }
});

document.getElementById("sendMessageBtnSyncBookmarks").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
  Log("Sync started manually...");
});


document.getElementById("resetBookmarkButton").addEventListener("click", () => {
  if(confirm("Are you sure you want to remove all custom markers?")) {
    chrome.storage.local.remove("customBookmarks");
    Log("All custom markers removed.");
    location.reload();
  }
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
        Log(`Added marker: ${bookmarkName}`);
        document.getElementById("bookmarkName").value = ""; // Clear input field
        document.getElementById("colorBookmarks").value = "#ff0000"; // Reset color picker
      });
    });
  } else {
    alert("Please enter a name for the marker.");
  }
  setTimeout(LogCustoomBookmarks, 200);
});

// --- Bookmark Rendering (Pills) ---
function LogCustoomBookmarks() {
  chrome.storage.local.get("customBookmarks", (data) => {
    const bookmarks = data.customBookmarks || [];
    const container = document.getElementById("CustomBookmarksContainer");
    
    // Clear previous content
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if (bookmarks.length === 0) {
        // Updated empty state message
        const emptyMsg = document.createElement("span");
        emptyMsg.className = "description";
        emptyMsg.style.margin = "0";
        emptyMsg.textContent = "No active markers.";
        container.appendChild(emptyMsg);
        return;
    }

    bookmarks.forEach((bookmark, index) => {
      // Create Pill
      const pill = document.createElement("div");
      pill.className = "marker-pill";
      pill.style.backgroundColor = `${bookmark.color}33`;
      console.log("Bookmark color:", bookmark.color);
      pill.style.border = `2px ${bookmark.style} ${bookmark.color}CC`;
      pill.textContent = bookmark.name;
      pill.title = "Click to remove"; // Tooltip
      
      // Individual Delete Listener
      pill.addEventListener("click", () => {
          if(confirm(`Remove marker "${bookmark.name}"?`)) {
              removeBookmark(index);
          }
      });
      
      container.appendChild(pill);
    });
  });
}

function removeBookmark(index) {
    chrome.storage.local.get("customBookmarks", (data) => {
        const bookmarks = data.customBookmarks || [];
        if (index >= 0 && index < bookmarks.length) {
            bookmarks.splice(index, 1);
            chrome.storage.local.set({ customBookmarks: bookmarks }, () => {
                 Log("Marker removed.");
                 LogCustoomBookmarks(); // Re-render
            });
        }
    });
}


// --- Auto Sync Logic ---
const AutoSyncSetDaysButton = document.getElementById("AutoSyncSetDaysButton");
const AutoSyncSetDaysinput = document.getElementById("AutoSyncSetDays");
const container1 = document.getElementById("logContainerSetDays");

chrome.storage.local.get("SyncEverySetDate", (data) => {
  if(AutoSyncSetDaysinput) AutoSyncSetDaysinput.value = data.SyncEverySetDate || 30; 
});

if(AutoSyncSetDaysButton) {
    AutoSyncSetDaysButton.addEventListener("click", () => {
        chrome.storage.local.set({ SyncEverySetDate: AutoSyncSetDaysinput.value });
        container1.textContent = "Saved: Auto Sync every " + AutoSyncSetDaysinput.value + " days.";
        setTimeout(() => container1.textContent = "", 3000);
    });
}

document.getElementById("AutoSyncSetDaysButtonReset").addEventListener("click", () => {
    chrome.storage.local.set({ SyncEverySetDate: 30 });
    if(AutoSyncSetDaysinput) AutoSyncSetDaysinput.value = 30;
    container1.textContent = "Reset to default (30 days).";
    setTimeout(() => container1.textContent = "", 3000);
});

// --- Border Size Logic ---
const CustomBorderSizeButton = document.getElementById("CustomBorderSizeButton");
const BorderSetSizeinput = document.getElementById("BorderSetSize");
const container2 = document.getElementById("logContainerCustomBorderSize");

// Note: Initial value set in initRangeSlider

if(CustomBorderSizeButton) {
    CustomBorderSizeButton.addEventListener("click", () => {
        chrome.storage.local.set({ CustomBorderSize: BorderSetSizeinput.value });
        container2.textContent = "Saved: Border size " + BorderSetSizeinput.value + " px.";
        setTimeout(() => container2.textContent = "", 3000);
    });
}

document.getElementById("CustomBorderSizeButtonReset").addEventListener("click", () => {
    chrome.storage.local.set({ CustomBorderSize: 4 });
    if(BorderSetSizeinput) {
        BorderSetSizeinput.value = 4;
        document.getElementById("rangeValueDisplay").textContent = "4px";
    }
    container2.textContent = "Reset to default (4px).";
    setTimeout(() => container2.textContent = "", 3000);
});

// --- Saved Entries Logic ---
// Moved to savedentries.js for better code organization

// --- Import & Export Logic ---
function initImportExport() {
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const importInput = document.getElementById('importDataInput');
    const dropZone = document.getElementById('dropZone');
    const mergeToggle = document.getElementById('mergeImportToggle');
    const lastBackupDisplay = document.getElementById('lastBackupDisplay');

    // Update Last Backup Display
    const updateLastBackupDisplay = () => {
        chrome.storage.local.get("LastBackupDate", (data) => {
            if (data.LastBackupDate) {
                const date = new Date(data.LastBackupDate);
                lastBackupDisplay.textContent = date.toLocaleString();
            } else {
                lastBackupDisplay.textContent = "Never";
            }
        });
    };
    updateLastBackupDisplay();

    // Export Logic
    exportBtn.addEventListener('click', () => {
        const keysToExport = [
            "userBookmarks",
            "customBookmarks",
            "SyncLastDate",
            "SyncEverySetDate",
            "CustomBorderSize",
            "MarkHomePagefeatureEnabled",
            "SyncandMarkReadfeatureEnabled",
            "CustomBookmarksfeatureEnabled",
            "AutoSyncfeatureEnabled",
            "CustomBorderSizefeatureEnabled",
            "FamilyFriendlyfeatureEnabled"
        ];

        chrome.storage.local.get(keysToExport, (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mangafire_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const now = Date.now();
            chrome.storage.local.set({ LastBackupDate: now }, () => {
                updateLastBackupDisplay();
                Log("Data exported successfully.");
            });
        });
    });

    // Import Logic
    const handleFile = (file) => {
        if (!file || file.type !== "application/json" && !file.name.endsWith(".json")) {
            alert("Please select a valid JSON file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                const isMerge = mergeToggle.checked;

                if (isMerge) {
                    processMergeImport(importedData);
                } else {
                    processOverwriteImport(importedData);
                }
            } catch (err) {
                console.error("Import error:", err);
                alert("Failed to parse JSON file. Please ensure it is a valid backup.");
            }
        };
        reader.readAsText(file);
    };

    const processOverwriteImport = (data) => {
        if (confirm("This will overwrite all your current data. Are you sure?")) {
            chrome.storage.local.clear(() => {
                chrome.storage.local.set(data, () => {
                    Log("Data imported (Overwrite) successfully.");
                    alert("Import successful! The page will now reload.");
                    location.reload();
                });
            });
        }
    };

    const processMergeImport = (data) => {
        chrome.storage.local.get(null, (currentData) => {
            const mergedData = { ...currentData, ...data };

            // Special handling for bookmarks and custom markers
            if (data.userBookmarks && currentData.userBookmarks) {
                const bookmarkMap = new Map();
                currentData.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
                data.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
                mergedData.userBookmarks = Array.from(bookmarkMap.values());
            }

            if (data.customBookmarks && currentData.customBookmarks) {
                const markerMap = new Map();
                currentData.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
                data.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
                mergedData.customBookmarks = Array.from(markerMap.values());
            }

            chrome.storage.local.set(mergedData, () => {
                Log("Data imported (Merge) successfully.");
                alert("Import successful! New data has been merged.");
                location.reload();
            });
        });
    };

    // Drag and Drop
    dropZone.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });
}
