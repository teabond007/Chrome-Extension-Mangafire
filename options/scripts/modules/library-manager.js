import { createMangaCard, getFormatName, getStatusInfo } from '../ui/manga-card-factory.js';
import { fetchMangaFromAnilist } from '../core/anilist-api.js';

let savedEntriesMerged = [];
let customMarkers = [];
let fetchInProgress = false;
let currentFilteredEntries = []; // Cache for re-rendering without re-filtering
let librarySettings = {
    bordersEnabled: true,
    borderThickness: 2,
    hideNoHistory: false
};

let statsData = {
    total: 0,
    chapters: 0,
    reading: 0,
    completed: 0,
    planning: 0,
    onhold: 0,
    dropped: 0
};

let elements = {
    grid: null,
    viewLargeBtn: null,
    // Filters
    statusFilter: null,
    formatFilter: null,
    genreFilter: null,
    demographicFilter: null, // New
    sortFilter: null, // New
    searchInput: null,
    // Modal elements
    modal: null,
    modalTitle: null,
    modalSynonyms: null,
    modalCover: null,
    modalBanner: null,
    modalDescription: null,
    modalGenres: null,
    modalTags: null,
    modalStatus: null,
    modalFormat: null,
    modalScore: null,
    modalPopularity: null,
    modalReleased: null,
    modalExternalLinks: null,
    modalReadChaptersBtn: null,
    modalReadChaptersList: null,
    closeModal: null
};

export function initLibrary() {
    elements = {
        grid: document.getElementById("manga-grid"),
        statusFilter: document.getElementById("savedStatusFilter"),
        formatFilter: document.getElementById("savedFormatFilter"),
        genreFilter: document.getElementById("savedGenreFilter"),
        demographicFilter: document.getElementById("savedDemographicFilter"), // New
        sortFilter: document.getElementById("savedSortFilter"), // New
        searchInput: document.getElementById("savedSearchInput"),
        subtitle: document.getElementById("library-subtitle"),
        progressBar: document.getElementById("progress-bar-fill"),
        progressText: document.getElementById("progress-text"),
        progressPercent: document.getElementById("progress-percent"),
        progressContainer: document.getElementById("loading-progress"),
        viewCompactBtn: document.getElementById("view-compact-btn"),
        viewLargeBtn: document.getElementById("view-large-btn"),
        // Modal
        modal: document.getElementById("mangaDetailsModal"),
        modalTitle: document.getElementById("modalTitle"),
        modalSynonyms: document.getElementById("modalSynonyms"),
        modalCover: document.getElementById("modalCover"),
        modalBanner: document.getElementById("modalBanner"),
        modalDescription: document.getElementById("modalDescriptionText"),
        modalGenres: document.getElementById("modalGenres"),
        modalTags: document.getElementById("modalTags"),
        modalStatus: document.getElementById("modalStatusBadge"),
        modalFormat: document.getElementById("modalFormatBadge"),
        modalScore: document.getElementById("modalScoreValue"),
        modalPopularity: document.getElementById("modalPopularity"),
        modalReleased: document.getElementById("modalReleased"),
        modalExternalLinks: document.getElementById("modalExternalLinks"),
        modalReadChaptersBtn: document.getElementById("modalReadChaptersBtn"),
        modalReadChaptersList: document.getElementById("modalReadChaptersList"),
        closeModal: document.getElementById("closeMangaDetails")
    };

    // Genre filter
    elements.genreFilter = document.getElementById("savedGenreFilter");

    // Advanced elements
    elements.statsContainer = document.getElementById("library-stats-container");
    elements.statsGrid = document.getElementById("stats-dashboard-grid");
    elements.bulkBar = document.getElementById("bulk-ops-bar");
    elements.bulkStatusSelect = document.getElementById("bulkStatusSelect");
    elements.btnApplyBulk = document.getElementById("btnApplyBulkUpdate");
    elements.freshSyncBtn = document.getElementById("BtnTrashAndSyncEntries");

    if (!elements.grid) return;

    // Load initial data
    chrome.storage.local.get([
        "customBookmarks", 
        "savedEntriesMerged", 
        "userBookmarks", 
        "cardViewSize", 
        "FamilyFriendlyfeatureEnabled",
        "LibraryCardBordersEnabled", // New
        "LibraryCardBorderThickness", // New
        "LibraryHideNoHistory", // New
        "SmartInactivityFadefeatureEnabled" // New
    ], (data) => {
        customMarkers = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
        savedEntriesMerged = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
        
        // Load independent library settings
        librarySettings.bordersEnabled = data.LibraryCardBordersEnabled !== false; // Default true
        librarySettings.borderThickness = data.LibraryCardBorderThickness || 2;
        librarySettings.hideNoHistory = data.LibraryHideNoHistory === true;
        librarySettings.smartInactivity = data.SmartInactivityFadefeatureEnabled === true;
        
        // Init UI controls
        const borderToggle = document.getElementById("LibraryCardBordersEnabled");
        const borderRange = document.getElementById("LibraryCardBorderThickness");
        const borderDisplay = document.getElementById("libraryBorderValue");
        const historyToggle = document.getElementById("LibraryHideNoHistory");
        
        if (borderToggle) borderToggle.checked = librarySettings.bordersEnabled;
        if (borderRange) borderRange.value = librarySettings.borderThickness;
        if (borderDisplay) borderDisplay.textContent = `${librarySettings.borderThickness}px`;
        if (historyToggle) historyToggle.checked = librarySettings.hideNoHistory;
        // Rebuild if merged data is missing but base bookmarks exist
        if (savedEntriesMerged.length === 0 && Array.isArray(data.userBookmarks) && data.userBookmarks.length > 0) {
            console.log("Rebuilding library display from stored bookmarks...");
            savedEntriesMerged = data.userBookmarks.map(b => ({
                title: b.title,
                status: b.status,
                readChapters: b.readChapters || 0,
                anilistData: null,
                customMarker: null,
                lastUpdated: Date.now()
            }));
            chrome.storage.local.set({ savedEntriesMerged });
        }

        // Deduplication pass to clean up any potential sync errors or duplicates
        const originalCount = savedEntriesMerged.length;
        const seenIds = new Set();
        const seenSlugs = new Set();
        const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        savedEntriesMerged = savedEntriesMerged.filter(e => {
            if (e.anilistData && e.anilistData.id) {
                if (seenIds.has(e.anilistData.id)) return false;
                seenIds.add(e.anilistData.id);
            }
            // Use mangaSlug without the last dot ID part for robust matching
            const eSlug = e.mangaSlug ? e.mangaSlug.split('.')[0] : slugify(e.title);
            if (seenSlugs.has(eSlug)) return false;
            seenSlugs.add(eSlug);
            return true;
        });

        if (savedEntriesMerged.length !== originalCount) {
            console.warn(`Deduplicated library on load: Removed ${originalCount - savedEntriesMerged.length} duplicates.`);
            chrome.storage.local.set({ savedEntriesMerged });
        }

        populateStatusFilter();
        populateGenreFilter();
        
        const viewSize = data.cardViewSize || "large";
        setViewSize(viewSize);
        
        // Backfill history data (lastRead/lastChapterRead) for existing entries from savedReadChapters
        chrome.storage.local.get(["savedReadChapters"], (historyData) => {
            const history = historyData.savedReadChapters || {};
            let updated = false;

            savedEntriesMerged.forEach(entry => {
                if (!entry.lastRead || !entry.lastChapterRead) {
                    const titleLower = entry.title.toLowerCase();
                    const mangaSlugBase = entry.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    const explicitSlug = entry.mangaSlug ? entry.mangaSlug.split('.')[0] : null;

                    const historyKey = Object.keys(history).find(key => {
                        const kLower = key.toLowerCase();
                        const kSlug = kLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        
                        return kLower === titleLower || 
                               kSlug === mangaSlugBase || 
                               (explicitSlug && kSlug === explicitSlug) ||
                               (explicitSlug && kLower === explicitSlug);
                    });

                    if (historyKey) {
                        const chapters = history[historyKey];
                        if (chapters && chapters.length > 0) {
                            if (!entry.lastChapterRead) entry.lastChapterRead = chapters[chapters.length - 1];
                            if (!entry.lastRead) entry.lastRead = 1; // Mark as having history but unknown date
                            updated = true;
                        }
                    }
                }
            });

            if (updated) {
                chrome.storage.local.set({ savedEntriesMerged });
            }
            
            filterEntries();
        });
        
        if (!fetchInProgress) {
            fetchMissingData();
        }
    });

    attachListeners();
}

function attachListeners() {
    elements.statusFilter?.addEventListener("change", filterEntries);
    elements.formatFilter?.addEventListener("change", filterEntries);
    elements.genreFilter?.addEventListener("change", filterEntries);
    elements.demographicFilter?.addEventListener("change", filterEntries);
    elements.sortFilter?.addEventListener("change", filterEntries);
    elements.searchInput?.addEventListener("input", filterEntries);


    // Border Settings Listeners
    const borderToggle = document.getElementById("LibraryCardBordersEnabled");
    borderToggle?.addEventListener("change", (e) => {
        librarySettings.bordersEnabled = e.target.checked;
        chrome.storage.local.set({ LibraryCardBordersEnabled: e.target.checked });
        renderEntries(currentFilteredEntries); // Re-render without full filter
    });

    const borderRange = document.getElementById("LibraryCardBorderThickness");
    const borderDisplay = document.getElementById("libraryBorderValue");
    borderRange?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        librarySettings.borderThickness = val;
        if (borderDisplay) borderDisplay.textContent = `${val}px`;
        chrome.storage.local.set({ LibraryCardBorderThickness: val });
        // Live update existing cards for performance
        document.querySelectorAll(".manga-card").forEach(card => {
            if (librarySettings.bordersEnabled) {
                card.style.borderWidth = `${val}px`;
            }
        });
    });
    
    document.getElementById("LibraryHideNoHistory")?.addEventListener("change", (e) => {
        librarySettings.hideNoHistory = e.target.checked;
        chrome.storage.local.set({ LibraryHideNoHistory: e.target.checked });
        filterEntries();
    });

    elements.viewCompactBtn?.addEventListener("click", () => {
        setViewSize("compact");
        chrome.storage.local.set({ cardViewSize: "compact" });
    });

    elements.viewLargeBtn?.addEventListener("click", () => {
        setViewSize("large");
        chrome.storage.local.set({ cardViewSize: "large" });
    });

    document.getElementById("BtnCleanLibrary")?.addEventListener("click", () => {
        const originalCount = savedEntriesMerged.length;
        cleanLibraryDuplicates();
        const newCount = savedEntriesMerged.length;
        if (originalCount > newCount) {
             alert(`Cleaned up ${originalCount - newCount} duplicate entries!`);
             filterEntries();
        } else {
             alert("Your library is already clean!");
        }
    });

    document.getElementById("BtnShowStats")?.addEventListener("click", () => {
        const statsContainer = document.getElementById("library-stats-container");
        if (statsContainer) {
            statsContainer.classList.toggle("visible");
            const isVisible = statsContainer.classList.contains("visible");
            
            if (isVisible) {
                try {
                    renderStatistics();
                } catch (e) {
                    console.error("Error rendering statistics:", e);
                }
            }
        } else {
            console.error("Stats container element not found in DOM");
        }
    });

    // Modal listeners
    elements.closeModal?.addEventListener("click", () => {
        if (elements.modal) elements.modal.style.display = "none";
    });

    elements.modalReadChaptersBtn?.addEventListener("click", () => {
        if (!elements.modalReadChaptersList) return;
        const isHidden = elements.modalReadChaptersList.style.display === "none";
        elements.modalReadChaptersList.style.display = isHidden ? "flex" : "none";
        elements.modalReadChaptersBtn.textContent = isHidden ? "Hide Chapters" : "Show Chapters";
    });

    window.addEventListener("click", (e) => {
        if (e.target === elements.modal) {
            elements.modal.style.display = "none";
        }
    });

    if (elements.freshSyncBtn) {
        elements.freshSyncBtn.addEventListener("click", async () => {
            if (confirm("Reset library cache and fresh sync from AniList?")) {
                await chrome.storage.local.remove(["savedEntriesMerged"]);
                location.reload();
            }
        });
    }

    // Stats Toggle
    const showStatsBtn = document.getElementById("BtnShowStats");
    showStatsBtn?.addEventListener("click", () => {
        const isVisible = elements.statsContainer.style.display === "block";
        elements.statsContainer.style.display = isVisible ? "none" : "block";
        if (!isVisible) renderStatistics();
    });

    // Bulk Toggle
    const toggleBulkBtn = document.getElementById("btnToggleBulk");
    toggleBulkBtn?.addEventListener("click", () => {
        isBulkMode = !isBulkMode;
        elements.bulkBar.style.display = isBulkMode ? "flex" : "none";
        toggleBulkBtn.classList.toggle("active", isBulkMode);
        filterEntries();
    });

    elements.btnApplyBulk?.addEventListener("click", applyBulkUpdate);
    
    document.getElementById("btnCloseBulkOps")?.addEventListener("click", () => {
        isBulkMode = false;
        elements.bulkBar.style.display = "none";
    });
}

let isBulkMode = false;

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
 * Populates the status filter dropdown with default statuses and any custom markers.
 * @returns {void}
 */
function populateStatusFilter() {
    if (!elements.statusFilter) return;
    // Keep original options, add custom ones
    const originalCount = 7; // All, Reading, Completed, On Hold, Plan to Read, Dropped, marker header
    
    // Reset to base 7 options (All + 5 default statuses + Has History)
    while (elements.statusFilter.options.length > 7) {
        elements.statusFilter.remove(7);
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

/**
 * Populates the genre filter dropdown with unique genres found in the `anilistData`
 * of the `savedEntriesMerged`.
 * @returns {void}
 */
function populateGenreFilter() {
    if (!elements.genreFilter) return;
    
    // Get unique genres
    const genres = new Set();
    savedEntriesMerged.forEach(e => {
        if (e.anilistData?.genres) {
            e.anilistData.genres.forEach(g => genres.add(g));
        }
    });

    // Keep only "All Genres"
    elements.genreFilter.innerHTML = '<option value="All">All Genres</option>';
    
    // Add sorted genres
    Array.from(genres).sort().forEach(genre => {
        const opt = document.createElement("option");
        opt.value = genre;
        opt.textContent = genre;
        elements.genreFilter.appendChild(opt);
    });
}

/**
 * Filters the `savedEntriesMerged` array based on the current values of the
 * status, format, genre filters, and search input.
 * It also applies a family-friendly filter if enabled.
 * After filtering, it calls `renderEntries` to update the displayed grid.
 * @returns {void}
 */
export function filterEntries() {
    const statusVal = elements.statusFilter?.value || "All";
    const formatVal = elements.formatFilter?.value || "All";
    const genreVal = elements.genreFilter?.value || "All";
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
                    const markerName = statusVal.substring(7);
                    // Check explicit customMarker field OR if the status string itself matches (legacy/auto-mapped)
                    matchesStatus = (entry.customMarker === markerName) || (entry.status === markerName);
                } else if (statusVal === "HasHistory") {
                    // Check if there is any history (lastRead, lastChapterRead, or progress)
                    matchesStatus = !!(entry.lastRead || entry.lastChapterRead || (entry.readChapters > 0));
                } else {
                    matchesStatus = entry.status === statusVal;
                }
            }

            // Global history filter
            if (librarySettings.hideNoHistory) {
                const hasHistory = !!(entry.lastRead || entry.lastChapterRead || (entry.readChapters > 0));
                if (!hasHistory) return false;
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

            let matchesGenre = true;
            if (genreVal !== "All") {
                matchesGenre = ani?.genres?.includes(genreVal) || false;
            }

            const matchesSearch = searchVal === "" || 
                entry.title.toLowerCase().includes(searchVal) ||
                ani?.title?.english?.toLowerCase().includes(searchVal) ||
                ani?.title?.romaji?.toLowerCase().includes(searchVal);


            let matchesDemographic = true;
            if (elements.demographicFilter && elements.demographicFilter.value !== "All") {
                // We need to check tags for the demographic
                // Note: We use the helper logic on the fly or pre-calculated
                // Ideally, getDemographic logic should be reused. 
                // Since this module doesn't import getDemographic from factory (factory exports createMangaCard),
                // we'll rely on simple tag checking here for efficiency.
                const targetDemo = elements.demographicFilter.value.toLowerCase();
                const tags = ani?.tags || [];
                // Simple check
                matchesDemographic = tags.some(t => t.name.toLowerCase() === targetDemo);
            }

            return matchesStatus && matchesFormat && matchesGenre && matchesSearch && matchesDemographic;
        });

        // Sorting Logic
        if (elements.sortFilter) {
            const sortMode = elements.sortFilter.value;
            filtered.sort((a, b) => {
                const titleA = (a.anilistData?.title?.english || a.title).toLowerCase();
                const titleB = (b.anilistData?.title?.english || b.title).toLowerCase();
                
                switch (sortMode) {
                    case 'title-asc': return titleA.localeCompare(titleB);
                    case 'title-desc': return titleB.localeCompare(titleA);
                    case 'pop-desc': 
                        return (b.anilistData?.popularity || 0) - (a.anilistData?.popularity || 0);
                    case 'pop-asc': 
                        return (a.anilistData?.popularity || 0) - (b.anilistData?.popularity || 0);
                    case 'score-desc': 
                        return (b.anilistData?.averageScore || 0) - (a.anilistData?.averageScore || 0);
                    case 'added-desc': 
                        return (b.lastUpdated || 0) - (a.lastUpdated || 0);
                    case 'last-read-desc': 
                        return (b.lastRead || 0) - (a.lastRead || 0);
                    default: return 0;
                }
            });
        }
        
        currentFilteredEntries = filtered; // Update cache
        renderEntries(filtered);
        renderStatistics();
    });
}

/**
 * Renders a given array of manga entries into the grid.
 * Clears the existing grid and appends new manga cards.
 * Displays an empty message if no entries are provided.
 * @param {Array<Object>} entries - The array of manga entries to be rendered.
 * @returns {void}
 */
function renderEntries(entries) {
    if (!elements.grid) return;
    elements.grid.innerHTML = "";

    if (entries.length === 0) {
        elements.grid.innerHTML = '<div class="empty-library">No matches found.</div>';
        updateSubtitle(0);
        return;
    }

    entries.forEach(entry => {
        const card = createMangaCard(entry, customMarkers, (e) => showMarkerPicker(e), librarySettings);
        card.addEventListener("click", () => showMangaDetails(entry));
        elements.grid.appendChild(card);
    });

    updateSubtitle(entries.length);

    // Animate cards only if not currently syncing to prevent "buggy" resets
    if (!fetchInProgress && typeof anime !== 'undefined') {
        anime({
            targets: '.manga-card',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(50),
            duration: 600,
            easing: 'easeOutQuad'
        });
    }
}

function renderStatistics() {
    // Fallback: Re-fetch components if missing
    if (!elements.statsGrid) {
        elements.statsGrid = document.getElementById("stats-dashboard-grid");
    }

    if (!elements.statsGrid || !savedEntriesMerged) return;
    
    // Safety check for statsGrid display
    const currentTab = document.querySelector('.tab-pane.active')?.id;
    if (currentTab !== 'tab-saved-entries') {
        // Only animate if we are on the library tab (or avoid wasting cycles)
        // But we want it to render so it's ready when we switch
    }

    const newStats = {
        total: savedEntriesMerged.length,
        reading: savedEntriesMerged.filter(e => e.status === 'Reading').length,
        completed: savedEntriesMerged.filter(e => e.status === 'Completed').length,
        planning: savedEntriesMerged.filter(e => e.status === 'Plan to Read').length,
        onhold: savedEntriesMerged.filter(e => e.status === 'On Hold').length,
        dropped: savedEntriesMerged.filter(e => e.status === 'Dropped').length,
        chapters: savedEntriesMerged.reduce((sum, e) => sum + (parseInt(e.readChapters) || 0), 0)
    };
    
    const items = [
        { key: 'total', label: 'Total', count: newStats.total, color: 'var(--primary)' },
        { key: 'chapters', label: 'Chapters', count: newStats.chapters, color: '#00BCD4' },
        { key: 'reading', label: 'Reading', count: newStats.reading, color: '#4CAF50' },
        { key: 'completed', label: 'Completed', count: newStats.completed, color: '#2196F3' },
        { key: 'planning', label: 'Plan to Read', count: newStats.planning, color: '#9C27B0' },
        { key: 'onhold', label: 'On Hold', count: newStats.onhold, color: '#FFC107' },
        { key: 'dropped', label: 'Dropped', count: newStats.dropped, color: '#F44336' }
    ];

    // Build static structure if empty
    if (elements.statsGrid.innerHTML === "" || elements.statsGrid.children.length !== items.length) {
        elements.statsGrid.innerHTML = items.map(item => `
            <div class="stat-item-compact" style="opacity: 0; transform: translateY(10px)">
                <span id="stat-val-${item.key}" class="stat-value-large" style="color: ${item.color}">0</span>
                <span class="stat-label-small">${item.label}</span>
            </div>
        `).join('');

        // Staggered Entrance
        if (typeof anime !== 'undefined') {
            anime({
                targets: elements.statsGrid.children,
                opacity: [0, 1],
                translateY: [10, 0],
                delay: anime.stagger(60),
                duration: 800,
                easing: 'easeOutElastic(1, .8)'
            });
        }
    }

    // Animate the numbers
    if (typeof anime !== 'undefined') {
        items.forEach(item => {
            const el = document.getElementById(`stat-val-${item.key}`);
            if (!el) return;

            const startVal = statsData[item.key] || 0;
            const endVal = item.count;

            if (startVal === endVal && el.textContent != "0") return;

            const obj = { val: startVal };
            anime({
                targets: obj,
                val: endVal,
                round: 1,
                duration: 1000,
                easing: 'easeOutExpo',
                update: () => {
                    el.textContent = obj.val;
                }
            });
        });
    } else {
        // Fallback
        items.forEach(item => {
            const el = document.getElementById(`stat-val-${item.key}`);
            if (el) el.textContent = item.count;
        });
    }

    // Update global state
    statsData = newStats;
}

async function applyBulkUpdate() {
    const newStatus = elements.bulkStatusSelect.value;
    const searchVal = elements.searchInput?.value.toLowerCase() || "";
    const statusVal = elements.statusFilter?.value || "All";

    const filtered = savedEntriesMerged.filter(entry => {
        const matchesStatus = statusVal === "All" || (statusVal.startsWith("marker:") ? entry.customMarker === statusVal.substring(7) : entry.status === statusVal);
        const matchesSearch = searchVal === "" || entry.title.toLowerCase().includes(searchVal);
        return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
        alert("No items matched the current filter to update.");
        return;
    }

    if (confirm(`Update all ${filtered.length} filtered items to "${newStatus}"?`)) {
        filtered.forEach(e => {
            e.status = newStatus;
            e.customMarker = null;
        });

        chrome.storage.local.set({ savedEntriesMerged }, () => {
            filterEntries();
            alert(`Successfully updated ${filtered.length} items.`);
            isBulkMode = false;
            elements.bulkBar.style.display = "none";
        });
    }
}

/**
 * Displays a modal with detailed information about a specific manga entry.
 * Populates the modal elements with data from the entry's `anilistData`.
 * @param {Object} entry - The manga entry object for which to show details.
 * @returns {void}
 */
function showMangaDetails(entry) {
    const ani = entry.anilistData;
    if (!ani) return;

    if (elements.modalTitle) elements.modalTitle.textContent = ani.title.english || ani.title.romaji || entry.title;
    
    // Synonyms
    if (elements.modalSynonyms) {
        elements.modalSynonyms.innerHTML = "";
        const synonyms = ani.synonyms || [];
        if (synonyms.length > 0) {
            synonyms.slice(0, 5).forEach(s => {
                const span = document.createElement("span");
                span.className = "modal-synonym-item";
                span.textContent = s;
                elements.modalSynonyms.appendChild(span);
            });
        }
    }

    if (elements.modalCover) elements.modalCover.src = ani.coverImage.large;
    
    // Banner
    if (elements.modalBanner) {
        const bannerUrl = ani.bannerImage || ani.coverImage?.extraLarge || ani.coverImage?.large;
        if (bannerUrl) {
            elements.modalBanner.style.backgroundImage = `url('${bannerUrl}')`;
            elements.modalBanner.style.display = "block";
            // If it's a fallback cover, maybe add a blur or specific styling
            if (!ani.bannerImage) {
                elements.modalBanner.style.filter = "blur(4px) brightness(0.7)";
            } else {
                elements.modalBanner.style.filter = "none";
            }
        } else {
            elements.modalBanner.style.display = "none";
        }
    }

    if (elements.modalDescription) elements.modalDescription.innerHTML = ani.description || "No description available.";
    
    // Status Badge
    const statusInfo = getStatusInfo(entry.status, entry.customMarker, customMarkers);
    if (elements.modalStatus) {
        elements.modalStatus.textContent = entry.status;
        elements.modalStatus.style.backgroundColor = statusInfo.badgeBg;
        elements.modalStatus.style.color = statusInfo.badgeText;
    }

    // Format Badge
    if (elements.modalFormat) {
        elements.modalFormat.textContent = getFormatName(ani.format, ani.countryOfOrigin);
    }

    // Genres
    if (elements.modalGenres) {
        elements.modalGenres.innerHTML = "";
        (ani.genres || []).forEach(genre => {
            const span = document.createElement("span");
            span.className = "modal-genre-tag";
            span.textContent = genre;
            elements.modalGenres.appendChild(span);
        });
    }

    // Tags
    if (elements.modalTags) {
        elements.modalTags.innerHTML = "";
        (ani.tags || []).slice(0, 10).forEach(tag => {
            const span = document.createElement("span");
            span.className = "modal-tag";
            span.textContent = tag.name;
            elements.modalTags.appendChild(span);
        });
    }

    // Score & Popularity
    if (elements.modalScore) {
        elements.modalScore.textContent = ani.averageScore ? `${ani.averageScore}%` : "-";
    }
    if (elements.modalPopularity) {
        elements.modalPopularity.textContent = ani.popularity ? ani.popularity.toLocaleString() : "-";
    }

    // Released Date
    if (elements.modalReleased) {
        if (ani.startDate && ani.startDate.year) {
            const d = ani.startDate;
            elements.modalReleased.textContent = `${d.year}${d.month ? '-' + d.month : ''}${d.day ? '-' + d.day : ''}`;
        } else {
            elements.modalReleased.textContent = "Unknown";
        }
    }

    // External Links & English Filtering
    if (elements.modalExternalLinks) {
        elements.modalExternalLinks.innerHTML = "";
        
        // Add AniList as the first link
        if (ani.siteUrl) {
            const a = document.createElement("a");
            a.className = "external-link-btn primary";
            a.href = ani.siteUrl;
            a.target = "_blank";
            a.innerHTML = `<span>AniList</span>`;
            elements.modalExternalLinks.appendChild(a);
        }

        const externalLinks = ani.externalLinks || [];
        
        // Filter: Keep only English ones if multiple languages exist for the same site
        const filteredLinks = [];
        const sitesProcessed = new Map(); // site -> Array of links

        externalLinks.forEach(link => {
            if (!sitesProcessed.has(link.site)) {
                sitesProcessed.set(link.site, []);
            }
            sitesProcessed.get(link.site).push(link);
        });

        sitesProcessed.forEach((links, site) => {
            if (links.length > 1) {
                // If duplicates exist, look for English preferentially
                // Checking language field (newly added) and URL patterns
                const englishLink = links.find(l => {
                    const lang = (l.language || "").toLowerCase();
                    const url = (l.url || "").toLowerCase();
                    return lang === "english" || 
                           url.includes("/en/") || 
                           url.includes("/english") || 
                           url.includes("language=en");
                });
                
                if (englishLink) {
                    filteredLinks.push(englishLink);
                } else {
                    // If no English found, keep the first one
                    filteredLinks.push(links[0]);
                }
            } else {
                filteredLinks.push(links[0]);
            }
        });

        filteredLinks.forEach(link => {
            const a = document.createElement("a");
            a.className = "external-link-btn";
            a.href = link.url;
            a.target = "_blank";
            a.textContent = link.site;
            elements.modalExternalLinks.appendChild(a);
        });
    }

    // Read Chapters History
    if (elements.modalReadChaptersList) {
        elements.modalReadChaptersList.innerHTML = "";
        elements.modalReadChaptersList.style.display = "none";
        if (elements.modalReadChaptersBtn) elements.modalReadChaptersBtn.textContent = "Show Chapters";
        
        chrome.storage.local.get(["savedReadChapters"], (data) => {
            const history = data.savedReadChapters || {};
            
            // Robust matching: Try original title, slugified title, and entry-level mangaSlug
            const titleLower = entry.title.toLowerCase();
            const mangaSlugBase = entry.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const explicitSlug = entry.mangaSlug ? entry.mangaSlug.split('.')[0] : null;
            
            // Find key in history that matches any of our identifiers
            const historyKey = Object.keys(history).find(key => {
                const kLower = key.toLowerCase();
                const kSlug = kLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                
                return kLower === titleLower || 
                       kSlug === mangaSlugBase || 
                       (explicitSlug && kSlug === explicitSlug) ||
                       (explicitSlug && kLower === explicitSlug);
            });

            const chapters = historyKey ? history[historyKey] : [];
            
            if (chapters.length > 0) {
                // Sort chapters numerically for better display
                const sortedChapters = [...chapters].sort((a, b) => {
                    const numA = parseFloat(a.replace(/[^\d.]/g, '')) || 0;
                    const numB = parseFloat(b.replace(/[^\d.]/g, '')) || 0;
                    return numB - numA; // Descending
                });

                sortedChapters.forEach(ch => {
                    const span = document.createElement("span");
                    span.className = "chapter-pill";
                    span.textContent = ch;
                    elements.modalReadChaptersList.appendChild(span);
                });
            } else {
                elements.modalReadChaptersList.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">No history found</span>';
            }
        });
    }

    if (elements.modal) {
        elements.modal.style.display = "flex";
        // Reset scroll position
        const body = elements.modal.querySelector('.modal-body');
        if (body) body.scrollTop = 0;
    }
}

// Global storage listener to keep library in sync with background/content script updates
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.savedEntriesMerged) {
            savedEntriesMerged = changes.savedEntriesMerged.newValue || [];
            filterEntries();
        }
        if (changes.customBookmarks) {
            customMarkers = Array.isArray(changes.customBookmarks.newValue) ? changes.customBookmarks.newValue : [];
            populateStatusFilter();
            filterEntries();
        }
    }
});

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
    // Negative Cache Cooldown: 7 days
    const NEGATIVE_CACHE_DAYS = 7;
    const now = Date.now();

    // Fetch if no AniList data OR if description is missing (user requested richer data for existing entries)
    // BUT skip if marked as NOT_FOUND within the cooldown period
    const missing = savedEntriesMerged.filter(e => {
        if (!e.anilistData) return true;
        
        // Check for Negative Cache
        if (e.anilistData.status === 'NOT_FOUND' && e.anilistData.lastChecked) {
            const diffDays = (now - e.anilistData.lastChecked) / (1000 * 60 * 60 * 24);
            if (diffDays < NEGATIVE_CACHE_DAYS) {
                return false; // Skip this entry
            }
        }
        
        return !e.anilistData.description;
    });

    if (missing.length === 0) return;

    fetchInProgress = true;
    updateProgress(0, missing.length);

    for (let i = 0; i < missing.length; i++) {
        const entry = missing[i];
        if (typeof fetchMangaFromAnilist === 'function') {
            const data = await fetchMangaFromAnilist(entry.title);
            if (data) {
                entry.anilistData = data;
                
                // Refresh filters if new genres are found
                if (data.genres) populateGenreFilter();
            } else {
                // Negative Cache: Mark as NOT_FOUND to prevent immediate re-fetch
                console.warn(`Marking "${entry.title}" as NOT_FOUND in AniList cache.`);
                entry.anilistData = {
                    status: 'NOT_FOUND',
                    lastChecked: Date.now(),
                    // Preserve minimal structure to avoid breaking other checks
                    title: { english: entry.title }, 
                    format: 'Unknown'
                };
            }
            
            // Save progress (both success and failure)
            chrome.storage.local.set({ savedEntriesMerged });
            filterEntries(); // Live update
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

function cleanLibraryDuplicates() {
    if (!savedEntriesMerged) return;
    
    const originalCount = savedEntriesMerged.length;
    const seenIds = new Set();
    const seenSlugs = new Set();
    const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Favor entries with anilistData and higher lastRead
    savedEntriesMerged.sort((a, b) => {
        if (!!a.anilistData !== !!b.anilistData) return b.anilistData ? 1 : -1;
        return (b.lastRead || 0) - (a.lastRead || 0);
    });

    savedEntriesMerged = savedEntriesMerged.filter(e => {
        if (e.anilistData && e.anilistData.id) {
            if (seenIds.has(e.anilistData.id)) return false;
            seenIds.add(e.anilistData.id);
        }
        const eSlug = e.mangaSlug ? e.mangaSlug.split('.')[0] : slugify(e.title);
        if (seenSlugs.has(eSlug)) return false;
        seenSlugs.add(eSlug);
        return true;
    });

    if (savedEntriesMerged.length !== originalCount) {
        chrome.storage.local.set({ savedEntriesMerged });
    }
}
