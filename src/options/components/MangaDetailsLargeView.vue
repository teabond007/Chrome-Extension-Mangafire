<template>
    <div class="manga-detail-card" :class="{ 'is-loading': !entry.anilistData }" @click="$emit('open-modal', entry)">
        <!-- Ambient Glow Background -->
        <div v-if="bannerUrl" class="card-ambient-glow" :style="ambientGlowStyle"></div>
        
        <!-- Banner -->
        <div v-if="bannerUrl" class="card-banner" :style="bannerStyle"></div>
        
        <!-- Content Layout -->
        <div class="card-body">
            <div class="card-layout">
                <!-- Sidebar with Cover -->
                <div class="card-sidebar">
                    <img :src="coverUrl" alt="Cover" class="card-cover">
                    <div class="card-sidebar-info">
                        <div class="meta-row">
                            <span class="meta-label">Status</span>
                            <div class="manga-card-status" :style="statusStyle">{{ entry.status }}</div>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Format</span>
                            <div class="format-badge">{{ formatName }}</div>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Score</span>
                            <div class="score-value">{{ ani?.averageScore ? ani.averageScore + '%' : '-' }}</div>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Progress</span>
                            <div class="meta-value">{{ entry.readChapters || 0 }} / {{ ani?.chapters || '?' }}</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="card-main">
                    <h2 class="card-title">{{ ani?.title?.english || ani?.title?.romaji || entry.title }}</h2>
                    
                    <div class="card-genres">
                        <span v-for="g in ani?.genres?.slice(0, 5)" :key="g" class="genre-tag">{{ g }}</span>
                    </div>
                    
                    <div class="card-description" v-html="truncatedDescription"></div>
                    
                    <div class="card-actions" @click.stop>
                        <a v-if="entry.lastMangafireUrl" :href="entry.lastMangafireUrl" target="_blank" class="btn btn-primary btn-sm">
                            ▶ Continue Ch.{{ entry.lastChapterRead || '?' }}
                        </a>
                        <a v-if="ani?.siteUrl" :href="ani.siteUrl" target="_blank" class="btn btn-ghost btn-sm">
                            AniList
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
/**
 * MangaDetailsLargeView.vue
 * A non-modal, card-based detailed view of a manga entry for use in list layouts.
 */
import { computed } from 'vue';
import { getFormatName, getStatusInfo } from '../scripts/ui/manga-card-factory.js';

const props = defineProps({
    entry: {
        type: Object,
        required: true
    }
});

defineEmits(['open-modal']);

const ani = computed(() => props.entry.anilistData);

const formatName = computed(() => {
    if (!ani.value) return 'Manga';
    return getFormatName(ani.value.format, ani.value.countryOfOrigin);
});

const statusStyle = computed(() => {
    if (!props.entry.status) return {};
    const info = getStatusInfo(props.entry.status, props.entry.customMarker, []);
    return {
        backgroundColor: info.badgeBg,
        color: info.badgeText
    };
});

const bannerUrl = computed(() => {
    if (!ani.value) return null;
    return ani.value.bannerImage || ani.value.coverImage?.extraLarge || ani.value.coverImage?.large;
});

const bannerStyle = computed(() => {
    if (!bannerUrl.value) return {};
    return {
        backgroundImage: `url('${bannerUrl.value}')`,
        filter: ani.value?.bannerImage ? 'none' : 'blur(4px) brightness(0.7)'
    };
});

const ambientGlowStyle = computed(() => {
    if (!bannerUrl.value) return {};
    return {
        backgroundImage: `url('${bannerUrl.value}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(80px) saturate(2) brightness(0.6) opacity(0.3)'
    };
});

const coverUrl = computed(() => {
    if (!ani.value) return 'https://mangadex.org/img/avatar.png';
    return ani.value.coverImage?.large || ani.value.coverImage?.medium || 'https://mangadex.org/img/avatar.png';
});

const truncatedDescription = computed(() => {
    const desc = ani.value?.description || 'No description available.';
    const stripped = desc.replace(/<[^>]*>/g, '');
    return stripped.length > 300 ? stripped.slice(0, 300) + '...' : stripped;
});
</script>

<style scoped>
.manga-detail-card {
    position: relative;
    background: var(--bg-card);
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    margin-bottom: 1.5rem;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.manga-detail-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.manga-detail-card.is-loading {
    opacity: 0.6;
}

.card-ambient-glow {
    position: absolute;
    inset: -20%;
    z-index: 0;
    pointer-events: none;
}

.card-banner {
    width: 100%;
    height: 150px;
    background-size: cover;
    background-position: center;
    position: relative;
}

.card-banner::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to top, var(--bg-card), transparent);
}

.card-body {
    padding: 1.5rem;
    position: relative;
    z-index: 1;
}

.card-layout {
    display: flex;
    gap: 1.5rem;
}

.card-sidebar {
    width: 160px;
    flex-shrink: 0;
    margin-top: -80px;
}

.card-cover {
    width: 100%;
    border-radius: var(--radius-md, 8px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    border: 3px solid var(--bg-card);
}

.card-sidebar-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-sm, 6px);
}

.meta-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.meta-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
}

.meta-value {
    font-size: 13px;
    color: var(--text-primary);
}

.score-value {
    color: var(--warning, #FFB547);
    font-weight: 700;
    font-size: 16px;
}

.card-main {
    flex: 1;
}

.card-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.75rem;
    line-height: 1.3;
}

.card-genres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 1rem;
}

.genre-tag {
    background: rgba(67, 24, 255, 0.08);
    color: var(--accent-primary);
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
}

.card-description {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.card-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}
</style>
