import { createMangaCard, getFormatName, getStatusInfo } from './manga-card-factory.js';
import { fetchMangaFromAnilist } from './anilist-api.js';

let savedEntriesMerged = [];
let customMarkers = [];
let fetchInProgress = false;

let elements = {
    grid: null,
    viewLargeBtn: null,
    // Filters
    statusFilter: null,
    formatFilter: null,
    genreFilter: null,
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
    closeModal: null
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
        closeModal: document.getElementById("closeMangaDetails")
    };

    // Genre filter
    elements.genreFilter = document.getElementById("savedGenreFilter");

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
                readChapters: b.readChapters || 0,
                anilistData: null,
                customMarker: null,
                lastUpdated: Date.now()
            }));
            chrome.storage.local.set({ savedEntriesMerged });
        }

        populateStatusFilter();
        populateGenreFilter();
        
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
    elements.genreFilter?.addEventListener("change", filterEntries);
    elements.searchInput?.addEventListener("input", filterEntries);

    elements.viewCompactBtn?.addEventListener("click", () => {
        setViewSize("compact");
        chrome.storage.local.set({ cardViewSize: "compact" });
    });

    elements.viewLargeBtn?.addEventListener("click", () => {
        setViewSize("large");
        chrome.storage.local.set({ cardViewSize: "large" });
    });

    // Modal listeners
    elements.closeModal?.addEventListener("click", () => {
        if (elements.modal) elements.modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === elements.modal) {
            elements.modal.style.display = "none";
        }
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
    const originalCount = 7; // All, Reading, Completed, On Hold, Plan to Read, Dropped, marker header
    
    // Reset to base 6 options (All + 5 default statuses)
    while (elements.statusFilter.options.length > 6) {
        elements.statusFilter.remove(6);
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

            let matchesGenre = true;
            if (genreVal !== "All") {
                matchesGenre = ani?.genres?.includes(genreVal) || false;
            }

            const matchesSearch = searchVal === "" || 
                entry.title.toLowerCase().includes(searchVal) ||
                ani?.title?.english?.toLowerCase().includes(searchVal) ||
                ani?.title?.romaji?.toLowerCase().includes(searchVal);

            return matchesStatus && matchesFormat && matchesGenre && matchesSearch;
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
        card.addEventListener("click", () => showMangaDetails(entry));
        elements.grid.appendChild(card);
    });

    updateSubtitle(entries.length);
}

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
        if (ani.bannerImage) {
            elements.modalBanner.style.backgroundImage = `url('${ani.bannerImage}')`;
            elements.modalBanner.style.display = "block";
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

    // External Links
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

        (ani.externalLinks || []).forEach(link => {
            const a = document.createElement("a");
            a.className = "external-link-btn";
            a.href = link.url;
            a.target = "_blank";
            a.textContent = link.site;
            elements.modalExternalLinks.appendChild(a);
        });
    }

    if (elements.modal) {
        elements.modal.style.display = "flex";
        // Reset scroll position
        const body = elements.modal.querySelector('.modal-body');
        if (body) body.scrollTop = 0;
    }
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
    // Fetch if no AniList data OR if description is missing (user requested richer data for existing entries)
    const missing = savedEntriesMerged.filter(e => !e.anilistData || !e.anilistData.description);
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
                
                // Refresh filters if new genres are found
                if (data.genres) populateGenreFilter();
                
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
