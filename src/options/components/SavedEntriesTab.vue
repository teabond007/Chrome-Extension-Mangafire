<template>
    <div id="tab-saved-entries" class="tab-pane fade-in" style="display: none;">
        <header class="header">
            <div class="header-text">
                <h1>Saved Entries</h1>
                <p class="subtitle">Browse and manage your manga library</p>
            </div>
            <div class="header-actions">
                <button 
                    id="BtnShowStats" 
                    class="btn btn-ghost btn-sm"
                    @click="toggleStats"
                >📊 Stats</button>
                <button @click="cleanLibrary" class="btn btn-ghost btn-sm" title="Remove Duplicates">🧹
                    Clean</button>
                <button @click="freshSync" class="btn btn-warning-large">⚡Fresh Sync
                    Entries</button>
            </div>
        </header>

        <div class="content-grid" style="max-width: 100%;">
            <!-- Stats Section (Vue Component) -->
            <LibraryStatistics 
                :entries="savedEntries" 
                :custom-markers="customMarkers"
                :is-visible="showStats" 
            />

            <!-- Bulk Operations Bar -->
            <div v-if="isBulkMode" class="bulk-ops-bar glass-card" style="display: flex;">
                <div class="bulk-info">
                    <span>{{ sortedEntries.length }} items filtered</span>
                </div>
                <div class="bulk-actions">
                    <span>Update All Filtered to:</span>
                    <select v-model="bulkStatus" class="select-field sm">
                        <option value="Reading">Reading</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Plan to Read">Plan to Read</option>
                        <option value="Dropped">Dropped</option>
                    </select>
                    <button @click="applyBulkUpdate" class="btn btn-primary btn-sm">Apply Update</button>
                    <button @click="isBulkMode = false" class="btn btn-ghost btn-sm">&times;</button>
                </div>
            </div>

            <!-- Library Header with Filters -->
            <div class="library-header">
                <div class="library-title-section">
                    <div class="library-icon">📚</div>
                    <div class="library-title-text">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h2>Your Library</h2>
                            <button 
                                @click="isBulkMode = !isBulkMode" 
                                class="btn btn-ghost btn-sm"
                                :class="{ active: isBulkMode }"
                            >Bulk</button>
                            <button class="info-redirect-btn" data-target="guide-entries" title="How to use">
                                <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                            </button>
                        </div>
                        <p class="library-subtitle">{{ sortedEntries.length }} item{{ sortedEntries.length !== 1 ? 's' : '' }}</p>
                    </div>
                </div>
                
                <div class="library-controls">
                    <select v-model="filters.sort" class="select-field" style="width: 140px;">
                        <option value="title-asc">A-Z</option>
                        <option value="title-desc">Z-A</option>
                        <option value="pop-desc">Most Popular</option>
                        <option value="pop-asc">Least Popular</option>
                        <option value="score-desc">Highest Score</option>
                        <option value="rating-desc">My Rating ↓</option>
                        <option value="rating-asc">My Rating ↑</option>
                        <option value="added-desc">Recently Added</option>
                        <option value="last-read-desc">Recently Read</option>
                    </select>

                    <select v-model="filters.demographic" class="select-field">
                        <option value="All">All Demographics</option>
                        <option value="Shonen">Shonen</option>
                        <option value="Seinen">Seinen</option>
                        <option value="Shoujo">Shoujo</option>
                        <option value="Josei">Josei</option>
                    </select>

                    <select v-model="filters.status" class="select-field">
                        <option value="All">All Statuses</option>
                        <option value="Reading">Reading</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Plan to Read">Plan to Read</option>
                        <option value="Dropped">Dropped</option>
                        <option value="HasHistory">Has History</option>
                        <template v-if="customMarkers.length > 0">
                            <option disabled>── Custom Markers ──</option>
                            <option v-for="m in customMarkers" :key="m.name" :value="'marker:' + m.name">
                                📌 {{ m.name }}
                            </option>
                        </template>
                    </select>

                    <select v-model="filters.genre" class="select-field">
                        <option value="All">All Genres</option>
                        <option v-for="genre in availableGenres" :key="genre" :value="genre">{{ genre }}</option>
                    </select>

                    <select v-model="filters.format" class="select-field">
                        <option value="All">All Formats</option>
                        <option value="Manga">Manga</option>
                        <option value="Manhwa">Manhwa</option>
                        <option value="Manhua">Manhua</option>
                        <option value="One Shot">One Shot</option>
                        <option value="Light Novel">Light Novel</option>
                    </select>

                    <div class="search-wrapper">
                        <input type="text" v-model="filters.search" placeholder="Search titles..." class="input-field">
                        <button v-if="filters.search" @click="filters.search = ''" class="search-clear-btn" title="Clear search">&times;</button>
                    </div>

                    <div class="view-toggle-group">
                        <button 
                            @click="setViewSize('compact')" 
                            class="view-toggle-btn" 
                            :class="{ active: cardViewSize === 'compact' }"
                            title="Compact View"
                        >
                            <svg class="icon-svg icon-view-compact"></svg>
                        </button>
                        <button 
                            @click="setViewSize('large')" 
                            class="view-toggle-btn" 
                            :class="{ active: cardViewSize === 'large' }"
                            title="Large View"
                        >
                            <svg class="icon-svg icon-view-large"></svg>
                        </button>
                        <button 
                            @click="setViewSize('list')" 
                            class="view-toggle-btn" 
                            :class="{ active: cardViewSize === 'list' }"
                            title="Detailed List View"
                        >
                            📋
                        </button>
                    </div>
                </div>

                <div class="library-controls-advanced">
                    <FilterGroup label="Chapters:">
                        <div class="chapter-range-wrapper">
                            <input type="number" v-model.number="filters.chapterMin" class="input-field input-sm" placeholder="Min" style="width: 70px;">
                            <span class="range-separator">–</span>
                            <input type="number" v-model.number="filters.chapterMax" class="input-field input-sm" placeholder="Max" style="width: 70px;">
                        </div>
                    </FilterGroup>
                    
                    <FilterGroup label="Updated:">
                        <select v-model="filters.lastUpdated" class="select-field select-sm">
                            <option value="all">Any Time</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="year">Last Year</option>
                        </select>
                    </FilterGroup>

                    <FilterGroup custom-class="quick-filters">
                        <button 
                            @click="toggleBingeworthy" 
                            class="btn btn-ghost btn-sm filter-preset-btn"
                            :class="{ active: filters.chapterMin >= 100 }"
                        >🔥 Binge-worthy</button>
                        <button 
                            @click="filters.newChaptersOnly = !filters.newChaptersOnly" 
                            class="btn btn-ghost btn-sm filter-preset-btn"
                            :class="{ active: filters.newChaptersOnly }"
                        >✨ New Chapters</button>
                        <button @click="clearFilters" class="btn btn-ghost btn-sm filter-preset-btn">✕ Clear</button>
                    </FilterGroup>
                </div>
            </div>


            <!-- Sync Progress Bar -->
            <div v-if="syncState.isSyncing" class="sync-progress-container fade-in">
                <div class="sync-info">
                    <span class="sync-label">
                        <span class="sync-spinner"></span>
                        Updating Library...
                    </span>
                    <span class="sync-count">{{ syncState.current }} / {{ syncState.total }}</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: syncState.percentage + '%' }"></div>
                </div>
                <div class="sync-details">{{ syncState.currentTitle }}</div>
            </div>

            <!-- Manga Grid (Card Views) -->
            <div v-if="cardViewSize !== 'list'" class="manga-grid" :class="{ compact: cardViewSize === 'compact' }">
                <MangaCard 
                    v-for="entry in sortedEntries" 
                    :key="entry.title + (entry.anilistData?.id || '')"
                    :entry="entry"
                    :custom-markers="customMarkers"
                    :library-settings="librarySettings"
                    @click="showDetails"
                    @marker-click="showMarkerPicker"
                />
                <div v-if="sortedEntries.length === 0" class="empty-library">
                    No matches found.
                </div>
            </div>

            <!-- Detailed List View (Modal-like) -->
            <div v-else class="manga-list-view">
                <MangaDetailsLargeView
                    v-for="entry in visibleListEntries"
                    :key="'list-' + entry.title + (entry.anilistData?.id || '')"
                    :entry="entry"
                    @open-modal="showDetails"
                />
                <div v-if="sortedEntries.length === 0" class="empty-library">
                    No matches found.
                </div>
                <div v-if="hasMoreEntries" class="load-more-container">
                    <button @click="loadMoreEntries" class="btn btn-primary">Load More</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import FilterGroup from './common/FilterGroup.vue';
import LibraryStatistics from './LibraryStatistics.vue';
import MangaCard from './common/MangaCard.vue';
import MangaDetailsLargeView from './MangaDetailsLargeView.vue';
import { getFormatName } from '../scripts/ui/manga-card-factory.js';
import * as LibFeatures from '../../scripts/core/library-features.js';
import { useLibraryStore } from '../scripts/store/library.store.js';
import { useSettingsStore } from '../scripts/store/settings.store.js';

// Access Pinia Stores
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();

// Destructure reactive state from stores
const { entries: savedEntries, history } = storeToRefs(libraryStore);
const { 
    libraryBordersEnabled, 
    libraryUseGlow, 
    libraryAnimatedBorders, 
    libraryShowStatusIcon, 
    libraryShowProgressBar
} = storeToRefs(settingsStore);

// Computed setting object for MangaCard compatibility
const librarySettings = computed(() => ({
    bordersEnabled: libraryBordersEnabled.value,
    borderThickness: settingsStore.libraryThickness,
    hideNoHistory: false, // TODO: Move to store if needed globally
    useGlowEffect: libraryUseGlow.value,
    animatedBorders: libraryAnimatedBorders.value,
    showStatusIcon: libraryShowStatusIcon.value,
    showProgressBar: libraryShowProgressBar.value,
    smartInactivity: settingsStore.smartInactivity
}));

const showStats = ref(false);
const isBulkMode = ref(false);
const bulkStatus = ref('Reading');
// const customMarkers = ref([]); // TODO: Add to store if markers are needed globally
const customMarkers = ref([]); // Keeping local for now or need a MarkerStore
const personalData = ref({});
const cardViewSize = ref('large');
const listVisibleCount = ref(5); // Number of entries visible in list view
const familyFriendlyEnabled = ref(false); // TODO: Move to Settings Store

const syncState = reactive({
    isSyncing: false,
    current: 0,
    total: 0,
    percentage: 0,
    currentTitle: ''
});

const filters = reactive({
    sort: 'title-asc',
    demographic: 'All',
    status: 'All',
    genre: 'All',
    format: 'All',
    search: '',
    chapterMin: null,
    chapterMax: null,
    lastUpdated: 'all',
    newChaptersOnly: false
});

const availableGenres = computed(() => {
    const genres = new Set();
    savedEntries.value.forEach(e => {
        if (e.anilistData?.genres) {
            e.anilistData.genres.forEach(g => genres.add(g));
        }
    });
    return Array.from(genres).sort();
});

const filteredEntries = computed(() => {
    return savedEntries.value.filter(entry => {
        const ani = entry.anilistData;

        // Family Friendly
        if (familyFriendlyEnabled.value && ani?.genres) {
            if (ani.genres.some(g => ['Ecchi', 'Hentai'].includes(g))) return false;
        }

        // Status
        if (filters.status !== "All") {
            const entryStatus = (entry.status || '').toLowerCase().trim().replace(/[-\s]/g, '');
            const filterStatus = filters.status.toLowerCase().trim().replace(/[-\s]/g, '');

            if (filters.status.startsWith("marker:")) {
                const markerName = filters.status.substring(7);
                if (entry.customMarker !== markerName && entry.status !== markerName) return false;
            } else if (filters.status === "HasHistory") {
                if (!(entry.lastRead || entry.lastChapterRead || (entry.readChapters > 0))) return false;
            } else {
                // Robust matching for statuses like "On Hold" / "ON-HOLD"
                if (entryStatus !== filterStatus) return false;
            }
        }

        // Hide No History Setting (Needs to be reactive to store if we move it there)
        // ... kept local property check for now if not in passed settings object

        // Format
        if (filters.format !== "All") {
            if (!ani || getFormatName(ani.format, ani.countryOfOrigin) !== filters.format) return false;
        }

        // Genre
        if (filters.genre !== "All" && (!ani?.genres?.includes(filters.genre))) return false;

        // Search
        if (filters.search !== "") {
            const titleMatch = LibFeatures.fuzzyMatch(filters.search, entry.title) ||
                LibFeatures.fuzzyMatch(filters.search, ani?.title?.english || '') ||
                LibFeatures.fuzzyMatch(filters.search, ani?.title?.romaji || '');
            const authorMatch = ani?.staff?.edges?.some(e => 
                LibFeatures.fuzzyMatch(filters.search, e.node?.name?.full || '')
            ) || false;
            if (!titleMatch && !authorMatch) return false;
        }

        // Demographic
        if (filters.demographic !== "All") {
            const targetDemo = filters.demographic.toLowerCase();
            if (!ani?.tags?.some(t => t.name.toLowerCase() === targetDemo)) return false;
        }

        // Chapter Range
        const chapterMin = filters.chapterMin || 0;
        const chapterMax = filters.chapterMax || Infinity;
        if (chapterMin > 0 || chapterMax < Infinity) {
            const totalChapters = ani?.chapters || entry.readChapters || 0;
            if (totalChapters < chapterMin || totalChapters > chapterMax) return false;
        }

        // Last Updated
        if (filters.lastUpdated !== "all") {
            const now = Date.now();
            const lastRead = entry.lastRead || entry.lastUpdated || 0;
            let cutoff = 0;
            switch (filters.lastUpdated) {
                case "7d": cutoff = now - (7 * 24 * 60 * 60 * 1000); break;
                case "30d": cutoff = now - (30 * 24 * 60 * 60 * 1000); break;
                case "90d": cutoff = now - (90 * 24 * 60 * 60 * 1000); break;
                case "year": cutoff = now - (365 * 24 * 60 * 60 * 1000); break;
            }
            if (lastRead < cutoff) return false;
        }

        // New Chapters Only
        if (filters.newChaptersOnly) {
            const totalChapters = ani?.chapters || 0;
            const readChapters = entry.readChapters || 0;
            if (!(totalChapters > 0 && readChapters < totalChapters)) return false;
        }

        return true;
    });
});

const sortedEntries = computed(() => {
    const list = [...filteredEntries.value];
    list.sort((a, b) => {
        const titleA = (a.anilistData?.title?.english || a.title).toLowerCase();
        const titleB = (b.anilistData?.title?.english || b.title).toLowerCase();
        
        switch (filters.sort) {
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'pop-desc': return (b.anilistData?.popularity || 0) - (a.anilistData?.popularity || 0);
            case 'pop-asc': return (a.anilistData?.popularity || 0) - (b.anilistData?.popularity || 0);
            case 'score-desc': return (b.anilistData?.averageScore || 0) - (a.anilistData?.averageScore || 0);
            case 'added-desc': return (b.lastUpdated || 0) - (a.lastUpdated || 0);
            case 'last-read-desc': return (b.lastRead || 0) - (a.lastRead || 0);
            case 'rating-desc': {
                const rA = personalData.value[LibFeatures.getMangaId(a)]?.rating || 0;
                const rB = personalData.value[LibFeatures.getMangaId(b)]?.rating || 0;
                return rB - rA;
            }
            case 'rating-asc': {
                const rA = personalData.value[LibFeatures.getMangaId(a)]?.rating || 0;
                const rB = personalData.value[LibFeatures.getMangaId(b)]?.rating || 0;
                return rA - rB;
            }
            default: return 0;
        }
    });
    return list;
});

// Lazy loading for list view
const visibleListEntries = computed(() => {
    return sortedEntries.value.slice(0, listVisibleCount.value);
});

const hasMoreEntries = computed(() => {
    return listVisibleCount.value < sortedEntries.value.length;
});

const loadMoreEntries = () => {
    listVisibleCount.value += 5;
};

const toggleStats = () => {
    showStats.value = !showStats.value;
};

const showDetails = (entry) => {
    if (window.showMangaDetails) {
        window.showMangaDetails(entry);
    }
};

const setViewSize = (size) => {
    cardViewSize.value = size;
    listVisibleCount.value = 5; // Reset lazy loading when switching views
    chrome.storage.local.set({ cardViewSize: size });
};

const clearFilters = () => {
    filters.chapterMin = null;
    filters.chapterMax = null;
    filters.lastUpdated = 'all';
    filters.newChaptersOnly = false;
    filters.status = 'All';
    filters.genre = 'All';
    filters.format = 'All';
    filters.demographic = 'All';
};

const toggleBingeworthy = () => {
    filters.chapterMin = filters.chapterMin >= 100 ? null : 100;
};

const showMarkerPicker = (entry) => {
    // This is still partially in vanilla, calling the prompt logic for now 
    // but eventually this could be a Vue modal too.
    if (window.showMarkerPicker) window.showMarkerPicker(entry);
};

const cleanLibrary = () => {
    if (confirm("Remove duplicate entries?")) {
        if (window.cleanLibraryDuplicates) {
            window.cleanLibraryDuplicates();
        } else {
            console.error("Library cleaning function not found");
        }
    }
};

const freshSync = () => {
    if (confirm("Reset library cache and force fresh sync of all entries?")) {
        if (window.forceSyncLibrary) {
            window.forceSyncLibrary();
        } else {
            console.error("Library sync function not found");
        }
    }
};

const applyBulkUpdate = async () => {
    const count = sortedEntries.value.length;
    if (count === 0) return;
    
    if (confirm(`Update all ${count} filtered items to "${bulkStatus.value}"?`)) {
        // Here we still call direct storage or we should dispatch a store action
        // For now, let's keep direct storage write but the Store will pick up changes via onChanged listener
        const updated = savedEntries.value.map(e => {
            const isMatch = sortedEntries.value.some(match => match.title === e.title);
            if (isMatch) {
                // Remove marker if generic status set
                return { ...e, status: bulkStatus.value, customMarker: null };
            }
            return e;
        });
        
        chrome.storage.local.set({ savedEntriesMerged: updated }, () => {
            alert(`Updated ${count} items.`);
            isBulkMode.value = false;
        });
    }
};

const loadData = () => {
    // Check if context is valid
    if (!chrome.runtime?.id) {
        console.error("Extension context invalidated. Please refresh the page.");
        return;
    }

    // Only load non-store managed data here (legacy mix)
    chrome.storage.local.get([
        'customBookmarks', 
        'cardViewSize',
        'FamilyFriendlyfeatureEnabled',
    ], async (data) => {
        customMarkers.value = data.customBookmarks || [];
        cardViewSize.value = data.cardViewSize || 'large';
        familyFriendlyEnabled.value = data.FamilyFriendlyfeatureEnabled || false;

        personalData.value = await LibFeatures.loadPersonalData();
    });
};

onMounted(() => {
    console.log('[SavedEntriesTab] Component MOUNTED');
    loadData();
    // No need for separate chrome.storage.onChanged listener for entries here
    // The Store handles it and updates `savedEntries` automatically!
    
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            // Only listen for things NOT in the store yet
            if (changes.customBookmarks) customMarkers.value = changes.customBookmarks.newValue || [];
            if (changes.FamilyFriendlyfeatureEnabled) familyFriendlyEnabled.value = changes.FamilyFriendlyfeatureEnabled.newValue;
        }
    });

    // Global exposure for legacy integration - calling loadData() which now just refreshes local non-store state
    window.refreshLibraryData = loadData;

    // Sync Event Listeners
    window.addEventListener('library-sync-start', (e) => {
        syncState.isSyncing = true;
        syncState.total = e.detail?.total || 0;
        syncState.current = 0;
        syncState.percentage = 0;
        syncState.currentTitle = 'Starting...';
    });

    window.addEventListener('library-sync-progress', (e) => {
        const { current, total, title } = e.detail;
        syncState.isSyncing = true;
        syncState.current = current;
        syncState.total = total;
        syncState.currentTitle = title || 'Processing...';
        if (total > 0) {
            syncState.percentage = Math.round((current / total) * 100);
        }
    });

    window.addEventListener('library-sync-complete', () => {
        syncState.isSyncing = false;
        loadData(); // Refresh local non-store data
        // Store data updates automatically via its own listener
    });
});
</script>

<style scoped>
/* Component-scoped styles */
.library-header {
    margin-bottom: 1rem;
}

.library-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.library-controls-advanced {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color, #333);
}

.bulk-ops-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
}

.bulk-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.empty-library {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary, #999);
    font-style: italic;
}

.manga-grid.compact {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.sync-progress-container {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.sync-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
}

.sync-label {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sync-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--text-secondary);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.progress-bar-bg {
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 6px;
}

.progress-bar-fill {
    height: 100%;
    background: var(--accent-primary);
    transition: width 0.3s ease;
    border-radius: 10px;
}

.sync-details {
    font-size: 11px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Search clear button */
.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-clear-btn {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    line-height: 1;
    transition: color 0.2s;
}

.search-clear-btn:hover {
    color: var(--text-primary);
}

/* List View */
.manga-list-view {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
}

.load-more-container {
    display: flex;
    justify-content: center;
    padding: 2rem 0;
}

</style>
