import { reactive, computed, ref } from 'vue';
import { getFormatName } from '../scripts/ui/manga-card-utils.js';
import * as LibFeatures from '../../scripts/core/library-features.js';

export function useLibraryFilters(savedEntries, customStatuses, personalData, familyFriendlyEnabled) {
    const cardViewSize = ref('large');
    const listVisibleCount = ref(5);
    const isBulkMode = ref(false);
    const bulkStatus = ref('Reading');

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

    const visibleListEntries = computed(() => {
        return sortedEntries.value.slice(0, listVisibleCount.value);
    });

    const hasMoreEntries = computed(() => {
        return listVisibleCount.value < sortedEntries.value.length;
    });

    const loadMoreEntries = () => {
        listVisibleCount.value += 5;
    };

    return {
        cardViewSize,
        listVisibleCount,
        isBulkMode,
        bulkStatus,
        filters,
        availableGenres,
        filteredEntries,
        sortedEntries,
        visibleListEntries,
        hasMoreEntries,
        setViewSize,
        clearFilters,
        toggleBingeworthy,
        loadMoreEntries
    };
}
