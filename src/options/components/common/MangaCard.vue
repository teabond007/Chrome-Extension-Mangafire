<template>
    <div 
        class="manga-card" 
        :class="{ 
            'glow-effect': useGlow, 
            'has-custom-status': !!entry.customStatus,
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
            
            <!-- Corner Ribbon (Optional) -->
            <div v-if="entry.status && librarySettings.showRibbons" 
                 class="manga-card-ribbon" 
                 :style="{ '--status-color': statusInfo.borderColor }">
                {{ entry.status }}
            </div>

            <div v-if="personalData.rating > 0" class="manga-card-personal-rating">
                {{ personalData.rating }}
            </div>



            <div class="manga-card-actions">
                <a 
                    v-if="entry.lastReaderUrl && (entry.lastChapterRead || entry.lastChapterRead === 0)" 
                    :href="entry.lastReaderUrl" 
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

                    <div v-if="librarySettings.showReadingBadges" class="info-item">
                        <template v-if="entry.anilistData.chapters">
                            <span class="info-label">Read:</span>{{ entry.readChapters || 'ch.???' }} / 
                            <span class="info-label">Total:</span>{{ entry.anilistData.chapters }}
                        </template>
                        <template v-else>
                            <span class="info-label">Read:</span>{{ entry.readChapters || 'ch.???' }} 
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
import { computed, ref, onMounted } from 'vue';
import { getStatusInfo, getFormatName, getDemographic } from '../../scripts/ui/manga-card-utils.js';
import { BORDER_DEFAULTS, DEFAULT_STATUS } from '../../../config.js';
import * as LibraryService from '../../../scripts/core/library-service.ts';

// Fallback placeholder - base64 encoded or remote fallback
const FALLBACK_COVER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY2NiI+PHBhdGggZD0iTTIxIDR2MTJIMy4wMVYySDFWMTZoMjBWNGgtMlptLTEuOTEgMTMuNUw0IDE4djJoMTIuMTdsLjg0LS44NCAxLjA4IDEuNi42Ni0uMjItLjk3LTEuNDNjLjEyLS4xNi4yMi0uMzUuMzEtLjU1eiIvPjwvc3ZnPg==';

const props = defineProps({
    entry: {
        type: Object,
        required: true
    },
    customStatuses: {
        type: Array,
        default: () => []
    },
    personalData: {
        type: Object,
        default: () => ({ rating: 0, notes: '' })
    },
    librarySettings: {
        type: Object,
        default: () => ({
            bordersEnabled: true,
            borderThickness: BORDER_DEFAULTS.size,
            useGlowEffect: false,
            showReadingBadges: true,
            showRibbons: true,
            smartInactivity: false
        })
    }
});

defineEmits(['click', 'status-click']);

const statusInfo = computed(() => {
    return getStatusInfo(props.entry.status, props.entry.customStatus, props.customStatuses);
});

const useGlow = computed(() => props.librarySettings.bordersEnabled && props.librarySettings.useGlowEffect);

const cardStyle = computed(() => {
    if (!props.librarySettings.bordersEnabled) return { border: 'none' };
    
    if (useGlow.value) {
        const t = props.librarySettings.borderThickness || BORDER_DEFAULTS.size;
        return { 
            '--glow-color': `${statusInfo.value.borderColor}80`,
            '--glow-spread-1': `${t * 2.5}px`,
            '--glow-spread-2': `${t * 5}px`,
            '--glow-spread-3': `${t * 8}px`,
            border: 'none'
        };
    }
    
    const thicknessValue = props.librarySettings.borderThickness || BORDER_DEFAULTS.size;
    const thickness = `${thicknessValue}px`;
    return {
        border: `${thickness} ${statusInfo.value.borderStyle || BORDER_DEFAULTS.style} ${statusInfo.value.borderColor}`,
        '--border-thickness': thickness
    };
});



const isStale = computed(() => {
    if (props.librarySettings.smartInactivity && props.entry.status === DEFAULT_STATUS && props.entry.lastRead) {
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
    return getDemographic(props.entry.anilistData?.tags);
});
</script>

<style scoped lang="scss">
.manga-card {
    background: var(--bg-card);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .dark-mode & {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

        &:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

        .manga-card-actions {
            opacity: 1;
        }
    }

    /* Smart Inactivity Dimming */
    &.stale-entry {
        opacity: 0.6;
        filter: grayscale(0.8);
        transition: all 0.3s ease;

        &:hover {
            opacity: 1;
            filter: grayscale(0);
        }
    }

    /* Custom Status Border */
    &.has-custom-status {
        border: 3px solid transparent;
        background-clip: padding-box;
    }

    /* Card Cover */
    &-cover {
        width: 100%;
        padding-top: 140%; /* 5:7 aspect ratio */
        background-size: cover;
        background-position: center;
        position: relative;
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
        overflow: hidden;
    }

    /* Card Body */
    &-body {
        padding: 12px;
        background: var(--bg-card);
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
    }

    &-title {
        font-size: 13px;
        font-weight: 600;
        margin: 0 0 6px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.3;
        min-height: 34px;
        color: var(--text-primary);
    }

    &-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
        color: var(--text-secondary);
    }

    &-info {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
    }

    /* Card Actions (on hover) */
    &-actions {
        position: absolute;
        bottom: -1px;
        left: -1px;
        right: -1px;
        width: calc(100% + 2px);
        background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
        padding: 40px 12px 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
        display: flex;
        gap: 8px;
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
    }
}

/* Status Dot Indicator */
.card-status-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.ongoing-tag {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9px;
    margin-left: 4px;
}

.card-action {
    &-btn {
        flex: 1;
        padding: 6px 12px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.9);
        color: #1E222D;
        font-size: 11px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: white;
            transform: scale(1.05);
        }
    }

    &-continue {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        text-decoration: none;
        flex: 1.5;

        &:hover {
            background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
            color: white;
        }
    }
}

/* Visual Enhancements */

/* Glow effect alternative to borders */
.glow-effect {
    border: none !important;
    box-shadow: 
        0 0 var(--glow-spread-1, 10px) var(--glow-color, rgba(76, 175, 80, 0.4)),
        0 0 var(--glow-spread-2, 20px) var(--glow-color, rgba(76, 175, 80, 0.2)),
        0 0 var(--glow-spread-3, 35px) var(--glow-color, rgba(76, 175, 80, 0.1)),
        inset 0 0 15px rgba(255, 255, 255, 0.05) !important;
    
    &:hover {
        box-shadow: 
            0 0 calc(var(--glow-spread-1, 10px) * 1.5) var(--glow-color, rgba(76, 175, 80, 0.6)),
            0 0 calc(var(--glow-spread-2, 20px) * 1.5) var(--glow-color, rgba(76, 175, 80, 0.4)),
            0 0 calc(var(--glow-spread-3, 35px) * 1.5) var(--glow-color, rgba(76, 175, 80, 0.2)),
            inset 0 0 15px rgba(255, 255, 255, 0.1) !important;
    }
}

/* Corner ribbon status */
.manga-card-ribbon {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--status-color, var(--primary));
    color: white;
    font-size: 9px;
    font-weight: 600;
    padding: 4px 20px 4px 10px;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%);
    z-index: 5;
}





/* Shimmer effect for special cards */
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.shimmer-border::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite;
    border-radius: inherit;
    z-index: -1;
}

/* Personal Rating on Cards */
.manga-card-personal-rating {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.85);
    color: #FFD700;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 5;

    &::before {
        content: '★';
    }
}
</style>
