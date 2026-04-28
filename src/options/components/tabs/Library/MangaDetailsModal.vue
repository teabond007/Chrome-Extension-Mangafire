<template>
    <div v-if="isOpen" id="mangaDetailsModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content fade-in">
            <div v-if="bannerUrl" class="modal-ambient-glow" :style="ambientGlowStyle"></div>
            <button class="modal-close" id="closeMangaDetails" @click="closeModal">&times;</button>
            <div v-if="bannerUrl" id="modalBanner" class="modal-banner" :style="bannerStyle"></div>
            <div class="modal-body" ref="modalBodyRef">
                <div class="modal-layout">
                    <div class="modal-sidebar">
                        <img id="modalCover" :src="coverUrl" alt="Cover" class="modal-cover">
                        <div class="modal-sidebar-info">
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Status</span>
                                <div id="modalStatusBadge" class="manga-card-status" :style="statusStyle">
                                    {{ currentEntry.status }}
                                </div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Format</span>
                                <div id="modalFormatBadge" class="format-badge">{{ formatName }}</div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Popularity</span>
                                <div class="modal-meta-value" id="modalPopularity">
                                    {{ ani?.popularity?.toLocaleString() || '-' }}
                                </div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Average Score</span>
                                <div class="modal-score">
                                    <span class="score-value" id="modalScoreValue">
                                        {{ ani?.averageScore ? ani.averageScore + '%' : '-' }}
                                    </span>
                                </div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Released</span>
                                <div class="modal-meta-value" id="modalReleased">{{ releasedDate }}</div>
                            </div>
                        </div>
                        <!-- Separate History Section -->
                        <div class="modal-sidebar-info modal-sidebar-history" id="modalHistoryRow">
                            <span class="modal-meta-label">Reading History</span>
                            <div class="modal-history-actions">
                                <button class="btn btn-ghost btn-sm" @click="toggleChaptersList"
                                    style="padding: 2px 8px; font-size: 11px;">
                                    {{ showChapters ? 'Hide Chapters' : 'Show Chapters' }}
                                </button>
                                <button class="btn btn-primary btn-sm" @click="handleMarkAllRead"
                                    style="padding: 2px 8px; font-size: 11px;"
                                    title="Mark all chapters as read up to total">✓ Mark All Read</button>
                            </div>
                            <div v-if="showChapters" id="modalReadChaptersList" class="modal-chapters-list">
                                <span v-for="ch in sortedChapters" :key="ch" class="chapter-pill">{{ ch }}</span>
                                <span v-if="sortedChapters.length === 0" style="color: var(--text-secondary); font-style: italic;">
                                    No history found
                                </span>
                            </div>
                        </div>
                        <!-- Remove Manga -->
                        <button class="btn btn-danger btn-sm btn-remove-manga" @click="handleRemoveManga">
                            🗑️ Remove Manga
                        </button>
                    </div>
                    <div class="modal-main">
                        <h2 id="modalTitle">{{ ani?.title?.english || ani?.title?.romaji || currentEntry.title }}</h2>
                        
                        <div id="modalSynonyms" class="modal-synonyms">
                            <span v-for="s in Array.isArray(ani?.synonyms) ? ani.synonyms.slice(0, 5) : []" :key="s" class="modal-synonym-item">
                                {{ s }}
                            </span>
                        </div>
                        
                        <div id="modalGenres" class="modal-genres">
                            <span v-for="g in Array.isArray(ani?.genres) ? ani.genres : []" :key="g" class="modal-genre-tag">{{ g }}</span>
                        </div>
                        
                        <div id="modalTags" class="modal-tags">
                            <span v-for="t in Array.isArray(ani?.tags) ? ani.tags.slice(0, 10) : []" :key="t.name" class="modal-tag">{{ t.name }}</span>
                        </div>
 
                        <!-- Personal Data Section -->
                        <div class="modal-personal-section" id="modalPersonalSection">
                            <div class="personal-section-grid">
                                <!-- Left Column: Header + Rating -->
                                <div class="personal-left">
                                    <h4>📝 Your Data</h4>
                                    
                                    <!-- Rating -->
                                    <div class="modal-personal-row">
                                        <span class="modal-personal-label">Rating</span>
                                        <div class="modal-personal-content">
                                            <StarRating 
                                                v-model="personalData.rating" 
                                                @change="saveRating" 
                                            />
                                        </div>
                                    </div>
                                </div>
 
                                <!-- Right Column: Notes -->
                                <div class="personal-right">
                                    <!-- Notes -->
                                    <div class="modal-personal-row">
                                        <span class="modal-personal-label">Notes</span>
                                        <div class="modal-personal-content">
                                            <NotesEditor 
                                                v-model="personalData.notes" 
                                                @save="saveNotes"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
 
                        <div class="modal-description">
                            <h3>Synopsis</h3>
                            <p id="modalDescriptionText" v-html="ani?.description || 'No description available.'"></p>
                        </div>
 
                        <div id="modalExternalLinks" class="modal-external-links">
                            <a v-if="ani?.siteUrl" class="external-link-btn primary" :href="ani.siteUrl" target="_blank">
                                <span>AniList</span>
                            </a>
                            <a v-for="link in filteredLinks" :key="link.url" class="external-link-btn" 
                                :href="link.url" target="_blank">
                                {{ link.site }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
 
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getFormatName, getStatusInfo } from '../../../scripts/ui/manga-card-utils.js';
import * as LibraryService from '../../../../scripts/core/library-service.ts';
import { useLibraryStore } from '../../../scripts/store/library.store.js';
import anime from 'animejs';
import { DATA, LIBRARY_ENTRY_KEYS } from '../../../../config.js';

// Shared Components
import StarRating from './StarRating.vue';
import NotesEditor from './NotesEditor.vue';
 
const libraryStore = useLibraryStore();
 
// State
const isOpen = ref(false);
const currentEntry = ref({});
const ani = computed(() => currentEntry.value.anilistData);
const showChapters = ref(false);
const historyChapters = ref([]);
const personalData = ref({ notes: '', rating: 0 });
const modalBodyRef = ref(null);

// React to global selection
watch(() => libraryStore.selectedEntry, (newEntry) => {
    if (newEntry) {
        openModal(newEntry);
    }
}, { immediate: true });
 
/**
 * Normalizes format name
 */
const formatName = computed(() => {
    if (!ani.value) return 'Manga';
    return getFormatName(ani.value.format, ani.value.countryOfOrigin);
});
 
/**
 * Resolved status styles
 */
const statusStyle = computed(() => {
    if (!currentEntry.value.status) return {};
    const info = getStatusInfo(currentEntry.value.status, currentEntry.value.customStatus, []);
    return {
        backgroundColor: info.badgeBg,
        color: info.badgeText
    };
});
 
/**
 * Banner image with fallbacks
 */
const bannerUrl = computed(() => {
    if (!ani.value) return null;
    return ani.value.bannerImage || ani.value.coverImage?.extraLarge || ani.value.coverImage?.large;
});
 
const bannerStyle = computed(() => {
    if (!bannerUrl.value) return {};
    return {
        backgroundImage: `url('${bannerUrl.value}')`,
        display: 'block',
        filter: ani.value?.bannerImage ? 'none' : 'blur(4px) brightness(0.7)'
    };
});
 
/**
 * Ambient glow style
 */
const ambientGlowStyle = computed(() => {
    if (!bannerUrl.value) return {};
    return {
        backgroundImage: `url('${bannerUrl.value}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(100px) saturate(2.5) brightness(0.7) opacity(0.35)',
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '120%',
        height: '120%',
        zIndex: '-1',
        pointerEvents: 'none',
        transform: 'translate3d(0, 0, 0)'
    };
});
 
/**
 * Cover image with fallback
 */
const coverUrl = computed(() => {
    if (!ani.value) return 'https://mangadex.org/img/avatar.png';
    return ani.value.coverImage?.large || ani.value.coverImage?.medium || 'https://mangadex.org/img/avatar.png';
});
 
/**
 * Formatted release date
 */
const releasedDate = computed(() => {
    if (!ani.value?.startDate?.year) return 'Unknown';
    const d = ani.value.startDate;
    return `${d.year}${d.month ? '-' + d.month : ''}${d.day ? '-' + d.day : ''}`;
});
 
/**
 * Filtered external links (prioritizing English)
 */
const filteredLinks = computed(() => {
    if (!ani.value?.externalLinks) return [];
    const links = ani.value.externalLinks;
    const sitesProcessed = new Map();
    
    if (Array.isArray(links)) {
        links.forEach(link => {
            if (!sitesProcessed.has(link.site)) {
                sitesProcessed.set(link.site, []);
            }
            sitesProcessed.get(link.site).push(link);
        });
    }
 
    const result = [];
    sitesProcessed.forEach((linksList) => {
        if (linksList.length > 1) {
            const englishLink = linksList.find(l => {
                const lang = (l.language || "").toLowerCase();
                const url = (l.url || "").toLowerCase();
                return lang === "english" || url.includes("/en/") || url.includes("/english") || url.includes("language=en");
            });
            result.push(englishLink || linksList[0]);
        } else {
            result.push(linksList[0]);
        }
    });
    return result;
});
 
/**
 * Sorted chapter history
 */
const sortedChapters = computed(() => {
    return [...historyChapters.value].sort((a, b) => {
        const numA = parseFloat(a.replace(/[^\d.]/g, '')) || 0;
        const numB = parseFloat(b.replace(/[^\d.]/g, '')) || 0;
        return numB - numA;
    });
});
 
// Animation Helpers
const animateModalEntry = (modalContent) => {
    if (typeof anime === 'undefined') return;
    anime.set(modalContent, { scale: 0.8, opacity: 0, rotateX: 10 });
    anime({
        targets: modalContent,
        scale: 1,
        opacity: 1,
        rotateX: 0,
        duration: 800,
        easing: 'easeOutElastic(1, .6)'
    });
};
 
const playSuccessAnimation = (targetContainer) => {
    if (typeof anime === 'undefined') return;
    
    const existing = targetContainer.querySelector('.anime-success-checkmark');
    if (existing) existing.remove();
    
    targetContainer.style.position = "relative";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add('anime-success-checkmark');
    svg.setAttribute("width", "40");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 52 52");
    svg.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; pointer-events: none;";
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M14.1 27.2l7.1 7.2 16.7-16.8");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#4CAF50");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    
    svg.appendChild(path);
    targetContainer.appendChild(svg);
    
    anime({
        targets: path,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutQuad',
        duration: 800,
        complete: () => {
            anime({
                targets: svg,
                opacity: 0,
                delay: 1000,
                duration: 500,
                easing: 'linear',
                complete: () => svg.remove()
            });
        }
    });
};
 
// Methods
const openModal = async (entry) => {
    currentEntry.value = entry;
    showChapters.value = false;
    isOpen.value = true;
    
    // Load data
    loadHistoryChapters();
    
    // Use LibraryService for centralized data loading
    const rawData = await LibraryService.loadPersonalData();
    const id = LibraryService.getMangaId(entry);
    personalData.value = rawData[id] || { notes: '', rating: 0 };
 
    // Reset scroll and animate
    setTimeout(() => {
        if (modalBodyRef.value) modalBodyRef.value.scrollTop = 0;
        const content = document.querySelector('#mangaDetailsModal .modal-content');
        if (content) animateModalEntry(content);
    }, 0);
};
 
const closeModal = () => {
    isOpen.value = false;
    libraryStore.selectedEntry = null;
};
 
const toggleChaptersList = () => {
    showChapters.value = !showChapters.value;
};
 
const loadHistoryChapters = () => {
    if (!chrome.runtime?.id) return;
    chrome.storage.local.get([DATA.READING_HISTORY], (data) => {
        const history = data[DATA.READING_HISTORY] || {};
        const titleLower = currentEntry.value.title.toLowerCase();
        const mangaSlugBase = titleLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const explicitSlug = currentEntry.value[LIBRARY_ENTRY_KEYS.MANGA_SLUG] ? currentEntry.value[LIBRARY_ENTRY_KEYS.MANGA_SLUG].split('.')[0] : null;
 
        const historyKey = Object.keys(history).find(key => {
            const kLower = key.toLowerCase();
            const kSlug = kLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return kLower === titleLower || kSlug === mangaSlugBase || (explicitSlug && kSlug === explicitSlug) || (explicitSlug && kLower === explicitSlug);
        });
 
        historyChapters.value = historyKey ? history[historyKey] : [];
    });
};
 
const handleMarkAllRead = async () => {
    const totalChapters = ani.value?.chapters;
    if (!totalChapters || totalChapters <= 0) {
        alert('Unable to mark all as read: Total chapter count is unknown.');
        return;
    }
 
    if (!confirm(`Mark all ${totalChapters} chapters as read?`)) return;
 
    const allChapters = Array.from({ length: totalChapters }, (_, i) => String(i + 1));
    const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const mangaSlug = currentEntry.value[LIBRARY_ENTRY_KEYS.MANGA_SLUG]?.split('.')[0] || slugify(currentEntry.value.title);
 
    chrome.storage.local.get([DATA.READING_HISTORY], (data) => {
        const history = data[DATA.READING_HISTORY] || {};
        history[mangaSlug] = allChapters;
        
        chrome.storage.local.set({ [DATA.READING_HISTORY]: history }, () => {
            historyChapters.value = allChapters;
            currentEntry.value.readChapters = totalChapters;
            currentEntry.value[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER] = String(totalChapters);
            currentEntry.value[LIBRARY_ENTRY_KEYS.LAST_READ] = Date.now();
            
            // Save updated entry
            chrome.storage.local.get([DATA.LIBRARY_ENTRIES], (res) => {
                const raw = res[DATA.LIBRARY_ENTRIES];
                const merged = Array.isArray(raw) ? raw : [];
                const idx = merged.findIndex(e => e.anilistData?.id === ani.value?.id || e[LIBRARY_ENTRY_KEYS.MANGA_SLUG] === currentEntry.value[LIBRARY_ENTRY_KEYS.MANGA_SLUG]);
                if (idx !== -1) {
                    merged[idx] = { ...currentEntry.value }; // Use spread for reactivity
                    chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: merged }, () => {
                        // Notify Vue tab that data has changed
                        if (window.refreshLibraryData) window.refreshLibraryData();
                    });
                }
            });
            
            const btn = document.querySelector('.btn-primary.btn-sm');
            if (btn) playSuccessAnimation(btn);
        });
    });
};
 
// Personal Data Methods
const saveRating = async (val) => {
    await LibraryService.saveRating(currentEntry.value, val);
};

const saveNotes = async (val) => {
    personalData.value.notes = val;
    await LibraryService.saveNotes(currentEntry.value, val);
};

/**
 * Confirms and removes the current manga entry from the library
 */
const handleRemoveManga = async () => {
    const title = ani.value?.title?.english || ani.value?.title?.romaji || currentEntry.value.title;
    if (!confirm(`Remove "${title}" from your library?`)) return;
 
    console.log('[MangaDetailsModal] Requesting removal for:', currentEntry.value);
    await libraryStore.removeEntry(currentEntry.value);
    closeModal();
};
 
// Exposure for backward compatibility
onMounted(() => {
    window.showMangaDetails = (entry) => {
        libraryStore.selectedEntry = entry;
    };
});
</script>
 
<style scoped lang="scss">
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
 
    .modal-content {
        background: var(--bg-card);
        border-radius: var(--radius-lg, 16px);
        width: 90%;
        max-width: 1000px;
        max-height: 90vh;
        position: relative;
        padding: 0;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        overflow: hidden;
        display: flex;
        flex-direction: column;
 
        .modal-ambient-glow {
            position: absolute;
            inset: 0;
            overflow: hidden;
            z-index: 0;
            pointer-events: none;
        }
 
        .modal-banner {
            width: 100%;
            height: 200px;
            background-size: cover;
            background-position: center;
            flex-shrink: 0;
            position: relative;
 
            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 100px;
                background: linear-gradient(to top, var(--bg-card), transparent);
            }
        }
 
        .modal-body {
            padding: 30px;
            overflow-y: auto;
            flex: 1;
 
            .modal-layout {
                display: flex;
                gap: 30px;
 
                .modal-sidebar {
                    width: 220px;
                    flex-shrink: 0;
                    margin-top: -100px;
                    z-index: 5;
 
                    .modal-cover {
                        width: 100%;
                        border-radius: var(--radius-md, 8px);
                        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
                        margin-bottom: 20px;
                        border: 4px solid var(--bg-card);
                    }
 
                    .modal-sidebar-info {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                        background: rgba(255, 255, 255, 0.03);
                        padding: 15px;
                        border-radius: var(--radius-md, 8px);
 
                        &.modal-sidebar-history {
                            margin-top: 12px;
                            gap: 10px;
 
                            .modal-history-actions {
                                display: flex;
                                gap: 8px;
                                flex-wrap: wrap;
                            }
 
                            .modal-chapters-list {
                                margin-top: 10px;
                                padding: 10px;
                                background: rgba(255, 255, 255, 0.05);
                                border-radius: var(--radius-sm, 6px);
                                max-height: 150px;
                                overflow-y: auto;
                                font-size: 12px;
                                display: flex;
                                flex-wrap: wrap;
                                gap: 6px;
 
                                .chapter-pill {
                                    background: var(--bg-card);
                                    border: 1px solid var(--border-color);
                                    padding: 2px 8px;
                                    border-radius: 4px;
                                    color: var(--text-secondary);
                                }
                            }
                        }
 
                        .modal-meta-row {
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
 
                            .modal-meta-label {
                                font-size: 11px;
                                font-weight: 700;
                                color: var(--text-secondary);
                                text-transform: uppercase;
                            }
 
                            .modal-meta-value {
                                font-size: 14px;
                                color: var(--text-primary);
                            }
 
                            .format-badge {
                                width: fit-content;
                                padding: 4px 10px;
                                background: rgba(255, 255, 255, 0.08);
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 600;
                                color: var(--text-primary);
                            }
 
                            .modal-score {
                                display: flex;
                                align-items: center;
                                gap: 8px;
 
                                .score-value {
                                    color: var(--warning, #FFB547);
                                    font-weight: 700;
                                    font-size: 18px;
                                }
                            }
                        }
                    }
 
                    .btn-remove-manga {
                        width: 100%;
                        margin-top: 12px;
                        justify-content: center;
                        background: rgba(220, 53, 69, 0.1);
                        color: #dc3545;
                        border: 1px solid rgba(220, 53, 69, 0.25);
                        transition: all 0.2s ease;
 
                        &:hover {
                            background: rgba(220, 53, 69, 0.2);
                            border-color: #dc3545;
                        }
                    }
                }
 
                .modal-main {
                    flex: 1;
 
                    h2 {
                        font-size: 32px;
                        margin-bottom: 15px;
                        line-height: 1.2;
                        font-weight: 800;
                    }
 
                    .modal-synonyms {
                        font-size: 13px;
                        color: var(--text-secondary);
                        margin-bottom: 12px;
                        font-style: italic;
                        line-height: 1.4;
 
                        .modal-synonym-item::after { content: " • "; }
                        .modal-synonym-item:last-child::after { content: ""; }
                    }
 
                    .modal-genres {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-bottom: 25px;
 
                        .modal-genre-tag {
                            background: rgba(var(--accent-primary-rgb), 0.1);
                            color: var(--accent-primary);
                            padding: 5px 14px;
                            border-radius: 100px;
                            font-size: 12px;
                            font-weight: 700;
                            border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
                            transition: all 0.2s ease;
                            cursor: default;
 
                            &:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 12px rgba(67, 24, 255, 0.25);
                                border-color: var(--accent-primary);
                                background: rgba(67, 24, 255, 0.15);
                            }
                        }
                    }
 
                    .modal-tags {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        margin-bottom: 25px;
 
                        .modal-tag {
                            font-size: 11px;
                            color: var(--text-secondary);
                            background: rgba(255, 255, 255, 0.05);
                            padding: 3px 8px;
                            border-radius: 4px;
                            border: 1px solid transparent;
                            transition: all 0.2s ease;
                            cursor: default;
 
                            &:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 3px 8px rgba(255, 255, 255, 0.1);
                                border-color: var(--border-color);
                                background: rgba(255, 255, 255, 0.1);
                                color: var(--text-primary);
                            }
                        }
                    }
 
                    .modal-personal-section {
                        margin-top: 1.5rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 8px;
 
                        .personal-section-grid {
                            display: grid;
                            grid-template-columns: auto 1fr;
                            gap: 1.5rem;
 
                            .personal-left {
                                display: flex;
                                flex-direction: column;
                                gap: 0.75rem;
                                min-width: 180px;
 
                                h4 { margin: 0; }
                            }
 
                            .personal-right {
                                display: flex;
                                flex-direction: column;
                                gap: 0.75rem;
                            }
 
                            .modal-personal-row {
                                display: flex;
                                flex-direction: column;
                                gap: 8px;
 
                                .modal-personal-label {
                                    font-size: 11px;
                                    font-weight: 700;
                                    color: var(--text-secondary);
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                }
                            }
                        }
                    }
 
                    .modal-description {
                        margin-bottom: 30px;
                        margin-top: 20px;
 
                        h3 {
                            font-size: 18px;
                            font-weight: 700;
                            margin-bottom: 10px;
                            color: var(--text-primary);
                            border-bottom: 2px solid var(--accent-primary);
                            width: fit-content;
                            padding-bottom: 4px;
                        }
 
                        p {
                            font-size: 15px;
                            color: var(--text-secondary);
                            line-height: 1.7;
                        }
                    }
 
                    .modal-external-links {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 12px;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid var(--border-color);
 
                        .external-link-btn {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px 16px;
                            background: var(--input-bg);
                            border: 1px solid var(--border-color);
                            border-radius: 100px;
                            color: var(--text-primary);
                            text-decoration: none;
                            font-size: 13px;
                            font-weight: 600;
                            transition: all 0.2s;
 
                            &:hover {
                                border-color: var(--accent-primary);
                                background: rgba(67, 24, 255, 0.05);
                            }
                        }
                    }
                }
            }
        }
 
        .modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.3);
            border: none;
            font-size: 24px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            line-height: 1;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
 
            &:hover {
                background: rgba(0, 0, 0, 0.5);
                transform: scale(1.1);
            }
        }
    }
}
 
/* Responsive */
@media (max-width: 800px) {
    .modal-overlay .modal-content .modal-body {
        .modal-layout {
            flex-direction: column;
 
            .modal-sidebar {
                width: 100%;
                margin-top: -60px;
                display: flex;
                gap: 20px;
                align-items: flex-start;
 
                .modal-cover { width: 140px; }
 
                .modal-sidebar-info {
                    flex: 1;
                    flex-direction: row;
                    flex-wrap: wrap;
                }
            }
        }
    }
}
</style>
