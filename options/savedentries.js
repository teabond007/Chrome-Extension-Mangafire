/**
 * Saved Entries Module
 * Handles the display, filtering, and management of user's saved manga entries
 * with AniList integration.
 */

// Module state
let savedEntriesMerged = [];
let customMarkers = [];
let fetchInProgress = false;

// DOM element references (cached on init)
let elements = {
  grid: null,
  statusFilter: null,
  formatFilter: null,
  searchInput: null,
  viewCompactBtn: null,
  viewLargeBtn: null,
  subtitle: null,
  progressBar: null,
  progressText: null,
  progressPercent: null,
  progressContainer: null
};

document.getElementById("BtnTrashAndSyncEntries").addEventListener("click", async () => {
  await chrome.storage.local.remove([ "savedEntriesMerged", "anilistCache" ]);
  fetchMissingAnilistData();

  console.log("Entries Sync started manually...");
});
/**
 * Initialize the Saved Entries tab
 * Sets up event listeners, loads data, and starts background fetching
 */
function initSavedEntries() {
  // Cache DOM elements
  elements = {
    grid: document.getElementById("manga-grid"),
    statusFilter: document.getElementById("savedStatusFilter"),
    formatFilter: document.getElementById("savedFormatFilter"),
    searchInput: document.getElementById("savedSearchInput"),
    viewCompactBtn: document.getElementById("view-compact-btn"),
    viewLargeBtn: document.getElementById("view-large-btn"),
    subtitle: document.getElementById("library-subtitle"),
    progressBar: document.getElementById("progress-bar-fill"),
    progressText: document.getElementById("progress-text"),
    progressPercent: document.getElementById("progress-percent"),
    progressContainer: document.getElementById("loading-progress")
  };

  if (!elements.grid) return;

  // Load custom markers and populate status filter
  chrome.storage.local.get(["customBookmarks"], (data) => {
    customMarkers = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
    populateStatusFilterWithMarkers();
  });

  // Load saved entries data
  loadSavedEntries();

  // Attach event listeners
  attachEventListeners();
}

/**
 * Load saved entries from storage and initialize display
 */
function loadSavedEntries() {
  chrome.storage.local.get([
    "savedEntriesMerged",
    "userBookmarks",
    "anilistCache",
    "cardViewSize",
    "FamilyFriendlyfeatureEnabled"
  ], (data) => {
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
    filterSavedEntries(); // Apply filters including family-friendly mode

    // Restore view size preference
    const viewSize = data.cardViewSize || "large";
    setViewSize(viewSize);

    // Start background fetch for missing AniList data
    if (!fetchInProgress) {
      fetchMissingAnilistData();
    }
  });
}

/**
 * Attach event listeners to filter controls and view toggles
 */
function attachEventListeners() {
  // Filter listeners
  if (elements.statusFilter) {
    elements.statusFilter.addEventListener("change", filterSavedEntries);
  }
  if (elements.formatFilter) {
    elements.formatFilter.addEventListener("change", filterSavedEntries);
  }
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", filterSavedEntries);
  }

  // View size toggle listeners
  if (elements.viewCompactBtn) {
    elements.viewCompactBtn.addEventListener("click", () => {
      setViewSize("compact");
      chrome.storage.local.set({ cardViewSize: "compact" });
    });
  }
  if (elements.viewLargeBtn) {
    elements.viewLargeBtn.addEventListener("click", () => {
      setViewSize("large");
      chrome.storage.local.set({ cardViewSize: "large" });
    });
  }
}

/**
 * Create merged storage object from legacy bookmarks and cache
 */
function createSavedEntriesMerged(userBookmarks, anilistCache) {
  return userBookmarks.map(bookmark => ({
    title: bookmark.title,
    status: bookmark.status,
    anilistData: anilistCache[bookmark.title.toLowerCase()] || null,
    customMarker: null,
    lastUpdated: Date.now()
  }));
}

/**
 * Toggle between compact and large card view
 */
function setViewSize(size) {
  if (!elements.grid) return;

  if (size === "compact") {
    elements.grid.classList.add("compact");
    elements.viewCompactBtn?.classList.add("active");
    elements.viewLargeBtn?.classList.remove("active");
  } else {
    elements.grid.classList.remove("compact");
    elements.viewLargeBtn?.classList.add("active");
    elements.viewCompactBtn?.classList.remove("active");
  }
}

/**
 * Populate status filter dropdown with custom markers
 */
function populateStatusFilterWithMarkers() {
  if (!elements.statusFilter) return;

  // Remove any previously added markers
  const existingMarkerOptions = elements.statusFilter.querySelectorAll('.custom-marker-option');
  existingMarkerOptions.forEach(opt => opt.remove());

  // Add separator and custom markers if any exist
  if (customMarkers.length > 0) {
    // Add separator
    const separator = document.createElement("option");
    separator.disabled = true;
    separator.textContent = "── Custom Markers ──";
    separator.className = "custom-marker-option";
    elements.statusFilter.appendChild(separator);

    // Add custom markers
    customMarkers.forEach(marker => {
      const option = document.createElement("option");
      option.value = `marker:${marker.name}`;
      option.textContent = `📌 ${marker.name}`;
      option.className = "custom-marker-option";
      option.style.color = marker.color;
      elements.statusFilter.appendChild(option);
    });
  }
}

/**
 * Render manga entries to the grid
 */
function renderSavedEntries(entries) {
  if (!elements.grid) return;
  elements.grid.innerHTML = "";

  if (entries.length === 0) {
    elements.grid.innerHTML = `
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
    elements.grid.appendChild(card);
  });
}

/**
 * Create a manga card element
 */
function createMangaCard(entry) {
  const card = document.createElement("div");
  card.className = "manga-card";
  card.dataset.title = entry.title;

  const aniData = entry.anilistData;

  // Apply custom marker border
  if (entry.customMarker) {
    const marker = customMarkers.find(m => m.name === entry.customMarker);
    if (marker) {
      card.classList.add("has-custom-marker");
      card.style.borderColor = marker.color;
      card.style.borderStyle = marker.style || "solid";
    }
  }

  // Create cover section
  const cover = createCardCover(entry, aniData);
  card.appendChild(cover);

  // Create body section
  const body = createCardBody(entry, aniData);
  card.appendChild(body);
  card.style.border = `2px solid ${getStatusClassColor(entry.status)}`;
  return card;
}

/**
 * Create card cover with image, status dot, and actions
 */
function createCardCover(entry, aniData) {
  const coverUrl = aniData?.coverImage?.large ?? 
                   aniData?.coverImage?.medium ?? 
                   "../images/no-image-svgrepo-com.svg";
  
  const cover = document.createElement("div");
  cover.className = "manga-card-cover";
  cover.style.backgroundImage = `url('${coverUrl}')`;

  // Status dot indicator
  const statusDot = document.createElement("div");
  statusDot.className = `card-status-dot ${getStatusDotClass(entry.status)}`;
  cover.appendChild(statusDot);

  // Hover actions
  const actions = createCardActions(entry, aniData);
  cover.appendChild(actions);

  return cover;
}

/**
 * Create card action buttons (View, Marker)
 */
function createCardActions(entry, aniData) {
  const actions = document.createElement("div");
  actions.className = "manga-card-actions";

  // View on AniList button
  if (aniData?.siteUrl) {
    const viewBtn = document.createElement("a");
    viewBtn.className = "card-action-btn";
    viewBtn.textContent = "View";
    viewBtn.href = aniData.siteUrl;
    viewBtn.target = "_blank";
    viewBtn.onclick = (e) => e.stopPropagation();
    actions.appendChild(viewBtn);
  }

  // Add/Change marker button
  const markerBtn = document.createElement("button");
  markerBtn.className = "card-action-btn";
  markerBtn.textContent = entry.customMarker ? `✓ ${entry.customMarker}` : "+ Marker";
  markerBtn.onclick = (e) => {
    e.stopPropagation();
    showMarkerSelector(entry);
  };
  actions.appendChild(markerBtn);

  return actions;
}

/**
 * Create card body with title, status, and metadata
 */
function createCardBody(entry, aniData) {
  const body = document.createElement("div");
  body.className = "manga-card-body";

  // Title
  const title = document.createElement("h3");
  title.className = "manga-card-title";
  title.textContent = aniData?.title?.english || aniData?.title?.romaji || entry.title;
  title.title = title.textContent;
  body.appendChild(title);

  // Metadata section
  const meta = createCardMeta(entry, aniData);
  body.appendChild(meta);
  body.style.border = `2px solid ${getStatusClass(entry.status)}`;
  return body;
}

/**
 * Create card metadata (status badge, format, chapters)
 */
function createCardMeta(entry, aniData) {
  const meta = document.createElement("div");
  meta.className = "manga-card-meta";

  // Saved status badge
  const savedStatus = document.createElement("span");
  savedStatus.className = `manga-card-status ${getStatusClass(entry.status)}`;
  savedStatus.textContent = entry.status;
  meta.appendChild(savedStatus);

  // AniList details
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

    // Chapter count
    if (aniData.chapters) {
      const chaptersItem = document.createElement("div");
      chaptersItem.className = "info-item";
      chaptersItem.innerHTML = `<span class="info-label">CH:</span>${aniData.chapters}`;
      info.appendChild(chaptersItem);
    }

    meta.appendChild(info);
  } else {
    // Loading indicator
    const loading = document.createElement("div");
    loading.className = "info-item";
    loading.textContent = "Loading info...";
    loading.style.opacity = "0.6";
    meta.appendChild(loading);
  }

  return meta;
}

/**
 * Show marker selection dialog
 */
function showMarkerSelector(entry) {
  const markerNames = customMarkers.map(m => m.name);
  markerNames.unshift("None");

  const current = entry.customMarker || "None";
  const selected = prompt(
    `Select a marker for "${entry.title}":\n\nAvailable markers:\n${markerNames.map((m, i) => `${i}: ${m}`).join('\n')}\n\nCurrent: ${current}\n\nEnter number:`,
    markerNames.indexOf(current)
  );

  if (selected === null) return;

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
    filterSavedEntries(); // Re-render with filters
  });
}

/**
 * Get CSS class for status dot indicator
 */
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

/**
 * Get CSS class for status badge
 */
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

function getStatusClassColor(status) {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("reading")) return "green";
  else if (statusLower.includes("read")) return "gray";
  else if (statusLower.includes("completed")) return "blue";
  else if (statusLower.includes("dropped")) return "red";
  else if (statusLower.includes("hold")) return "orange";
  else if (statusLower.includes("plan")) return "purple";
  return "";
}

/**
 * Filter saved entries based on status, format, search, and family-friendly settings
 */
function filterSavedEntries() {
  const statusFilter = elements.statusFilter?.value || "All";
  const formatFilter = elements.formatFilter?.value || "All";
  const searchFilter = elements.searchInput?.value.toLowerCase() || "";

  // Get family-friendly setting from storage
  chrome.storage.local.get(["FamilyFriendlyfeatureEnabled"], (data) => {
    const familyFriendly = data.FamilyFriendlyfeatureEnabled || false;

    const filtered = savedEntriesMerged.filter(entry => {
      const aniData = entry.anilistData;

      // Family Friendly Mode - filter out adult content
      if (familyFriendly && aniData?.genres) {
        const blockedGenres = ['Ecchi', 'Hentai'];
        if (aniData.genres.some(g => blockedGenres.includes(g))) {
          return false;
        }
      }

      // Status filter (including custom markers)
      let matchesStatus = true;
      if (statusFilter !== "All") {
        if (statusFilter.startsWith("marker:")) {
          const markerName = statusFilter.substring(7);
          matchesStatus = entry.customMarker === markerName;
        } else {
          matchesStatus = entry.status === statusFilter;
        }
      }

      // Format filter
      let matchesFormat = true;
      if (formatFilter !== "All" && aniData) {
        const entryFormat = getFormatName(aniData.format, aniData.countryOfOrigin);
        matchesFormat = entryFormat === formatFilter;
      } else if (formatFilter !== "All" && !aniData) {
        // If no AniList data yet, show it (can't filter)
        matchesFormat = true;
      }

      // Search filter (across multiple title fields)
      const matchesSearch = searchFilter === "" ||
        entry.title.toLowerCase().includes(searchFilter) ||
        aniData?.title?.english?.toLowerCase().includes(searchFilter) ||
        aniData?.title?.romaji?.toLowerCase().includes(searchFilter);

      return matchesStatus && matchesFormat && matchesSearch;
    });

    renderSavedEntries(filtered);
    updateLibrarySubtitle(filtered.length);
  });
}

/**
 * Update library subtitle with entry count
 */
function updateLibrarySubtitle(count = null) {
  if (!elements.subtitle) return;

  const total = count !== null ? count : savedEntriesMerged.length;
  elements.subtitle.textContent = `${total} item${total !== 1 ? 's' : ''}`;
}

/**
 * Update progress bar during AniList data fetching
 */
function updateProgress(current, total) {
  if (!elements.progressContainer || total === 0) return;

  elements.progressContainer.style.display = "block";
  const percent = Math.round((current / total) * 100);

  if (elements.progressBar) {
    elements.progressBar.style.width = percent + "%";
  }
  if (elements.progressText) {
    elements.progressText.textContent = `Fetching data for ${total - current} new items...`;
  }
  if (elements.progressPercent) {
    elements.progressPercent.textContent = percent + "%";
  }

  // Hide progress bar when complete
  if (current >= total) {
    setTimeout(() => {
      elements.progressContainer.style.display = "none";
    }, 1000);
  }
}

/**
 * Fetch missing AniList data for entries sequentially
 * Rate limiting is handled by fetchMangaFromAnilist
 */
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

    // Skip if data was added during iteration
    if (entry.anilistData) {
      updateProgress(i + 1, missing.length);
      continue;
    }

    // Fetch from AniList
    const data = await fetchMangaFromAnilist(entry.title);
    if (data) {
      entry.anilistData = data;
      entry.lastUpdated = Date.now();

      // Save updated merged data
      chrome.storage.local.set({ savedEntriesMerged: savedEntriesMerged });

      // Update legacy cache for backward compatibility
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
