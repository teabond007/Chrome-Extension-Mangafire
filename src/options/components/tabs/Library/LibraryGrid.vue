<template>
    <div>
        <!-- Manga Grid (Card Views) -->
        <div v-if="cardViewSize !== 'list'" class="manga-grid" :class="{ compact: cardViewSize === 'compact' }">
            <MangaCard 
                v-for="entry in sortedEntries" 
                :key="entry.title + (entry.anilistData?.id || '')"
                :entry="entry"
                :custom-statuses="customStatuses"
                :library-settings="librarySettings"
                @click="$emit('show-details', entry)"
                @status-click="$emit('show-status-picker', entry)"
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
                @open-modal="$emit('show-details', entry)"
            />
            <div v-if="sortedEntries.length === 0" class="empty-library">
                No matches found.
            </div>
            <div v-if="hasMoreEntries" class="load-more-container">
                <button @click="$emit('load-more')" class="btn btn-primary">Load More</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import MangaCard from '../../common/MangaCard.vue';
import MangaDetailsLargeView from '../../MangaDetailsLargeView.vue';

defineProps({
    sortedEntries: Array,
    visibleListEntries: Array,
    hasMoreEntries: Boolean,
    cardViewSize: String,
    customStatuses: Array,
    librarySettings: Object
});

defineEmits(['show-details', 'show-status-picker', 'load-more']);
</script>

<style scoped lang="scss">
/* Manga Cards Grid */
.manga-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding: 20px 0;
}

/* Compact View */
.manga-grid.compact {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
}

.manga-grid.compact :deep(.manga-card-body) {
    padding: 8px;
}

.manga-grid.compact :deep(.manga-card-title) {
    font-size: 11px;
    min-height: 28px;
}

.manga-grid.compact :deep(.manga-card-status) {
    font-size: 9px;
    padding: 2px 4px;
}

.manga-grid.compact :deep(.info-item) {
    font-size: 10px;
}

.manga-grid.compact :deep(.card-status-dot) {
    width: 10px;
    height: 10px;
    top: 6px;
    right: 6px;
}

/* Responsive Grid */
@media (min-width: 1600px) {
    .manga-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
}

@media (min-width: 2000px) {
    .manga-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
}

@media (max-width: 1200px) {
    .manga-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
    
    .manga-grid.compact {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
}

@media (max-width: 768px) {
    .manga-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
    }
    
    .manga-grid.compact {
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 12px;
    }
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

.empty-library {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    font-style: italic;

    .empty-library-icon {
        font-size: 64px;
        margin-bottom: 16px;
        opacity: 0.3;
    }

    p { font-size: 14px; }
}
</style>
