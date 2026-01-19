import { createMangaCard, getFormatName, getStatusInfo } from '../ui/manga-card-factory.js';
import { fetchMangaFromAnilist } from '../core/anilist-api.js';
import { fetchMangaFromMangadex } from '../core/mangadex-api.js';
import * as LibFeatures from './library-features.js';
import { playSuccessAnimation, animateGridEntrance, animateModalEntry, initButtonMicroInteractions } from '../ui/anime-utils.js';

let savedEntriesMerged = [];
let customMarkers = [];
let fetchInProgress = false;
let currentFilteredEntries = []; // Cache for re-rendering without re-filtering
let librarySettings = {
    bordersEnabled: true,
    borderThickness: 2,
    hideNoHistory: false,
    // Phase 1 Visual Enhancements
    useGlowEffect: false,
    animatedBorders: false,
    showStatusIcon: false,
    showProgressBar: false
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
        closeModal: document.getElementById("closeMangaDetails"),
        // Personal data elements
        modalPersonalRating: document.getElementById("modalPersonalRating"),
        modalPersonalTags: document.getElementById("modalPersonalTags"),
        modalPersonalNotes: document.getElementById("modalPersonalNotes"),
        // Tag filter & presets
        tagFilter: document.getElementById("savedTagFilter"),
        filterPresetsContainer: document.getElementById("filterPresetsContainer"),
        btnSaveFilterPreset: document.getElementById("btnSaveFilterPreset")
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
        "LibraryCardBordersEnabled",
        "LibraryCardBorderThickness",
        "LibraryHideNoHistory",
        "SmartInactivityFadefeatureEnabled",
        // Phase 1 Visual Enhancements
        "LibraryGlowEffect",
        "LibraryAnimatedBorders",
        "LibraryStatusIcons",
        "LibraryProgressBars"
    ], (data) => {
        console.log('[Library] 🔄 Loading data from storage...');
        console.log('[Library] Raw savedEntriesMerged from storage:', data.savedEntriesMerged);
        
        customMarkers = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];
        savedEntriesMerged = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
        
        console.log(`[Library] Loaded ${savedEntriesMerged.length} entries`);
        
        // Log entries with MangaDex data
        const mangadexEntries = savedEntriesMerged.filter(e => e.anilistData?.source === 'MANGADEX');
        console.log(`[Library] Entries with MangaDex data: ${mangadexEntries.length}`);
        
        // Load independent library settings
        librarySettings.bordersEnabled = data.LibraryCardBordersEnabled !== false; // Default true
        librarySettings.borderThickness = data.LibraryCardBorderThickness || 2;
        librarySettings.hideNoHistory = data.LibraryHideNoHistory === true;
        librarySettings.smartInactivity = data.SmartInactivityFadefeatureEnabled === true;
        
        // Phase 1 Visual Enhancements
        librarySettings.useGlowEffect = data.LibraryGlowEffect === true;
        librarySettings.animatedBorders = data.LibraryAnimatedBorders === true;
        librarySettings.showStatusIcon = data.LibraryStatusIcons === true;
        librarySettings.showProgressBar = data.LibraryProgressBars === true;
        
        // Init UI controls
        const borderToggle = document.getElementById("LibraryCardBordersEnabled");
        const borderRange = document.getElementById("LibraryCardBorderThickness");
        const borderDisplay = document.getElementById("libraryBorderValue");
        const historyToggle = document.getElementById("LibraryHideNoHistory");
        
        if (borderToggle) borderToggle.checked = librarySettings.bordersEnabled;
        if (borderRange) borderRange.value = librarySettings.borderThickness;
        if (borderDisplay) borderDisplay.textContent = `${librarySettings.borderThickness}px`;
        if (historyToggle) historyToggle.checked = librarySettings.hideNoHistory;
        
        // Phase 1: Visual Effects UI Init
        const glowToggle = document.getElementById("LibraryGlowEffect");
        const animatedToggle = document.getElementById("LibraryAnimatedBorders");
        const statusIconToggle = document.getElementById("LibraryStatusIcons");
        const progressBarToggle = document.getElementById("LibraryProgressBars");
        
        if (glowToggle) glowToggle.checked = librarySettings.useGlowEffect;
        if (animatedToggle) animatedToggle.checked = librarySettings.animatedBorders;
        if (statusIconToggle) statusIconToggle.checked = librarySettings.showStatusIcon;
        if (progressBarToggle) progressBarToggle.checked = librarySettings.showProgressBar;
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

            // Initialize button animations
            initButtonMicroInteractions();
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

    // Phase 1: Visual Effects Listeners
    document.getElementById("LibraryGlowEffect")?.addEventListener("change", (e) => {
        librarySettings.useGlowEffect = e.target.checked;
        chrome.storage.local.set({ LibraryGlowEffect: e.target.checked });
        renderEntries(currentFilteredEntries);
    });

    document.getElementById("LibraryAnimatedBorders")?.addEventListener("change", (e) => {
        librarySettings.animatedBorders = e.target.checked;
        chrome.storage.local.set({ LibraryAnimatedBorders: e.target.checked });
        renderEntries(currentFilteredEntries);
    });

    document.getElementById("LibraryStatusIcons")?.addEventListener("change", (e) => {
        librarySettings.showStatusIcon = e.target.checked;
        chrome.storage.local.set({ LibraryStatusIcons: e.target.checked });
        renderEntries(currentFilteredEntries);
    });

    document.getElementById("LibraryProgressBars")?.addEventListener("change", (e) => {
        librarySettings.showProgressBar = e.target.checked;
        chrome.storage.local.set({ LibraryProgressBars: e.target.checked });
        renderEntries(currentFilteredEntries);
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
             // Play success animation
             const btn = document.getElementById("BtnCleanLibrary");
             if (btn) playSuccessAnimation(btn);
             
             // Slight delay for alert to let animation start
             setTimeout(() => {
                 alert(`Cleaned up ${originalCount - newCount} duplicate entries!`);
                 filterEntries();
             }, 300);
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
            if (confirm("Reset library cache and fresh sync? This will clear AniList and MangaDex cached data.")) {
                console.log('[Library] 🗑️ Clearing savedEntriesMerged and mangadexCache...');
                // Animate checkmark
                if (elements.freshSyncBtn) await playSuccessAnimation(elements.freshSyncBtn);
                await chrome.storage.local.remove(["savedEntriesMerged", "mangadexCache"]);
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
    
    // Phase 1: Enhanced features listeners
    // attachEnhancedListeners removed - handled by options.js and CrystalSelect.autoInit()
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
export async function filterEntries() {
    const statusVal = elements.statusFilter?.value || "All";
    const formatVal = elements.formatFilter?.value || "All";
    const genreVal = elements.genreFilter?.value || "All";
    const tagVal = elements.tagFilter?.value || "All";
    const searchVal = elements.searchInput?.value.toLowerCase() || "";

    // Load personal data for tag filtering
    const personalData = tagVal !== "All" ? await LibFeatures.loadPersonalData() : {};

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
                    matchesStatus = (entry.customMarker === markerName) || (entry.status === markerName);
                } else if (statusVal === "HasHistory") {
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
                    matchesFormat = false;
                }
            }

            let matchesGenre = true;
            if (genreVal !== "All") {
                matchesGenre = ani?.genres?.includes(genreVal) || false;
            }

            // Tag filtering (Phase 1)
            let matchesTag = true;
            if (tagVal !== "All") {
                const id = LibFeatures.getMangaId(entry);
                const entryData = personalData[id];
                matchesTag = entryData?.tags?.includes(tagVal) || false;
            }

            // Enhanced search with fuzzy matching (Phase 1)
            let matchesSearch = true;
            if (searchVal !== "") {
                const titleMatch = LibFeatures.fuzzyMatch(searchVal, entry.title) ||
                    LibFeatures.fuzzyMatch(searchVal, ani?.title?.english || '') ||
                    LibFeatures.fuzzyMatch(searchVal, ani?.title?.romaji || '');
                // Also search in author if available
                const authorMatch = ani?.staff?.edges?.some(e => 
                    LibFeatures.fuzzyMatch(searchVal, e.node?.name?.full || '')
                ) || false;
                matchesSearch = titleMatch || authorMatch;
            }

            let matchesDemographic = true;
            if (elements.demographicFilter && elements.demographicFilter.value !== "All") {
                const targetDemo = elements.demographicFilter.value.toLowerCase();
                const tags = ani?.tags || [];
                matchesDemographic = tags.some(t => t.name.toLowerCase() === targetDemo);
            }

            return matchesStatus && matchesFormat && matchesGenre && matchesSearch && matchesDemographic && matchesTag;
        });

        // Sorting Logic
        if (elements.sortFilter) {
            const sortMode = elements.sortFilter.value;
            
            // For rating sort, we need personal data
            const needsPersonalData = sortMode === 'rating-desc' || sortMode === 'rating-asc';
            
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
                    case 'rating-desc': {
                        const idA = LibFeatures.getMangaId(a);
                        const idB = LibFeatures.getMangaId(b);
                        const ratingA = personalData[idA]?.rating || 0;
                        const ratingB = personalData[idB]?.rating || 0;
                        return ratingB - ratingA;
                    }
                    case 'rating-asc': {
                        const idA = LibFeatures.getMangaId(a);
                        const idB = LibFeatures.getMangaId(b);
                        const ratingA = personalData[idA]?.rating || 0;
                        const ratingB = personalData[idB]?.rating || 0;
                        return ratingA - ratingB;
                    }
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

    // Animate grid entrance
    animateGridEntrance(".manga-card");
}

function renderStatistics() {
    // Fallback: Re-fetch components if missing
    if (!elements.statsGrid) {
        elements.statsGrid = document.getElementById("stats-dashboard-grid");
    }

    if (!elements.statsGrid || !savedEntriesMerged) return;

    // Calculate comprehensive stats
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    
    // Basic counts
    const total = savedEntriesMerged.length;
    const reading = savedEntriesMerged.filter(e => e.status === 'Reading').length;
    const completed = savedEntriesMerged.filter(e => e.status === 'Completed').length;
    const planning = savedEntriesMerged.filter(e => e.status === 'Plan to Read').length;
    const onhold = savedEntriesMerged.filter(e => e.status === 'On Hold').length;
    const dropped = savedEntriesMerged.filter(e => e.status === 'Dropped').length;
    const chapters = savedEntriesMerged.reduce((sum, e) => sum + (parseInt(e.readChapters) || 0), 0);
    
    // Data source stats
    const anilistEntries = savedEntriesMerged.filter(e => e.anilistData && !e.anilistData.source).length;
    const mangadexEntries = savedEntriesMerged.filter(e => e.anilistData?.source === 'MANGADEX').length;
    const noDataEntries = savedEntriesMerged.filter(e => !e.anilistData || e.anilistData.status === 'NOT_FOUND').length;
    
    // Time-based reading activity
    const readThisWeek = savedEntriesMerged.filter(e => e.lastRead && (now - e.lastRead) < oneWeek).length;
    const readThisMonth = savedEntriesMerged.filter(e => e.lastRead && (now - e.lastRead) < oneMonth).length;
    const addedThisWeek = savedEntriesMerged.filter(e => e.lastUpdated && (now - e.lastUpdated) < oneWeek).length;
    
    // Has reading history
    const withHistory = savedEntriesMerged.filter(e => e.readChapters && e.readChapters > 0).length;
    
    // Format breakdown
    const manga = savedEntriesMerged.filter(e => e.anilistData?.format === 'MANGA' || !e.anilistData?.format).length;
    const manhwa = savedEntriesMerged.filter(e => e.anilistData?.format === 'Manhwa' || e.anilistData?.countryOfOrigin === 'KR').length;
    const manhua = savedEntriesMerged.filter(e => e.anilistData?.format === 'Manhua' || e.anilistData?.countryOfOrigin === 'CN').length;
    
    // Genre stats (top 5)
    const genreCounts = {};
    savedEntriesMerged.forEach(e => {
        (e.anilistData?.genres || []).forEach(g => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
    });
    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Average score
    const scoredEntries = savedEntriesMerged.filter(e => e.anilistData?.averageScore);
    const avgScore = scoredEntries.length > 0 
        ? Math.round(scoredEntries.reduce((sum, e) => sum + e.anilistData.averageScore, 0) / scoredEntries.length)
        : 0;

    const newStats = { total, reading, completed, planning, onhold, dropped, chapters };
    
    // Build enhanced HTML
    elements.statsGrid.innerHTML = `
        <!-- Row 1: Main Status Stats -->
        <div class="stats-row stats-row-main">
            <div class="stat-item-compact" style="--stat-color: var(--primary)">
                <span id="stat-val-total" class="stat-value-large">${total}</span>
                <span class="stat-label-small">Total</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #00BCD4">
                <span id="stat-val-chapters" class="stat-value-large">${chapters}</span>
                <span class="stat-label-small">Chapters Read</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #4CAF50">
                <span id="stat-val-reading" class="stat-value-large">${reading}</span>
                <span class="stat-label-small">Reading</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #2196F3">
                <span id="stat-val-completed" class="stat-value-large">${completed}</span>
                <span class="stat-label-small">Completed</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #9C27B0">
                <span class="stat-value-large">${planning}</span>
                <span class="stat-label-small">Plan to Read</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #FFC107">
                <span class="stat-value-large">${onhold}</span>
                <span class="stat-label-small">On Hold</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #F44336">
                <span class="stat-value-large">${dropped}</span>
                <span class="stat-label-small">Dropped</span>
            </div>
        </div>

        <!-- Row 2: Activity & Sources -->
        <div class="stats-row stats-row-secondary">
            <div class="stat-group">
                <h4 class="stat-group-title">📅 Activity</h4>
                <div class="stat-mini-grid">
                    <div class="stat-mini"><span class="stat-mini-value">${readThisWeek}</span><span class="stat-mini-label">Read This Week</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${readThisMonth}</span><span class="stat-mini-label">Read This Month</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${addedThisWeek}</span><span class="stat-mini-label">Added This Week</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${withHistory}</span><span class="stat-mini-label">With History</span></div>
                </div>
            </div>
            <div class="stat-group">
                <h4 class="stat-group-title">🌐 Data Sources</h4>
                <div class="stat-mini-grid">
                    <div class="stat-mini"><span class="stat-mini-value" style="color: #02A9FF">${anilistEntries}</span><span class="stat-mini-label">AniList</span></div>
                    <div class="stat-mini"><span class="stat-mini-value" style="color: #FF6740">${mangadexEntries}</span><span class="stat-mini-label">MangaDex</span></div>
                    <div class="stat-mini"><span class="stat-mini-value" style="color: #888">${noDataEntries}</span><span class="stat-mini-label">No Data</span></div>
                </div>
            </div>
            <div class="stat-group">
                <h4 class="stat-group-title">📚 Format</h4>
                <div class="stat-mini-grid">
                    <div class="stat-mini"><span class="stat-mini-value">${manga}</span><span class="stat-mini-label">Manga</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${manhwa}</span><span class="stat-mini-label">Manhwa</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${manhua}</span><span class="stat-mini-label">Manhua</span></div>
                </div>
            </div>
            <div class="stat-group">
                <h4 class="stat-group-title">🏷️ Top Genres</h4>
                <div class="stat-tags">
                    ${topGenres.map(([genre, count]) => `<span class="stat-tag">${genre} <small>(${count})</small></span>`).join('')}
                    ${topGenres.length === 0 ? '<span class="stat-tag dim">No genres yet</span>' : ''}
                </div>
            </div>
        </div>

        <!-- Row 3: Quick Stats Bar -->
        <div class="stats-row stats-row-bar">
            <div class="stat-bar-item">⭐ Avg Score: <strong>${avgScore > 0 ? avgScore + '%' : 'N/A'}</strong></div>
            <div class="stat-bar-item">📖 ${Math.round(chapters / Math.max(completed, 1))} ch/completed manga</div>
            <div class="stat-bar-item">📈 ${total > 0 ? Math.round((completed / total) * 100) : 0}% completion rate</div>
        </div>
    `;

    // Animate entrance
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.stat-item-compact, .stat-group, .stat-bar-item',
            opacity: [0, 1],
            translateY: [15, 0],
            delay: anime.stagger(40),
            duration: 600,
            easing: 'easeOutQuart'
        });
    }

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

    // Cover Image - with fallback
    if (elements.modalCover) {
        const coverUrl = ani.coverImage?.large || ani.coverImage?.medium || 'https://mangadex.org/img/avatar.png';
        elements.modalCover.src = coverUrl;
    }
    
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
            
            // Robust matching: Try original title, slugified title, entry-level mangaSlug, and webtoon namespace
            const titleLower = entry.title.toLowerCase();
            const mangaSlugBase = entry.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const explicitSlug = entry.mangaSlug ? entry.mangaSlug.split('.')[0] : null;
            
            // Find key in history that matches any of our identifiers
            const historyKey = Object.keys(history).find(key => {
                const kLower = key.toLowerCase();
                const kSlug = kLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                
                // Check for webtoon namespace match (webtoon:slug)
                if (key.startsWith('webtoon:')) {
                    const webtoonSlug = key.replace('webtoon:', '').replace(/-/g, ' ').toLowerCase();
                    const webtoonSlugNorm = key.replace('webtoon:', '').toLowerCase();
                    if (titleLower.includes(webtoonSlug) || 
                        mangaSlugBase === webtoonSlugNorm ||
                        webtoonSlug.includes(titleLower)) {
                        return true;
                    }
                }
                
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

    // Populate Personal Data Section (Rating, Tags, Notes)
    populatePersonalData(entry);

    if (elements.modal) {
        elements.modal.style.display = "flex";
        // Reset scroll position
        const body = elements.modal.querySelector('.modal-body');
        if (body) body.scrollTop = 0;

        // Animate modal entry
        const content = elements.modal.querySelector('.modal-content');
        if (content) animateModalEntry(content);
    }
}

// Global storage listener to keep library in sync with background/content script updates
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.savedEntriesMerged && !fetchInProgress) {
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

    // Fetch if no anilistData OR if it truly has no useful data
    // Skip if: has description, OR has valid ID, OR is from MangaDex, OR is NOT_FOUND within cooldown
    const missing = savedEntriesMerged.filter(e => {
        if (!e.anilistData) return true;
        
        // Skip MangaDex entries - they're complete
        if (e.anilistData.source === 'MANGADEX') return false;
        
        // Skip entries with a valid AniList ID AND chapter count - they're complete
        if (e.anilistData.id && typeof e.anilistData.id === 'number' && e.anilistData.chapters) return false;
        
        // If it has AniList ID but NO chapters, check if we already tried MangaDex fallback
        if (e.anilistData.id && !e.anilistData.chapters && e.anilistData.mangadexChecked) return false;
        
        // Check for Negative Cache
        if (e.anilistData.status === 'NOT_FOUND' && e.anilistData.lastChecked) {
            const diffDays = (now - e.anilistData.lastChecked) / (1000 * 60 * 60 * 24);
            if (diffDays < NEGATIVE_CACHE_DAYS) {
                return false; // Skip this entry
            }
        }
        
        // Only truly missing entries get here (no ID, not MangaDex, not cached as NOT_FOUND)
        return true;
    });

    if (missing.length === 0) return;

    fetchInProgress = true;
    try {
        updateProgress(0, missing.length);
        console.log(`[Library] 🚀 Starting fetch for ${missing.length} entries...`);
        
        // Debug: Show why each entry is "missing"
        missing.forEach((e, i) => {
            const reason = !e.anilistData ? 'No anilistData' :
                           !e.anilistData.chapters ? 'Missing chapters' : 
                           !e.anilistData.description ? 'No description' : 'Unknown';
            console.log(`[Library] Missing #${i+1}: "${e.title}" - Reason: ${reason}, Source: ${e.anilistData?.source || 'none'}`);
        });

        for (let i = 0; i < missing.length; i++) {
            const entry = missing[i];
        console.log(`[Library] 📚 Fetching metadata for: "${entry.title}" (${i + 1}/${missing.length})`);
        
        try {
            if (typeof fetchMangaFromAnilist === 'function') {
                let data = await fetchMangaFromAnilist(entry.title);
                
                // Fallback to MangaDex if AniList returns nothing
                if (!data && typeof fetchMangaFromMangadex === 'function') {
                    console.log(`[Library] ⚠️ AniList miss for "${entry.title}", trying MangaDex...`);
                    data = await fetchMangaFromMangadex(entry.title);
                }
                
                if (data) {
                    const source = data.source === 'MANGADEX' ? 'MangaDex' : 'AniList';
                    console.log(`[Library] ✅ Got data from ${source} for: "${entry.title}"`);
                    
                    // Enhancement: If AniList matched but has no chapter count, check MangaDex
                    if (data.source !== 'MANGADEX' && !data.chapters && typeof fetchMangaFromMangadex === 'function') {
                        console.log(`[Library] 🔍 AniList has no chapter count for "${entry.title}", checking MangaDex...`);
                        const mdData = await fetchMangaFromMangadex(entry.title);
                        if (mdData && mdData.chapters) {
                            data.chapters = mdData.chapters;
                            console.log(`[Library] 📈 Found chapter count on MangaDex: ${mdData.chapters}`);
                        }
                        data.mangadexChecked = true; // Don't check again next time
                    }
                    
                    entry.anilistData = data;
                    
                    // Refresh filters if new genres are found
                    if (data.genres) populateGenreFilter();
                } else {
                    // Negative Cache: Mark as NOT_FOUND to prevent immediate re-fetch
                    console.warn(`[Library] ❌ Marking "${entry.title}" as NOT_FOUND in both AniList and MangaDex.`);
                    entry.anilistData = {
                        status: 'NOT_FOUND',
                        lastChecked: Date.now(),
                        title: { english: entry.title }, 
                        format: 'Unknown'
                    };
                }
            }
        } catch (err) {
            console.error(`[Library] ❌ Error fetching "${entry.title}":`, err);
        }
        
        updateProgress(i + 1, missing.length);
        filterEntries(); // Live update
        
        // Batch save every 10 entries to prevent data loss
        if ((i + 1) % 10 === 0) {
            console.log(`[Library] 💾 Batch saving at entry ${i + 1}/${missing.length}...`);
            await new Promise(resolve => {
                chrome.storage.local.set({ savedEntriesMerged }, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`[Library] ❌ Batch save error:`, chrome.runtime.lastError);
                    } else {
                        console.log(`[Library] ✅ Batch saved ${i + 1} entries.`);
                    }
                    resolve();
                });
            });
        }
    }
    
        // Final save - ensure all changes are persisted
        console.log(`[Library] 💾 Saving all ${missing.length} entries to storage...`);
        await new Promise(resolve => {
            chrome.storage.local.set({ savedEntriesMerged }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`[Library] ❌ Save error:`, chrome.runtime.lastError);
                } else {
                    console.log(`[Library] ✅ Successfully saved ${savedEntriesMerged.length} entries to storage!`);
                }
                resolve();
            });
        });
        
        console.log(`[Library] ✅ Fetch complete! Processed ${missing.length} entries.`);
    } finally {
        fetchInProgress = false;
        updateProgress(1, 1); // Hide progress
    }
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

// ============ PHASE 1: ENHANCED LIBRARY FEATURES ============

/** Current entry being viewed in modal, for updates */
let currentModalEntry = null;

/**
 * Populates the personal data section in the modal (Rating, Tags, Notes).
 * @param {Object} entry - The manga entry being displayed.
 */
async function populatePersonalData(entry) {
    currentModalEntry = entry;
    
    // Get personal data
    const personalData = await LibFeatures.getPersonalData(entry);
    const allTags = await LibFeatures.loadUserTags();
    
    // Rating Section
    if (elements.modalPersonalRating) {
        elements.modalPersonalRating.innerHTML = '';
        const ratingEl = LibFeatures.createStarRating(
            personalData.rating || 0,
            async (newRating) => {
                await LibFeatures.saveRating(entry, newRating);
                // Update display
                const valueEl = elements.modalPersonalRating.querySelector('.star-rating-value');
                if (valueEl) valueEl.textContent = newRating > 0 ? `${newRating}/10` : '';
            }
        );
        elements.modalPersonalRating.appendChild(ratingEl);
    }
    
    // Tags Section
    if (elements.modalPersonalTags) {
        elements.modalPersonalTags.innerHTML = '';
        const tagInput = LibFeatures.createTagInput(
            [...personalData.tags],
            allTags,
            async (tag) => {
                await LibFeatures.addTagToManga(entry, tag);
                populateTagFilter(); // Refresh tag dropdown
            },
            async (tag) => {
                await LibFeatures.removeTagFromManga(entry, tag);
            }
        );
        elements.modalPersonalTags.appendChild(tagInput);
    }
    
    // Notes Section
    if (elements.modalPersonalNotes) {
        elements.modalPersonalNotes.innerHTML = '';
        const notesEditor = LibFeatures.createNotesEditor(
            personalData.notes || '',
            async (notes) => {
                await LibFeatures.saveNotes(entry, notes);
            }
        );
        elements.modalPersonalNotes.appendChild(notesEditor);
    }
}

/**
 * Populates the tag filter dropdown with user-defined tags.
 */
async function populateTagFilter() {
    if (!elements.tagFilter) return;
    
    const tags = await LibFeatures.loadUserTags();
    
    // Keep "All Tags" option
    elements.tagFilter.innerHTML = '<option value="All">All Tags</option>';
    
    // Add user tags
    tags.sort().forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = `🏷️ ${tag}`;
        elements.tagFilter.appendChild(opt);
    });
}

/**
 * Populates the filter presets container with saved presets.
 */
async function populateFilterPresets() {
    if (!elements.filterPresetsContainer) return;
    
    const presets = await LibFeatures.loadFilterPresets();
    
    // Clear existing presets (keep save button)
    const saveBtn = elements.btnSaveFilterPreset;
    elements.filterPresetsContainer.innerHTML = '';
    if (saveBtn) elements.filterPresetsContainer.appendChild(saveBtn);
    
    // Add preset buttons
    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'filter-preset-btn';
        btn.innerHTML = `${preset.name} <span class="preset-delete" title="Delete preset">&times;</span>`;
        
        btn.addEventListener('click', (e) => {
            if (e.target.classList.contains('preset-delete')) {
                // Delete preset
                if (confirm(`Delete preset "${preset.name}"?`)) {
                    LibFeatures.deleteFilterPreset(preset.name).then(() => {
                        populateFilterPresets();
                    });
                }
                return;
            }
            // Apply preset
            applyFilterPreset(preset.filters);
            // Mark as active
            elements.filterPresetsContainer.querySelectorAll('.filter-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        
        elements.filterPresetsContainer.appendChild(btn);
    });
}

/**
 * Applies a filter preset to the current filters.
 * @param {Object} filters - Filter values to apply.
 */


/**
 * Attaches listeners for Phase 1 enhanced features.
 */

