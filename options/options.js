

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

document.getElementById("sendMessageBtn").addEventListener("click", () => {
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
let savedEntriesMerged = [];
let customMarkers = [];
let fetchInProgress = false;

function initSavedEntries() {
  const grid = document.getElementById("manga-grid");
  const filterSelect = document.getElementById("savedStatusFilter");
  const formatFilter = document.getElementById("savedFormatFilter");
  const searchInput = document.getElementById("savedSearchInput");
  const viewCompactBtn = document.getElementById("view-compact-btn");
  const viewLargeBtn = document.getElementById("view-large-btn");

  if (!grid) return;

  // Load custom markers and add to status filter
  chrome.storage.local.get(["customBookmarks"], (data) => {
    customMarkers = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
    populateStatusFilterWithMarkers();
  });

  // Load saved entries merged data
  chrome.storage.local.get(["savedEntriesMerged", "userBookmarks", "anilistCache", "cardViewSize", "FamilyFriendlyfeatureEnabled"], (data) => {
    // Check if merged data exists
    if (data.savedEntriesMerged && Array.isArray(data.savedEntriesMerged)) {
      savedEntriesMerged = data.savedEntriesMerged;
      console.log("Loaded from savedEntriesMerged:", savedEntriesMerged.length, "entries");
    } else {
      // Create merged data from legacy storage
      console.log("Creating savedEntriesMerged from legacy data");
      savedEntriesMerged = createSavedEntriesMerged(
        data.userBookmarks || [],
        data.anilistCache || {}
      );
      // Save merged data
      chrome.storage.local.set({ savedEntriesMerged: savedEntriesMerged });
    }

    updateLibrarySubtitle();
    filterSavedEntries(); // Use filter to apply family-friendly mode on load

    // Restore view size preference
    const viewSize = data.cardViewSize || "large";
    setViewSize(viewSize);

    // Start background fetch for missing info
    if (!fetchInProgress) {
      fetchMissingAnilistData();
    }
  });

  // Event Listeners for Filters
  if (filterSelect) {
    filterSelect.addEventListener("change", filterSavedEntries);
  }
  if (formatFilter) {
    formatFilter.addEventListener("change", filterSavedEntries);
  }
  if (searchInput) {
    searchInput.addEventListener("input", filterSavedEntries);
  }

  // View Size Toggle
  if (viewCompactBtn) {
    viewCompactBtn.addEventListener("click", () => {
      setViewSize("compact");
      chrome.storage.local.set({ cardViewSize: "compact" });
    });
  }
  if (viewLargeBtn) {
    viewLargeBtn.addEventListener("click", () => {
      setViewSize("large");
      chrome.storage.local.set({ cardViewSize: "large" });
    });
  }
}

function createSavedEntriesMerged(userBookmarks, anilistCache) {
  return userBookmarks.map(bookmark => ({
    title: bookmark.title,
    status: bookmark.status,
    anilistData: anilistCache[bookmark.title.toLowerCase()] || null,
    customMarker: null, // Will be set by user
    lastUpdated: Date.now()
  }));
}

function setViewSize(size) {
  const grid = document.getElementById("manga-grid");
  const compactBtn = document.getElementById("view-compact-btn");
  const largeBtn = document.getElementById("view-large-btn");

  if (size === "compact") {
    grid.classList.add("compact");
    compactBtn.classList.add("active");
    largeBtn.classList.remove("active");
  } else {
    grid.classList.remove("compact");
    largeBtn.classList.add("active");
    compactBtn.classList.remove("active");
  }
}

function populateStatusFilterWithMarkers() {
  const statusFilter = document.getElementById("savedStatusFilter");
  if (!statusFilter) return;

  // Keep base options, remove any previously added markers
  const existingMarkerOptions = statusFilter.querySelectorAll('.custom-marker-option');
  existingMarkerOptions.forEach(opt => opt.remove());

  // Add separator and custom markers if any
  if (customMarkers.length > 0) {
    // Add separator
    const separator = document.createElement("option");
    separator.disabled = true;
    separator.textContent = "── Custom Markers ──";
    separator.className = "custom-marker-option";
    statusFilter.appendChild(separator);

    // Add custom markers
    customMarkers.forEach(marker => {
      const option = document.createElement("option");
      option.value = `marker:${marker.name}`;
      option.textContent = `📌 ${marker.name}`;
      option.className = "custom-marker-option";
      option.style.color = marker.color;
      statusFilter.appendChild(option);
    });
  }
}

function renderSavedEntries(entries) {
  const grid = document.getElementById("manga-grid");
  grid.innerHTML = "";

  if (entries.length === 0) {
    grid.innerHTML = `
        <div class="empty-library">
            <div class="empty-library-icon">📚</div>
            <p><strong>No bookmarks found</strong></p>
            <p>Sync your bookmarks from the Settings tab to get started</p>
        </div>
    `;
    return;
  }

  entries.forEach(entry => {
    const card = createMangaCard(entry);
    grid.appendChild(card);
  });
}

function createMangaCard(entry) {
    const card = document.createElement("div");
    card.className = "manga-card";
    card.dataset.title = entry.title; // For filtering

    const aniData = entry.anilistData;

    // Apply custom marker border if exists
    if (entry.customMarker) {
      const marker = customMarkers.find(m => m.name === entry.customMarker);
      if (marker) {
        card.classList.add("has-custom-marker");
        card.style.borderColor = marker.color;
        card.style.borderStyle = marker.style || "solid";
      }
    }

    // Cover Image
    const coverUrl = aniData?.coverImage?.large || aniData?.coverImage?.medium || "https://via.placeholder.com/200x300?text=No+Image";
    const cover = document.createElement("div");
    cover.className = "manga-card-cover";
    cover.style.backgroundImage = `url('${coverUrl}')`;

    // Status Dot
    const statusDot = document.createElement("div");
    statusDot.className = `card-status-dot ${getStatusDotClass(entry.status)}`;
    cover.appendChild(statusDot);

    // Card Actions (on hover)
    const actions = document.createElement("div");
    actions.className = "manga-card-actions";
    
    if (aniData && aniData.siteUrl) {
        const viewBtn = document.createElement("a");
        viewBtn.className = "card-action-btn";
        viewBtn.textContent = "View";
        viewBtn.href = aniData.siteUrl;
        viewBtn.target = "_blank";
        viewBtn.onclick = (e) => e.stopPropagation();
        actions.appendChild(viewBtn);
    }

    // Add Marker Button
    const markerBtn = document.createElement("button");
    markerBtn.className = "card-action-btn";
    markerBtn.textContent = entry.customMarker ? "✓ " + entry.customMarker : "+ Marker";
    markerBtn.onclick = (e) => {
        e.stopPropagation();
        showMarkerSelector(entry);
    };
    actions.appendChild(markerBtn);

    cover.appendChild(actions);
    card.appendChild(cover);

    // Card Body
    const body = document.createElement("div");
    body.className = "manga-card-body";

    // Title
    const title = document.createElement("h3");
    title.className = "manga-card-title";
    title.textContent = aniData?.title?.english || aniData?.title?.romaji || entry.title;
    title.title = title.textContent;
    body.appendChild(title);

    // Meta information
    const meta = document.createElement("div");
    meta.className = "manga-card-meta";

    // Saved Status Badge
    const savedStatus = document.createElement("span");
    savedStatus.className = `manga-card-status ${getStatusClass(entry.status)}`;
    savedStatus.textContent = entry.status;
    meta.appendChild(savedStatus);

    // AniList Details if available
    if (aniData) {
        const info = document.createElement("div");
        info.className = "manga-card-info";
        
        // Format badge
        const formatName = getFormatName(aniData.format, aniData.countryOfOrigin);
        if (formatName && formatName !== "Unknown") {
            const formatItem = document.createElement("div");
            formatItem.className = "info-item format-badge";
            formatItem.textContent = formatName;
            info.appendChild(formatItem);
        }
        
        if (aniData.chapters) {
            const chaptersItem = document.createElement("div");
            chaptersItem.className = "info-item";
            chaptersItem.innerHTML = `<span class="info-label">CH:</span>${aniData.chapters}`;
            info.appendChild(chaptersItem);
        }
        
        meta.appendChild(info);
    } else {
        const loading = document.createElement("div");
        loading.className = "info-item";
        loading.textContent = "Loading info...";
        loading.style.opacity = "0.6";
        meta.appendChild(loading);
    }

    body.appendChild(meta);
    card.appendChild(body);

    return card;
}

function showMarkerSelector(entry) {
    const markerNames = customMarkers.map(m => m.name);
    markerNames.unshift("None");

    const current = entry.customMarker || "None";
    const selected = prompt(
        `Select a marker for "${entry.title}":\n\nAvailable markers:\n${markerNames.map((m, i) => `${i}: ${m}`).join('\n')}\n\nCurrent: ${current}\n\nEnter number:`,
        markerNames.indexOf(current)
    );

    if (selected === null) return; // Cancelled

    const index = parseInt(selected);
    if (isNaN(index) || index < 0 || index >= markerNames.length) {
        alert("Invalid selection");
        return;
    }

    const newMarker = markerNames[index] === "None" ? null : markerNames[index];
    
    // Update entry
    entry.customMarker = newMarker;
    entry.lastUpdated = Date.now();

    // Save to storage
    chrome.storage.local.set({ savedEntriesMerged: savedEntriesMerged }, () => {
        // Re-render
        filterSavedEntries();
    });
}

function getStatusDotClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("reading")) return "status-dot-reading";
    else if (statusLower.includes("read")) return "status-dot-read";
    else if (statusLower.includes("completed")) return "status-dot-completed";
    else if (statusLower.includes("dropped")) return "status-dot-dropped";
    else if (statusLower.includes("hold")) return "status-dot-onhold";
    else if (statusLower.includes("plan")) return "status-dot-planning";
    return "status-dot-default";
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("reading")) return "status-reading";
    else if (statusLower.includes("read")) return "status-read";
    else if (statusLower.includes("completed")) return "status-completed";
    else if (statusLower.includes("dropped")) return "status-dropped";
    else if (statusLower.includes("hold")) return "status-onhold";
    else if (statusLower.includes("plan")) return "status-planning";
    return "";
}

function formatAnilistStatus(status) {
    const statusMap = {
        "FINISHED": "Finished",
        "RELEASING": "Ongoing",
        "NOT_YET_RELEASED": "Upcoming",
        "CANCELLED": "Cancelled",
        "HIATUS": "Hiatus"
    };
    return statusMap[status] || status;
}

function filterSavedEntries() {
    const statusFilterEl = document.getElementById("savedStatusFilter");
    const formatFilterEl = document.getElementById("savedFormatFilter");
    const searchInputEl = document.getElementById("savedSearchInput");
    
    const statusFilter = statusFilterEl ? statusFilterEl.value : "All";
    const formatFilter = formatFilterEl ? formatFilterEl.value : "All";
    const searchFilter = searchInputEl ? searchInputEl.value.toLowerCase() : "";

    // Get family-friendly setting from storage
    chrome.storage.local.get(["FamilyFriendlyfeatureEnabled"], (data) => {
        const familyFriendly = data.FamilyFriendlyfeatureEnabled || false;
        
        const filtered = savedEntriesMerged.filter(entry => {
            const aniData = entry.anilistData;
            
            // Family Friendly Mode - hide ecchi/adult content
            if (familyFriendly && aniData && aniData.genres) {
                const blockedGenres = ['Ecchi', 'Hentai'];
                if (aniData.genres.some(g => blockedGenres.includes(g))) {
                    return false;
                }
            }
            
            // Status filter (including custom markers)
            let matchesStatus = true;
            if (statusFilter !== "All") {
                if (statusFilter.startsWith("marker:")) {
                    // Custom marker filter
                    const markerName = statusFilter.substring(7);
                    matchesStatus = entry.customMarker === markerName;
                } else {
                    // Regular status filter
                    matchesStatus = entry.status === statusFilter;
                }
            }
            
            // Format filter
            let matchesFormat = true;
            if (formatFilter !== "All" && aniData) {
                const entryFormat = getFormatName(aniData.format, aniData.countryOfOrigin);
                matchesFormat = entryFormat === formatFilter;
            } else if (formatFilter !== "All" && !aniData) {
                // If no AniList data yet, can't filter by format - show it
                matchesFormat = true;
            }
            
            // Search filter
            const matchesSearch = searchFilter === "" ||
                entry.title.toLowerCase().includes(searchFilter) ||
                (aniData?.title?.english?.toLowerCase().includes(searchFilter)) ||
                (aniData?.title?.romaji?.toLowerCase().includes(searchFilter));
            
            return matchesStatus && matchesFormat && matchesSearch;
        });

        renderSavedEntries(filtered);
        updateLibrarySubtitle(filtered.length);
    });
}

function updateLibrarySubtitle(count = null) {
    const subtitle = document.getElementById("library-subtitle");
    if (!subtitle) return;
    
    const total = count !== null ? count : savedEntriesMerged.length;
    subtitle.textContent = `${total} item${total !== 1 ? 's' : ''}`;
}

function updateProgress(current, total) {
    const progressBar = document.getElementById("progress-bar-fill");
    const progressText = document.getElementById("progress-text");
    const progressPercent = document.getElementById("progress-percent");
    const progressContainer = document.getElementById("loading-progress");

    if (progressContainer && total > 0) {
        progressContainer.style.display = "block";
        const percent = Math.round((current / total) * 100);
        
        if (progressBar) progressBar.style.width = percent + "%";
        if (progressText) progressText.textContent = `Fetching data for ${total - current} new items...`;
        if (progressPercent) progressPercent.textContent = percent + "%";
        
        if (current >= total) {
            setTimeout(() => {
                progressContainer.style.display = "none";
            }, 1000);
        }
    }
}

// Sequential fetcher with delay to avoid rate limits
async function fetchMissingAnilistData() {
    if (fetchInProgress) return;
    fetchInProgress = true;

    const missing = savedEntriesMerged.filter(entry => !entry.anilistData);
    
    if (missing.length === 0) {
        fetchInProgress = false;
        updateLibrarySubtitle();
        return;
    }

    updateProgress(0, missing.length);

    for (let i = 0; i < missing.length; i++) {
        const entry = missing[i];
        
        if (entry.anilistData) {
            updateProgress(i + 1, missing.length);
            continue;
        }

        const data = await fetchMangaFromAnilist(entry.title);
        if (data) {
            entry.anilistData = data;
            entry.lastUpdated = Date.now();
            
            // Save updated merged data
            chrome.storage.local.set({ savedEntriesMerged: savedEntriesMerged });
            
            // Also update legacy cache for backward compatibility
            chrome.storage.local.get(["anilistCache"], (cacheData) => {
                const cache = cacheData.anilistCache || {};
                cache[entry.title.toLowerCase()] = data;
                chrome.storage.local.set({ anilistCache: cache });
            });
            
            // Re-render to show updated card
            filterSavedEntries();
        }

        updateProgress(i + 1, missing.length);

        // Note: Rate limiting is handled by fetchMangaFromAnilist internally
    }
    
    fetchInProgress = false;
    updateLibrarySubtitle();
}

