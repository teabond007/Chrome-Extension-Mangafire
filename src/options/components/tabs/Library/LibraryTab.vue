<template>
    <div id="tab-saved-entries" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'saved-entries' }">
        <header class="header">
            <div class="header-text">
                <h1>Library</h1>
                <p class="subtitle">Browse and manage your manga library</p>
            </div>
            <div class="header-actions">
                <button @click="freshSync" class="btn btn-warning-large">⚡Fresh Sync Entries</button>
            </div>
        </header>

        <div class="content-grid" style="max-width: 100%;">
            <!-- Stats Section (Vue Component) -->
            <LibraryStatistics 
                :entries="savedEntries" 
                :custom-statuses="customStatuses"
                :is-visible="showStats" 
            />

            <!-- Bulk Operations Bar -->
            <LibraryBulkOpsBar 
                :is-bulk-mode="isBulkMode" 
                :selected-count="sortedEntries.length"
                @apply="applyBulkUpdate"
                @close="isBulkMode = false"
            />

            <!-- Library Header with Filters -->
            <LibraryFilterBar 
                :filters="filters"
                :custom-statuses="customStatuses"
                :available-genres="availableGenres"
                :is-bulk-mode="isBulkMode"
                :card-view-size="cardViewSize"
                :sorted-entries-count="sortedEntries.length"
                @toggle-bulk="isBulkMode = !isBulkMode"
                @set-view-size="setViewSize"
                @clear-filters="clearFilters"
                @toggle-bingeworthy="toggleBingeworthy"
            />

            <!-- Sync Progress Bar -->
            <LibrarySyncProgress :sync-state="syncState" />

            <!-- Manga Grid / List View -->
            <LibraryGrid 
                :card-view-size="cardViewSize"
                :sorted-entries="sortedEntries"
                :visible-list-entries="visibleListEntries"
                :has-more-entries="hasMoreEntries"
                :custom-statuses="customStatuses"
                :personal-data="personalData"
                :library-settings="librarySettings"
                @show-details="showDetails"
                @show-status-picker="showStatusPicker"
                @load-more="loadMoreEntries"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import LibraryStatistics from './LibraryStatistics.vue';
import LibraryFilterBar from './LibraryFilterBar.vue';
import LibraryBulkOpsBar from './LibraryBulkOpsBar.vue';
import LibrarySyncProgress from './LibrarySyncProgress.vue';
import LibraryGrid from './LibraryGrid.vue';

import { getFormatName } from '../../../scripts/ui/manga-card-utils.js';
import * as LibraryService from '../../../../scripts/core/library-service.ts';
import { useLibraryStore } from '../../../scripts/store/library.store.js';
import { 
    TOGGLES,
    SETTINGS,
    DATA 
} from '../../../../config.js';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

// Access Pinia Stores
// Access Pinia Stores
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();

// Destructure reactive state from stores
const { 
    entries: savedEntries, 
    personalData, 
    isSyncing, 
    syncProgress 
} = storeToRefs(libraryStore);

const { 
    libraryBordersEnabled, 
    libraryUseGlow, 
    libraryAnimatedBorders, 
    libraryShowStatusIcon,
    familyFriendlyEnabled,
    customStatuses,
    showReadingBadges,
    autoReadStale: smartInactivity,
    highlightThickness,
    libraryHideNoHistory,
    libraryShowRibbons
} = storeToRefs(settingsStore);

// Computed setting object for MangaCard compatibility
const librarySettings = computed(() => ({
    bordersEnabled: libraryBordersEnabled.value,
    borderThickness: highlightThickness.value,
    hideNoHistory: libraryHideNoHistory.value,
    useGlowEffect: libraryUseGlow.value,
    animatedBorders: libraryAnimatedBorders.value,
    showStatusIcon: libraryShowStatusIcon.value,
    showReadingBadges: showReadingBadges.value,
    showRibbons: libraryShowRibbons.value,
    smartInactivity: smartInactivity.value
}));

const showStats = ref(false);
const isBulkMode = ref(false);
const listVisibleCount = ref(5);

const syncState = computed(() => ({
    isSyncing: isSyncing.value,
    current: syncProgress.value.current,
    total: syncProgress.value.total,
    currentTitle: syncProgress.value.title,
    percentage: syncProgress.value.total > 0 
        ? Math.round((syncProgress.value.current / syncProgress.value.total) * 100) 
        : 0
}));

const setViewSize = (size) => {
    settingsStore.updateSetting(SETTINGS.VIEW_MODE, size);
};

const showDetails = (entry) => {
    libraryStore.selectedEntry = entry;
};

const filters = reactive({
    sort: 'last-read-desc',
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
                const statusName = filters.status.substring(7);
                if (entry.customStatus !== statusName && entry.status !== statusName) return false;
            } else if (filters.status === "HasHistory") {
                if (!(entry.lastRead || entry.lastChapterRead || (entry.readChapters > 0))) return false;
            } else {
                if (entryStatus !== filterStatus) return false;
            }
        }

        // Format
        if (filters.format !== "All") {
            if (!ani || getFormatName(ani.format, ani.countryOfOrigin) !== filters.format) return false;
        }

        // Genre
        if (filters.genre !== "All" && (!ani?.genres?.includes(filters.genre))) return false;

         // Search
        if (filters.search !== "") {
            const titleMatch = LibraryService.fuzzyMatch(filters.search, entry.title) ||
                LibraryService.fuzzyMatch(filters.search, entry.anilistData?.title?.english || '') ||
                LibraryService.fuzzyMatch(filters.search, entry.anilistData?.title?.romaji || '');
            const authorMatch = entry.anilistData?.staff?.edges?.some(e => 
                LibraryService.fuzzyMatch(filters.search, e.node?.name?.full || '')
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
                const rA = personalData.value[LibraryService.getMangaId(a)]?.rating || 0;
                const rB = personalData.value[LibraryService.getMangaId(b)]?.rating || 0;
                return rB - rA;
            }
            case 'rating-asc': {
                const rA = personalData.value[LibraryService.getMangaId(a)]?.rating || 0;
                const rB = personalData.value[LibraryService.getMangaId(b)]?.rating || 0;
                return rA - rB;
            }
            default: return 0;
        }
    });
    return list;
});

const visibleListEntries = computed(() => {
    return sortedEntries.value.slice(0, listVisibleCount.value);
});

const hasMoreEntries = computed(() => {
    return listVisibleCount.value < sortedEntries.value.length;
});

const loadMoreEntries = () => listVisibleCount.value += 5;
const toggleStats = () => showStats.value = !showStats.value;

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

const showStatusPicker = (entry) => {
    if (window.showStatusPicker) window.showStatusPicker(entry);
};

const freshSync = async () => {
    await libraryStore.forceSync();
};

const applyBulkUpdate = async (newStatus) => {
    const count = sortedEntries.value.length;
    if (count === 0) return;
    
    if (confirm(`Update all ${count} filtered items to "${newStatus}"?`)) {
        const updated = savedEntries.value.map(e => {
            const isMatch = sortedEntries.value.some(match => match.title === e.title);
            if (isMatch) {
                return { ...e, status: newStatus, customStatus: null };
            }
            return e;
        });
        
        chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: updated }, () => {
            alert(`Updated ${count} items.`);
            isBulkMode.value = false;
        });
    }
};

onMounted(() => {
    libraryStore.loadLibrary();
});
</script>
