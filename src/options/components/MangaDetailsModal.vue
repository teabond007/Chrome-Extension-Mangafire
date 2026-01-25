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
                            <div class="modal-meta-row" id="modalHistoryRow">
                                <span class="modal-meta-label">History</span>
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
                        </div>
                    </div>
                    <div class="modal-main">
                        <h2 id="modalTitle">{{ ani?.title?.english || ani?.title?.romaji || currentEntry.title }}</h2>
                        
                        <div id="modalSynonyms" class="modal-synonyms">
                            <span v-for="s in ani?.synonyms?.slice(0, 5)" :key="s" class="modal-synonym-item">
                                {{ s }}
                            </span>
                        </div>
                        
                        <div id="modalGenres" class="modal-genres">
                            <span v-for="g in ani?.genres" :key="g" class="modal-genre-tag">{{ g }}</span>
                        </div>
                        
                        <div id="modalTags" class="modal-tags">
                            <span v-for="t in ani?.tags?.slice(0, 10)" :key="t.name" class="modal-tag">{{ t.name }}</span>
                        </div>

                        <!-- Personal Data Section -->
                        <div class="modal-personal-section" id="modalPersonalSection">
                            <h4>📝 Your Data</h4>
                            
                            <!-- Rating -->
                            <div class="modal-personal-row">
                                <span class="modal-personal-label">Rating</span>
                                <div class="modal-personal-content">
                                    <div class="star-rating-container">
                                        <span v-for="i in 5" :key="i" class="star-rating-star"
                                            :class="getStarClass(i)"
                                            @click="saveRating(i * 2)"
                                            @mouseenter="hoverRating = i * 2"
                                            @mouseleave="hoverRating = 0"
                                        >
                                            {{ getStarChar(i) }}
                                        </span>
                                        <span class="star-rating-value">
                                            {{ personalData.rating > 0 ? (personalData.rating + '/10') : '' }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Tags -->
                            <div class="modal-personal-row">
                                <span class="modal-personal-label">Tags</span>
                                <div class="modal-personal-content">
                                    <div class="tag-input-container">
                                        <div class="tag-list">
                                            <span v-for="tag in personalData.tags" :key="tag" class="tag-pill">
                                                <span class="tag-pill-text">{{ tag }}</span>
                                                <button class="tag-pill-remove" @click="removeTag(tag)">&times;</button>
                                            </span>
                                        </div>
                                        <div class="tag-input-wrapper">
                                            <input type="text" v-model="tagInputValue" class="tag-input" 
                                                placeholder="Add tag..." @keydown.enter="addTag">
                                            <div v-if="filteredSuggestions.length > 0" class="tag-suggestions">
                                                <div v-for="match in filteredSuggestions" :key="match" 
                                                    class="tag-suggestion-item" @click="addTagFromSuggestion(match)">
                                                    {{ match }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Notes -->
                            <div class="modal-personal-row">
                                <span class="modal-personal-label">Notes</span>
                                <div class="modal-personal-content">
                                    <div class="notes-editor-container">
                                        <textarea v-model="personalData.notes" class="notes-textarea" 
                                            placeholder="Add personal notes..." rows="3" @blur="saveNotes"></textarea>
                                        <span class="notes-char-count">{{ (personalData.notes?.length || 0) }}/500</span>
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
import { getFormatName, getStatusInfo } from '../scripts/ui/manga-card-factory.js';
import * as LibFeatures from '../../scripts/core/library-features.js';
import { animateModalEntry, playSuccessAnimation } from '../scripts/ui/anime-utils.js';

// State
const isOpen = ref(false);
const currentEntry = ref({});
const ani = computed(() => currentEntry.value.anilistData);
const showChapters = ref(false);
const historyChapters = ref([]);
const personalData = ref({ tags: [], notes: '', rating: 0 });
const allUserTags = ref([]);
const tagInputValue = ref('');
const hoverRating = ref(0);
const modalBodyRef = ref(null);

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
    // Mocking customMarkers and global state for getStatusInfo
    // In a real app, this should probably come from a store
    const info = getStatusInfo(currentEntry.value.status, currentEntry.value.customMarker, []);
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

    links.forEach(link => {
        if (!sitesProcessed.has(link.site)) {
            sitesProcessed.set(link.site, []);
        }
        sitesProcessed.get(link.site).push(link);
    });

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

/**
 * Tag suggestions autocomplete
 */
const filteredSuggestions = computed(() => {
    const val = tagInputValue.value.toLowerCase().trim();
    if (!val) return [];
    return allUserTags.value.filter(t => 
        t.toLowerCase().includes(val) && !personalData.value.tags.includes(t)
    ).slice(0, 5);
});

// Methods
const openModal = async (entry) => {
    currentEntry.value = entry;
    showChapters.value = false;
    isOpen.value = true;
    
    // Load data
    loadHistoryChapters();
    personalData.value = await LibFeatures.getPersonalData(entry);
    allUserTags.value = await LibFeatures.loadUserTags();

    // Reset scroll and animate
    setTimeout(() => {
        if (modalBodyRef.value) modalBodyRef.value.scrollTop = 0;
        const content = document.querySelector('#mangaDetailsModal .modal-content');
        if (content) animateModalEntry(content);
    }, 0);
};

const closeModal = () => {
    isOpen.value = false;
};

const toggleChaptersList = () => {
    showChapters.value = !showChapters.value;
};

const loadHistoryChapters = () => {
    if (!chrome.runtime?.id) return;
    chrome.storage.local.get(["savedReadChapters"], (data) => {
        const history = data.savedReadChapters || {};
        const titleLower = currentEntry.value.title.toLowerCase();
        const mangaSlugBase = currentEntry.value.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const explicitSlug = currentEntry.value.mangaSlug ? currentEntry.value.mangaSlug.split('.')[0] : null;

        const historyKey = Object.keys(history).find(key => {
            const kLower = key.toLowerCase();
            const kSlug = kLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (key.startsWith('webtoon:')) {
                const webtoonSlug = key.replace('webtoon:', '').replace(/-/g, ' ').toLowerCase();
                const webtoonSlugNorm = key.replace('webtoon:', '').toLowerCase();
                if (titleLower.includes(webtoonSlug) || mangaSlugBase === webtoonSlugNorm || webtoonSlug.includes(titleLower)) return true;
            }
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
    const mangaSlug = currentEntry.value.mangaSlug?.split('.')[0] || slugify(currentEntry.value.title);

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        const history = data.savedReadChapters || {};
        history[mangaSlug] = allChapters;
        
        chrome.storage.local.set({ savedReadChapters: history }, () => {
            historyChapters.value = allChapters;
            currentEntry.value.readChapters = totalChapters;
            currentEntry.value.lastChapterRead = String(totalChapters);
            currentEntry.value.lastRead = Date.now();
            
            // Save updated entry
            chrome.storage.local.get(['savedEntriesMerged'], (res) => {
                const merged = res.savedEntriesMerged || [];
                const idx = merged.findIndex(e => e.anilistData?.id === ani.value?.id || e.mangaSlug === currentEntry.value.mangaSlug);
                if (idx !== -1) {
                    merged[idx] = { ...currentEntry.value }; // Use spread for reactivity
                    chrome.storage.local.set({ savedEntriesMerged: merged }, () => {
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
    personalData.value.rating = val;
    await LibFeatures.saveRating(currentEntry.value, val);
};

const saveNotes = async () => {
    await LibFeatures.saveNotes(currentEntry.value, personalData.value.notes);
};

const addTag = async () => {
    const val = tagInputValue.value.trim();
    if (val && !personalData.value.tags.includes(val)) {
        personalData.value.tags.push(val);
        await LibFeatures.addTagToManga(currentEntry.value, val);
        allUserTags.value = await LibFeatures.loadUserTags();
    }
    tagInputValue.value = '';
};

const addTagFromSuggestion = (match) => {
    tagInputValue.value = match;
    addTag();
};

const removeTag = async (tag) => {
    personalData.value.tags = personalData.value.tags.filter(t => t !== tag);
    await LibFeatures.removeTagFromManga(currentEntry.value, tag);
};

// Rating display helpers
const getStarClass = (i) => {
    const val = i * 2;
    const rating = hoverRating.value || personalData.value.rating;
    if (rating >= val) return 'full';
    if (rating >= val - 1) return 'half';
    return '';
};

const getStarChar = (i) => {
    const val = i * 2;
    const rating = hoverRating.value || personalData.value.rating;
    return rating >= val - 1 ? '★' : '☆';
};

// Exposure for backward compatibility
onMounted(() => {
    window.showMangaDetails = openModal;
});
</script>

<style scoped>
/* Modal styles - migrated from _modal.css */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

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
}

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
}

.modal-banner::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, var(--bg-card), transparent);
}

.modal-body {
    padding: 30px;
    overflow-y: auto;
    flex: 1;
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
    backdrop-filter: blur(4px);
}

.modal-close:hover {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.1);
}

.modal-layout {
    display: flex;
    gap: 30px;
}

.modal-sidebar {
    width: 220px;
    flex-shrink: 0;
    margin-top: -100px;
    z-index: 5;
}

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
}

.modal-meta-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

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

.modal-score {
    display: flex;
    align-items: center;
    gap: 8px;
}

.score-value {
    color: var(--warning, #FFB547);
    font-weight: 700;
    font-size: 18px;
}

.modal-main {
    flex: 1;
}

.modal-main h2 {
    font-size: 32px;
    margin-bottom: 15px;
    line-height: 1.2;
    font-weight: 800;
}

.modal-genres {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 25px;
}

.modal-genre-tag {
    background: rgba(67, 24, 255, 0.08);
    color: var(--accent-primary);
    padding: 5px 14px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
}

.modal-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 25px;
}

.modal-tag {
    font-size: 11px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
    padding: 3px 8px;
    border-radius: 4px;
}

.modal-description {
    margin-bottom: 30px;
}

.modal-description h3 {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--text-primary);
    border-bottom: 2px solid var(--accent-primary);
    width: fit-content;
    padding-bottom: 4px;
}

.modal-description p {
    font-size: 15px;
    color: var(--text-secondary);
    line-height: 1.7;
}

.modal-external-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
}

.external-link-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 100px;
    color: var(--text-primary);
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
}

.external-link-btn:hover {
    border-color: var(--accent-primary);
    background: rgba(67, 24, 255, 0.05);
}

.modal-synonyms {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 12px;
    font-style: italic;
    line-height: 1.4;
}

.modal-synonym-item::after {
    content: " • ";
}

.modal-synonym-item:last-child::after {
    content: "";
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
}

.chapter-pill {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 2px 8px;
    border-radius: 4px;
    color: var(--text-secondary);
}

.modal-history-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* Personal Data Section */
.modal-personal-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
}

.modal-personal-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 1rem;
}

.modal-personal-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
}

.star-rating-container {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.star-rating-star {
    cursor: pointer;
    font-size: 1.25rem;
    transition: transform 0.1s;
}

.star-rating-star:hover {
    transform: scale(1.2);
}

.star-rating-star.full {
    color: #ffc107;
}

.star-rating-value {
    margin-left: 8px;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.tag-input-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--accent-primary, #7551FF);
    color: #fff;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
}

.tag-pill-remove {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
}

.tag-input-wrapper {
    position: relative;
}

.tag-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--input-bg);
    color: var(--text-primary);
}

.tag-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    z-index: 10;
    max-height: 150px;
    overflow-y: auto;
}

.tag-suggestion-item {
    padding: 8px 10px;
    cursor: pointer;
}

.tag-suggestion-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.notes-editor-container {
    position: relative;
}

.notes-textarea {
    width: 100%;
    resize: vertical;
    min-height: 60px;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--input-bg);
    color: var(--text-primary);
}

.notes-char-count {
    position: absolute;
    bottom: 4px;
    right: 8px;
    font-size: 0.7rem;
    color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 800px) {
    .modal-layout {
        flex-direction: column;
    }

    .modal-sidebar {
        width: 100%;
        margin-top: -60px;
        display: flex;
        gap: 20px;
        align-items: flex-start;
    }

    .modal-cover {
        width: 140px;
    }

    .modal-sidebar-info {
        flex: 1;
        flex-direction: row;
        flex-wrap: wrap;
    }
}
</style>
