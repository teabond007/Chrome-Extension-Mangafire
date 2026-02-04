<template>
    <div 
        class="manga-card" 
        :class="{ 
            'glow-effect': useGlow, 
            'reading-pulse': useAnimatedPulse,
            'has-custom-marker': !!entry.customMarker,
            'stale-entry': isStale
        }"
        :style="cardStyle"
        @click="$emit('click', entry)"
    >
        <!-- Cover Section -->
        <div 
            class="manga-card-cover" 
            :style="{ backgroundImage: `url('${coverUrl}')` }"
        >
            <div class="card-status-dot" :style="{ backgroundColor: statusInfo.borderColor }"></div>
            


            <div v-if="showProgressBar" class="manga-card-progress-bar">
                <div class="manga-card-progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>

            <div class="manga-card-actions">
                <a 
                    v-if="entry.lastMangafireUrl && (entry.lastChapterRead || entry.lastChapterRead === 0)" 
                    :href="entry.lastMangafireUrl" 
                    target="_blank" 
                    class="card-action-btn card-action-continue"
                    @click.stop
                    :title="'Continue reading Ch.' + (entry.lastChapterRead || '?')"
                >
                    ▶ Ch.{{ entry.lastChapterRead || '?' }}
                </a>
            </div>
        </div>

        <!-- Body Section -->
        <div class="manga-card-body">
            <h3 class="manga-card-title" :title="displayTitle">
                {{ displayTitle }}
            </h3>
            
            <div class="manga-card-meta">
                <span 
                    class="manga-card-status" 
                    :style="{ backgroundColor: statusInfo.badgeBg, color: statusInfo.badgeText }"
                >
                    {{ entry.status }}
                </span>

                <div v-if="entry.anilistData" class="manga-card-info">
                    <div v-if="formatName" class="info-item format-badge">
                        {{ formatName }}
                    </div>
                    
                    <div v-if="demographic" :class="['info-item', 'format-badge', `demo-${demographic.toLowerCase()}`]" style="margin-left: 4px;">
                        {{ demographic }}
                    </div>

                    <div class="info-item">
                        <template v-if="entry.anilistData.chapters">
                            <span class="info-label">Read:</span>{{ entry.readChapters || 0 }} / 
                            <span class="info-label">Total:</span>{{ entry.anilistData.chapters }}
                        </template>
                        <template v-else>
                            <span class="info-label">Read:</span>{{ entry.readChapters || 0 }} 
                            <span class="info-label ongoing-tag">Ongoing</span>
                        </template>
                    </div>
                </div>
                <div v-else class="info-item" style="opacity: 0.6;">
                    Loading info...
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusInfo, getFormatName } from '../../scripts/ui/manga-card-factory.js';

// Fallback placeholder - base64 encoded or remote fallback
const FALLBACK_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY2NiI+PHBhdGggZD0iTTIxIDR2MTJIMy4wMVYySDFWMTZoMjBWNGgtMlptLTEuOTEgMTMuNUw0IDE4djJoMTIuMTdsLjg0LS44NCAxLjA4IDEuNi42Ni0uMjItLjk3LTEuNDNjLjEyLS4xNi4yMi0uMzUuMzEtLjU1eiIvPjwvc3ZnPg==';

const props = defineProps({
    entry: {
        type: Object,
        required: true
    },
    customMarkers: {
        type: Array,
        default: () => []
    },
    librarySettings: {
        type: Object,
        default: () => ({
            bordersEnabled: true,
            borderThickness: 2,
            useGlowEffect: false,
            animatedBorders: false,

            showProgressBar: false,
            smartInactivity: false
        })
    }
});

defineEmits(['click', 'marker-click']);

const statusInfo = computed(() => {
    return getStatusInfo(props.entry.status, props.entry.customMarker, props.customMarkers);
});

const useGlow = computed(() => props.librarySettings.bordersEnabled && props.librarySettings.useGlowEffect);

const cardStyle = computed(() => {
    if (!props.librarySettings.bordersEnabled) return { border: 'none' };
    
    if (useGlow.value) {
        return { 
            '--glow-color': `${statusInfo.value.borderColor}80`,
            border: 'none'
        };
    }
    
    const thicknessValue = props.librarySettings.borderThickness || 2;
    const thickness = `${thicknessValue}px`;
    return {
        border: `${thickness} ${statusInfo.value.borderStyle || 'solid'} ${statusInfo.value.borderColor}`,
        '--border-thickness': thickness
    };
});

const useAnimatedPulse = computed(() => {
    return props.librarySettings.animatedBorders && props.entry.status === 'Reading';
});

const isStale = computed(() => {
    if (props.librarySettings.smartInactivity && props.entry.status === "Reading" && props.entry.lastRead) {
        const diff = Date.now() - props.entry.lastRead;
        const days = diff / (1000 * 60 * 60 * 24);
        return days > 30;
    }
    return false;
});

const coverUrl = computed(() => {
    if (props.entry.anilistData?.coverImage?.large || props.entry.anilistData?.coverImage?.medium) {
        return props.entry.anilistData.coverImage.large || props.entry.anilistData.coverImage.medium;
    }
    return FALLBACK_COVER;
});



const showProgressBar = computed(() => {
    return props.librarySettings.showProgressBar && 
           props.entry.anilistData?.chapters && 
           props.entry.readChapters;
});

const progressPercentage = computed(() => {
    if (!showProgressBar.value) return 0;
    const total = props.entry.anilistData.chapters;
    const read = parseInt(props.entry.readChapters) || 0;
    return Math.min(100, Math.round((read / total) * 100));
});

const displayTitle = computed(() => {
    return props.entry.anilistData?.title?.english || 
           props.entry.anilistData?.title?.romaji || 
           props.entry.title;
});

const formatName = computed(() => {
    if (!props.entry.anilistData) return null;
    return getFormatName(props.entry.anilistData.format, props.entry.anilistData.countryOfOrigin);
});

const demographic = computed(() => {
    const tags = props.entry.anilistData?.tags;
    if (!tags || !Array.isArray(tags)) return null;
    
    const tagNames = tags.map(t => t.name.toLowerCase());
    if (tagNames.includes('seinen')) return 'Seinen';
    if (tagNames.includes('josei')) return 'Josei';
    if (tagNames.includes('shounen')) return 'Shonen';
    if (tagNames.includes('shoujo')) return 'Shoujo';
    return null;
});
</script>

<style scoped>
/* Scoped styles for the pulse color property */
.reading-pulse {
    position: relative;
    --pulse-color: v-bind('statusInfo.borderColor');
}
</style>
