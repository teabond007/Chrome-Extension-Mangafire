/**
 * Library Manager Module
 * Handles loading, filtering, and data fetching for saved entries.
 */
import { createMangaCard, getFormatName } from './manga-card-factory.js';
import { fetchMangaFromAnilist } from './anilist-api.js';

let savedEntriesMerged = [];
let customMarkers = [];
let fetchInProgress = false;

let elements = {
    grid: null,
    statusFilter: null,
    formatFilter: null,
    searchInput: null,
    subtitle: null,
    progressBar: null,
    progressText: null,
    progressPercent: null,
    progressContainer: null,
    viewCompactBtn: null,
    viewLargeBtn: null
};

export function initLibrary() {
    elements = {
        grid: document.getElementById("manga-grid"),
        statusFilter: document.getElementById("savedStatusFilter"),
        formatFilter: document.getElementById("savedFormatFilter"),
        searchInput: document.getElementById("savedSearchInput"),
        subtitle: document.getElementById("library-subtitle"),
        progressBar: document.getElementById("progress-bar-fill"),
        progressText: document.getElementById("progress-text"),
        progressPercent: document.getElementById("progress-percent"),
        progressContainer: document.getElementById("loading-progress"),
        viewCompactBtn: document.getElementById("view-compact-btn"),
        viewLargeBtn: document.getElementById("view-large-btn")
    };

    if (!elements.grid) return;

    // Load initial data
    chrome.storage.local.get(["customBookmarks", "savedEntriesMerged", "userBookmarks", "cardViewSize", "FamilyFriendlyfeatureEnabled"], (data) => {
        customMarkers = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
        savedEntriesMerged = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
        
        // Rebuild if merged data is missing but base bookmarks exist
        if (savedEntriesMerged.length === 0 && Array.isArray(data.userBookmarks) && data.userBookmarks.length > 0) {
            console.log("Rebuilding library display from stored bookmarks...");
            savedEntriesMerged = data.userBookmarks.map(b => ({
                title: b.title,
                status: b.status,
                anilistData: null,
                customMarker: null,
                lastUpdated: Date.now()
            }));
            chrome.storage.local.set({ savedEntriesMerged });
        }

        populateStatusFilter();
        
        const viewSize = data.cardViewSize || "large";
        setViewSize(viewSize);
        
        filterEntries();
        
        if (!fetchInProgress) {
            fetchMissingData();
        }
    });

    attachListeners();
}

function attachListeners() {
    elements.statusFilter?.addEventListener("change", filterEntries);
    elements.formatFilter?.addEventListener("change", filterEntries);
    elements.searchInput?.addEventListener("input", filterEntries);

    elements.viewCompactBtn?.addEventListener("click", () => {
        setViewSize("compact");
        chrome.storage.local.set({ cardViewSize: "compact" });
    });

    elements.viewLargeBtn?.addEventListener("click", () => {
        setViewSize("large");
        chrome.storage.local.set({ cardViewSize: "large" });
    });

    const freshSyncBtn = document.getElementById("BtnTrashAndSyncEntries");
    if (freshSyncBtn) {
        freshSyncBtn.addEventListener("click", async () => {
            if (confirm("Reset library cache and fresh sync from AniList?")) {
                await chrome.storage.local.remove(["savedEntriesMerged"]);
                location.reload();
            }
        });
    }
}

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

function populateStatusFilter() {
    if (!elements.statusFilter) return;
    // Keep original options, add custom ones
    const originalCount = 6; // All, Reading, etc.
    while (elements.statusFilter.options.length > originalCount) {
        elements.statusFilter.remove(originalCount);
    }

    if (customMarkers.length > 0) {
        const sep = document.createElement("option");
        sep.disabled = true;
        sep.textContent = "── Custom Markers ──";
        elements.statusFilter.appendChild(sep);

        customMarkers.forEach(m => {
            const opt = document.createElement("option");
            opt.value = `marker:${m.name}`;
            opt.textContent = `📌 ${m.name}`;
            opt.style.color = m.color;
            elements.statusFilter.appendChild(opt);
        });
    }
}

export function filterEntries() {
    const statusVal = elements.statusFilter?.value || "All";
    const formatVal = elements.formatFilter?.value || "All";
    const searchVal = elements.searchInput?.value.toLowerCase() || "";

    chrome.storage.local.get(["FamilyFriendlyfeatureEnabled"], (data) => {
        const familyFriendly = data.FamilyFriendlyfeatureEnabled || false;

        const filtered = savedEntriesMerged.filter(entry => {
            const ani = entry.anilistData;

            if (familyFriendly && ani?.genres) {
                if (ani.genres.some(g => ['Ecchi', 'Hentai'].includes(g))) return false;
            }

            let matchesStatus = true;
            if (statusVal !== "All") {
                if (statusVal.startsWith("marker:")) {
                    matchesStatus = entry.customMarker === statusVal.substring(7);
                } else {
                    matchesStatus = entry.status === statusVal;
                }
            }

            let matchesFormat = true;
            if (formatVal !== "All") {
                if (ani) {
                    const entryFormat = getFormatName(ani.format, ani.countryOfOrigin);
                    matchesFormat = entryFormat === formatVal;
                } else {
                    // Hidden if no AniList data and a specific format is selected
                    matchesFormat = false;
                }
            }

            const matchesSearch = searchVal === "" || 
                entry.title.toLowerCase().includes(searchVal) ||
                ani?.title?.english?.toLowerCase().includes(searchVal) ||
                ani?.title?.romaji?.toLowerCase().includes(searchVal);

            return matchesStatus && matchesFormat && matchesSearch;
        });

        renderEntries(filtered);
    });
}

function renderEntries(entries) {
    if (!elements.grid) return;
    elements.grid.innerHTML = "";

    if (entries.length === 0) {
        elements.grid.innerHTML = '<div class="empty-library">No matches found.</div>';
        updateSubtitle(0);
        return;
    }

    entries.forEach(entry => {
        const card = createMangaCard(entry, customMarkers, (e) => showMarkerPicker(e));
        elements.grid.appendChild(card);
    });

    updateSubtitle(entries.length);
}

function updateSubtitle(count) {
    if (elements.subtitle) {
        elements.subtitle.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
}

function showMarkerPicker(entry) {
    const markerNames = ["None", ...customMarkers.map(m => m.name)];
    const current = entry.customMarker || "None";
    const msg = `Select marker for "${entry.title}":\n` + markerNames.map((m, i) => `${i}: ${m}`).join('\n');
    const selected = prompt(msg, markerNames.indexOf(current));

    if (selected !== null) {
        const idx = parseInt(selected);
        if (idx >= 0 && idx < markerNames.length) {
            entry.customMarker = markerNames[idx] === "None" ? null : markerNames[idx];
            chrome.storage.local.set({ savedEntriesMerged }, () => filterEntries());
        }
    }
}

async function fetchMissingData() {
    const missing = savedEntriesMerged.filter(e => !e.anilistData);
    if (missing.length === 0) return;

    fetchInProgress = true;
    updateProgress(0, missing.length);

    for (let i = 0; i < missing.length; i++) {
        const entry = missing[i];
        if (typeof fetchMangaFromAnilist === 'function') {
            const data = await fetchMangaFromAnilist(entry.title);
            if (data) {
                entry.anilistData = data;
                chrome.storage.local.set({ savedEntriesMerged });
                filterEntries();
            }
        }
        updateProgress(i + 1, missing.length);
    }
    fetchInProgress = false;
}

function updateProgress(curr, total) {
    if (!elements.progressContainer) return;
    elements.progressContainer.style.display = curr < total ? "block" : "none";
    const percent = Math.round((curr / total) * 100);
    if (elements.progressBar) elements.progressBar.style.width = percent + "%";
    if (elements.progressPercent) elements.progressPercent.textContent = percent + "%";
    if (elements.progressText) elements.progressText.textContent = `Syncing AniList data (${curr}/${total})`;
}
