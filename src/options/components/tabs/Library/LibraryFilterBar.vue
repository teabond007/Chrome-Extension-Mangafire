<template>
    <div class="library-header">
        <div class="library-title-section">
            <div class="library-icon">📚</div>
            <div class="library-title-text">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <h2>Your Library</h2>
                    <button 
                        @click="$emit('toggle-bulk')" 
                        class="btn btn-ghost btn-sm"
                        :class="{ active: isBulkMode }"
                    >Bulk</button>
                    <button 
                        @click="$emit('toggle-stats')" 
                        class="btn btn-ghost btn-sm"
                        :class="{ active: showStats }"
                    >
                        <span style="margin-right: 4px;">📊</span>Stats
                    </button>
                    <button 
                        class="info-redirect-btn" 
                        title="How to use"
                        @click="handleGuideRedirect"
                    >
                        <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                    </button>
                </div>
                <p class="library-subtitle">{{ sortedEntriesCount }} item{{ sortedEntriesCount !== 1 ? 's' : '' }}</p>
            </div>
        </div>
        
        <div class="library-controls">
            <select v-model="filters.sort" class="select-field" style="width: 140px;">
                <option value="last-read-desc">Recently Read</option>
                <option value="added-desc">Recently Added</option>
                <option value="title-asc">A-Z</option>
                <option value="title-desc">Z-A</option>
                <option value="pop-desc">Most Popular</option>
                <option value="pop-asc">Least Popular</option>
                <option value="score-desc">Highest Score</option>
                <option value="rating-desc">My Rating ↓</option>
                <option value="rating-asc">My Rating ↑</option>
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
                <template v-if="customStatuses && customStatuses.length > 0">
                    <option disabled>── Custom Statuses ──</option>
                    <option v-for="m in customStatuses" :key="m.name" :value="'marker:' + m.name">
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
                    @click="$emit('set-view-size', 'compact')" 
                    class="view-toggle-btn" 
                    :class="{ active: cardViewSize === 'compact' }"
                    title="Compact View"
                >
                    <svg class="icon-svg icon-view-compact"></svg>
                </button>
                <button 
                    @click="$emit('set-view-size', 'large')" 
                    class="view-toggle-btn" 
                    :class="{ active: cardViewSize === 'large' }"
                    title="Large View"
                >
                    <svg class="icon-svg icon-view-large"></svg>
                </button>
                <button 
                    @click="$emit('set-view-size', 'list')" 
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
                    @click="$emit('toggle-bingeworthy')" 
                    class="btn btn-ghost btn-sm filter-preset-btn"
                    :class="{ active: filters.chapterMin >= 100 }"
                >🔥 Binge-worthy</button>
                <button 
                    @click="filters.newChaptersOnly = !filters.newChaptersOnly" 
                    class="btn btn-ghost btn-sm filter-preset-btn"
                    :class="{ active: filters.newChaptersOnly }"
                >✨ New Chapters</button>
                <button @click="$emit('clear-filters')" class="btn btn-ghost btn-sm filter-preset-btn">✕ Clear</button>
            </FilterGroup>
        </div>
    </div>
</template>

<script setup>
import FilterGroup from '../../common/FilterGroup.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

defineProps({
    filters: Object,
    customStatuses: Array,
    availableGenres: Array,
    isBulkMode: Boolean,
    showStats: Boolean,
    cardViewSize: String,
    sortedEntriesCount: Number
});

defineEmits(['toggle-bulk', 'toggle-stats', 'set-view-size', 'clear-filters', 'toggle-bingeworthy']);

const settingsStore = useSettingsStore();

const handleGuideRedirect = () => {
    settingsStore.activeTab = 'about';
    
    setTimeout(() => {
        const targetElement = document.getElementById('guide-library');
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetElement.classList.add('highlight-pulse');
            setTimeout(() => targetElement.classList.remove('highlight-pulse'), 2000);
        }
    }, 100);
};
</script>

<style scoped lang="scss">
.library-header {
    background: linear-gradient(135deg, rgba(67, 24, 255, 0.1) 0%, rgba(106, 210, 255, 0.1) 100%);
    border-radius: var(--radius-md);
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
    flex-wrap: wrap;
    gap: 16px;
}

:global(.dark-mode) .library-header {
    background: linear-gradient(135deg, rgba(67, 24, 255, 0.15) 0%, rgba(106, 210, 255, 0.15) 100%);
}

.library-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.library-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
    background: var(--accent-primary);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.library-title-text h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    margin-bottom: 2px;
}

.library-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
}

.library-controls {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
}

.library-controls .select-field,
.library-controls .input-field {
    height: 36px;
    min-width: 150px;
    background-color: var(--bg-card);
    font-size: 13px;
}

.library-controls .input-field {
    min-width: 200px;
}

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

.view-toggle-group {
    display: flex;
    gap: 4px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: var(--radius-sm);
    padding: 4px;
}

.view-toggle-btn {
    padding: 6px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.view-toggle-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
}

:global(.dark-mode) .view-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.05);
}

.view-toggle-btn.active {
    background: var(--accent-primary);
    color: white;
}

.view-toggle-btn.active:hover {
    background: var(--accent-hover);
}

.library-controls-advanced {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color, #333);
    width: 100%;
}

.chapter-range-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
}

.range-separator {
    color: var(--text-secondary);
    font-size: 14px;
}

.quick-filters {
    display: flex;
    gap: 8px;
    margin-left: auto;
}

.filter-preset-btn {
    font-size: 11px !important;
    padding: 6px 12px !important;
    border-radius: 20px !important;
    transition: all 0.2s ease;
}

.filter-preset-btn:hover {
    transform: scale(1.02);
}

.filter-preset-btn.active {
    background: var(--accent-primary) !important;
    color: white !important;
    border-color: var(--accent-primary) !important;
}

.input-sm {
    height: 32px !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
}

.select-sm {
    height: 32px !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
    min-width: 100px !important;
}

@media (max-height: 800px) and (min-width: 1200px) {
    .library-header {
        padding: 16px 20px;
        gap: 12px;
    }
    .library-controls {
        gap: 8px;
    }
    .library-controls .select-field,
    .library-controls .input-field {
        height: 32px;
        min-width: 120px;
        font-size: 12px;
    }
    .library-controls .input-field {
        min-width: 160px;
    }
    .library-icon {
        width: 40px;
        height: 40px;
        font-size: 20px;
    }
    .library-title-text h2 {
        font-size: 18px;
    }
}

@media (max-height: 700px) {
    .library-header {
        padding: 12px 16px;
        flex-direction: column;
        align-items: flex-start;
    }
    .library-controls {
        width: 100%;
        justify-content: flex-start;
    }
    .library-controls .select-field {
        min-width: 110px;
        flex: 1 1 auto;
        max-width: 150px;
    }
    .library-controls .input-field {
        min-width: 140px;
        flex: 2 1 auto;
        max-width: 200px;
    }
}

@media (min-aspect-ratio: 16/10) and (max-height: 900px) {
    .library-header {
        padding: 14px 18px;
    }
    .library-controls .select-field,
    .library-controls .input-field {
        height: 34px;
        min-width: 125px;
    }
}
</style>
