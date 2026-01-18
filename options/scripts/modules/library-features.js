/**
 * @fileoverview Enhanced Library Features Module
 * Provides Tags, Notes, Personal Rating, and Filter Presets functionality.
 * Part of Phase 1: Core Enhancements
 */

// Storage key constants
const STORAGE_KEYS = {
    PERSONAL_DATA: 'libraryPersonalData',  // {mangaId: {tags:[], notes:'', rating:0}}
    USER_TAGS: 'libraryUserTags',           // ['tag1', 'tag2', ...]
    FILTER_PRESETS: 'libraryFilterPresets'  // [{name:'', filters:{}}]
};

/**
 * Personal data for a single manga entry
 * @typedef {Object} MangaPersonalData
 * @property {string[]} tags - User-defined tags
 * @property {string} notes - Personal notes
 * @property {number} rating - Personal 1-10 rating (0 = unrated)
 */

/**
 * Gets the unique identifier for a manga entry.
 * Uses AniList ID if available, otherwise falls back to slugified title.
 * @param {Object} entry - Manga entry object
 * @returns {string} Unique identifier
 */
export function getMangaId(entry) {
    if (entry.anilistData?.id) return `anilist:${entry.anilistData.id}`;
    if (entry.mangadexId) return `mangadex:${entry.mangadexId}`;
    return `title:${slugify(entry.title)}`;
}

/**
 * Slugifies a string for use as identifier.
 * @param {string} str - Input string
 * @returns {string} Slugified string
 */
function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Cache for personal data
let personalDataCache = null;
let userTagsCache = null;
let filterPresetsCache = null;

/**
 * Loads all personal data from storage.
 * @returns {Promise<Object>} Personal data keyed by manga ID
 */
export async function loadPersonalData() {
    if (personalDataCache) return personalDataCache;
    
    return new Promise(resolve => {
        chrome.storage.local.get([STORAGE_KEYS.PERSONAL_DATA], data => {
            personalDataCache = data[STORAGE_KEYS.PERSONAL_DATA] || {};
            resolve(personalDataCache);
        });
    });
}

/**
 * Gets personal data for a specific manga.
 * @param {Object} entry - Manga entry
 * @returns {Promise<MangaPersonalData>} Personal data or defaults
 */
export async function getPersonalData(entry) {
    const allData = await loadPersonalData();
    const id = getMangaId(entry);
    return allData[id] || { tags: [], notes: '', rating: 0 };
}

/**
 * Saves personal data for a specific manga.
 * @param {Object} entry - Manga entry
 * @param {Partial<MangaPersonalData>} updates - Data to update
 */
export async function savePersonalData(entry, updates) {
    const allData = await loadPersonalData();
    const id = getMangaId(entry);
    
    allData[id] = {
        ...allData[id] || { tags: [], notes: '', rating: 0 },
        ...updates,
        lastModified: Date.now()
    };
    
    personalDataCache = allData;
    
    return new Promise(resolve => {
        chrome.storage.local.set({ [STORAGE_KEYS.PERSONAL_DATA]: allData }, resolve);
    });
}

// ============ TAGS SYSTEM ============

/**
 * Loads all user-defined tags.
 * @returns {Promise<string[]>} Array of tag names
 */
export async function loadUserTags() {
    if (userTagsCache) return userTagsCache;
    
    return new Promise(resolve => {
        chrome.storage.local.get([STORAGE_KEYS.USER_TAGS], data => {
            userTagsCache = data[STORAGE_KEYS.USER_TAGS] || [];
            resolve(userTagsCache);
        });
    });
}

/**
 * Adds a new user tag globally.
 * @param {string} tagName - Tag to add
 */
export async function addUserTag(tagName) {
    const tags = await loadUserTags();
    const normalizedTag = tagName.trim();
    
    if (!normalizedTag || tags.includes(normalizedTag)) return tags;
    
    tags.push(normalizedTag);
    userTagsCache = tags;
    
    return new Promise(resolve => {
        chrome.storage.local.set({ [STORAGE_KEYS.USER_TAGS]: tags }, () => resolve(tags));
    });
}

/**
 * Removes a user tag globally (and from all manga).
 * @param {string} tagName - Tag to remove
 */
export async function removeUserTag(tagName) {
    let tags = await loadUserTags();
    tags = tags.filter(t => t !== tagName);
    userTagsCache = tags;
    
    // Also remove from all manga personal data
    const allData = await loadPersonalData();
    Object.keys(allData).forEach(id => {
        if (allData[id].tags) {
            allData[id].tags = allData[id].tags.filter(t => t !== tagName);
        }
    });
    personalDataCache = allData;
    
    return new Promise(resolve => {
        chrome.storage.local.set({
            [STORAGE_KEYS.USER_TAGS]: tags,
            [STORAGE_KEYS.PERSONAL_DATA]: allData
        }, () => resolve(tags));
    });
}

/**
 * Adds a tag to a specific manga.
 * @param {Object} entry - Manga entry
 * @param {string} tagName - Tag to add
 */
export async function addTagToManga(entry, tagName) {
    const data = await getPersonalData(entry);
    if (!data.tags.includes(tagName)) {
        data.tags.push(tagName);
        await savePersonalData(entry, { tags: data.tags });
    }
    // Also ensure tag exists globally
    await addUserTag(tagName);
    return data.tags;
}

/**
 * Removes a tag from a specific manga.
 * @param {Object} entry - Manga entry
 * @param {string} tagName - Tag to remove
 */
export async function removeTagFromManga(entry, tagName) {
    const data = await getPersonalData(entry);
    data.tags = data.tags.filter(t => t !== tagName);
    await savePersonalData(entry, { tags: data.tags });
    return data.tags;
}

// ============ NOTES SYSTEM ============

/**
 * Gets notes for a manga.
 * @param {Object} entry - Manga entry
 * @returns {Promise<string>} Notes text
 */
export async function getNotes(entry) {
    const data = await getPersonalData(entry);
    return data.notes || '';
}

/**
 * Saves notes for a manga.
 * @param {Object} entry - Manga entry
 * @param {string} notes - Notes text
 */
export async function saveNotes(entry, notes) {
    await savePersonalData(entry, { notes: notes.trim() });
}

// ============ RATING SYSTEM ============

/**
 * Gets rating for a manga.
 * @param {Object} entry - Manga entry
 * @returns {Promise<number>} Rating 0-10
 */
export async function getRating(entry) {
    const data = await getPersonalData(entry);
    return data.rating || 0;
}

/**
 * Saves rating for a manga.
 * @param {Object} entry - Manga entry
 * @param {number} rating - Rating 1-10 (0 to clear)
 */
export async function saveRating(entry, rating) {
    const value = Math.max(0, Math.min(10, parseInt(rating) || 0));
    await savePersonalData(entry, { rating: value });
    return value;
}

// ============ FILTER PRESETS ============

/**
 * @typedef {Object} FilterPreset
 * @property {string} name - Preset name
 * @property {Object} filters - Filter values
 * @property {string} filters.status
 * @property {string} filters.format
 * @property {string} filters.genre
 * @property {string} filters.demographic
 * @property {string} filters.sort
 * @property {string} filters.search
 */

/**
 * Loads all filter presets.
 * @returns {Promise<FilterPreset[]>}
 */
export async function loadFilterPresets() {
    if (filterPresetsCache) return filterPresetsCache;
    
    return new Promise(resolve => {
        chrome.storage.local.get([STORAGE_KEYS.FILTER_PRESETS], data => {
            filterPresetsCache = data[STORAGE_KEYS.FILTER_PRESETS] || [];
            resolve(filterPresetsCache);
        });
    });
}

/**
 * Saves a new filter preset.
 * @param {string} name - Preset name
 * @param {Object} filters - Current filter values
 */
export async function saveFilterPreset(name, filters) {
    const presets = await loadFilterPresets();
    
    // Check for duplicate name
    const existingIndex = presets.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
        presets[existingIndex] = { name, filters, updatedAt: Date.now() };
    } else {
        presets.push({ name, filters, createdAt: Date.now() });
    }
    
    filterPresetsCache = presets;
    
    return new Promise(resolve => {
        chrome.storage.local.set({ [STORAGE_KEYS.FILTER_PRESETS]: presets }, () => resolve(presets));
    });
}

/**
 * Deletes a filter preset.
 * @param {string} name - Preset name to delete
 */
export async function deleteFilterPreset(name) {
    let presets = await loadFilterPresets();
    presets = presets.filter(p => p.name !== name);
    filterPresetsCache = presets;
    
    return new Promise(resolve => {
        chrome.storage.local.set({ [STORAGE_KEYS.FILTER_PRESETS]: presets }, () => resolve(presets));
    });
}

// ============ UI COMPONENTS ============

/**
 * Creates a star rating component.
 * @param {number} currentRating - Current rating value (0-10)
 * @param {Function} onChange - Callback when rating changes
 * @param {boolean} readonly - If true, rating cannot be changed
 * @returns {HTMLElement} Star rating element
 */
export function createStarRating(currentRating, onChange, readonly = false) {
    const container = document.createElement('div');
    container.className = 'star-rating-container';
    if (readonly) container.classList.add('readonly');
    
    // Create 5 stars (each can be half)
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star-rating-star';
        star.dataset.value = i * 2;
        
        // Full star = rating >= i*2, half star = rating >= i*2-1
        const value = i * 2;
        if (currentRating >= value) {
            star.classList.add('full');
            star.innerHTML = '★';
        } else if (currentRating >= value - 1) {
            star.classList.add('half');
            star.innerHTML = '★'; // CSS will handle half display
        } else {
            star.innerHTML = '☆';
        }
        
        if (!readonly) {
            star.addEventListener('click', () => {
                onChange(value);
            });
            // Add hover effect
            star.addEventListener('mouseenter', () => {
                updateStarPreview(container, value);
            });
        }
        
        container.appendChild(star);
    }
    
    // Show numeric value
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'star-rating-value';
    valueDisplay.textContent = currentRating > 0 ? `${currentRating}/10` : '';
    container.appendChild(valueDisplay);
    
    if (!readonly) {
        container.addEventListener('mouseleave', () => {
            updateStarDisplay(container, currentRating);
        });
    }
    
    return container;
}

/**
 * Updates star display for preview on hover.
 */
function updateStarPreview(container, previewValue) {
    const stars = container.querySelectorAll('.star-rating-star');
    stars.forEach((star, index) => {
        const value = (index + 1) * 2;
        star.classList.remove('full', 'half');
        if (previewValue >= value) {
            star.classList.add('full');
            star.innerHTML = '★';
        } else if (previewValue >= value - 1) {
            star.classList.add('half');
            star.innerHTML = '★';
        } else {
            star.innerHTML = '☆';
        }
    });
}

/**
 * Updates star display to match current rating.
 */
function updateStarDisplay(container, rating) {
    const stars = container.querySelectorAll('.star-rating-star');
    stars.forEach((star, index) => {
        const value = (index + 1) * 2;
        star.classList.remove('full', 'half');
        if (rating >= value) {
            star.classList.add('full');
            star.innerHTML = '★';
        } else if (rating >= value - 1) {
            star.classList.add('half');
            star.innerHTML = '★';
        } else {
            star.innerHTML = '☆';
        }
    });
    const valueDisplay = container.querySelector('.star-rating-value');
    if (valueDisplay) {
        valueDisplay.textContent = rating > 0 ? `${rating}/10` : '';
    }
}

/**
 * Creates a tag input component with autocomplete.
 * @param {string[]} currentTags - Currently assigned tags
 * @param {string[]} availableTags - All available tags for autocomplete
 * @param {Function} onAdd - Callback when tag is added
 * @param {Function} onRemove - Callback when tag is removed
 * @returns {HTMLElement} Tag input element
 */
export function createTagInput(currentTags, availableTags, onAdd, onRemove) {
    const container = document.createElement('div');
    container.className = 'tag-input-container';
    
    // Display current tags
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';
    
    currentTags.forEach(tag => {
        const tagEl = createTagPill(tag, () => {
            onRemove(tag);
            tagEl.remove();
        });
        tagList.appendChild(tagEl);
    });
    container.appendChild(tagList);
    
    // Input for new tags
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'tag-input-wrapper';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-input';
    input.placeholder = 'Add tag...';
    
    const suggestions = document.createElement('div');
    suggestions.className = 'tag-suggestions';
    suggestions.style.display = 'none';
    
    input.addEventListener('input', () => {
        const value = input.value.toLowerCase().trim();
        if (value.length === 0) {
            suggestions.style.display = 'none';
            return;
        }
        
        const matches = availableTags.filter(t => 
            t.toLowerCase().includes(value) && !currentTags.includes(t)
        );
        
        if (matches.length > 0) {
            suggestions.innerHTML = '';
            matches.slice(0, 5).forEach(match => {
                const item = document.createElement('div');
                item.className = 'tag-suggestion-item';
                item.textContent = match;
                item.addEventListener('click', () => {
                    addTag(match);
                });
                suggestions.appendChild(item);
            });
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) addTag(value);
        }
    });
    
    function addTag(tagName) {
        if (tagName && !currentTags.includes(tagName)) {
            currentTags.push(tagName);
            const tagEl = createTagPill(tagName, () => {
                onRemove(tagName);
                tagEl.remove();
                currentTags = currentTags.filter(t => t !== tagName);
            });
            tagList.appendChild(tagEl);
            onAdd(tagName);
        }
        input.value = '';
        suggestions.style.display = 'none';
    }
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(suggestions);
    container.appendChild(inputWrapper);
    
    return container;
}

/**
 * Creates a single tag pill with remove button.
 */
function createTagPill(tagName, onRemove) {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `
        <span class="tag-pill-text">${tagName}</span>
        <button class="tag-pill-remove" title="Remove tag">&times;</button>
    `;
    pill.querySelector('.tag-pill-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove();
    });
    return pill;
}

/**
 * Creates a notes textarea component.
 * @param {string} currentNotes - Current notes text
 * @param {Function} onSave - Callback when notes are saved
 * @returns {HTMLElement} Notes component
 */
export function createNotesEditor(currentNotes, onSave) {
    const container = document.createElement('div');
    container.className = 'notes-editor-container';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'notes-textarea';
    textarea.placeholder = 'Add personal notes...';
    textarea.value = currentNotes;
    textarea.rows = 3;
    
    // Auto-save on blur with debounce
    let saveTimeout;
    textarea.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            onSave(textarea.value);
        }, 500);
    });
    
    textarea.addEventListener('blur', () => {
        clearTimeout(saveTimeout);
        onSave(textarea.value);
    });
    
    container.appendChild(textarea);
    
    const charCount = document.createElement('span');
    charCount.className = 'notes-char-count';
    charCount.textContent = `${currentNotes.length}/500`;
    container.appendChild(charCount);
    
    textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/500`;
    });
    
    return container;
}

// ============ FUZZY SEARCH ============

/**
 * Performs fuzzy search matching.
 * @param {string} needle - Search term
 * @param {string} haystack - Text to search in
 * @returns {boolean} True if fuzzy match found
 */
export function fuzzyMatch(needle, haystack) {
    if (!needle || !haystack) return false;
    
    const needleLower = needle.toLowerCase();
    const haystackLower = haystack.toLowerCase();
    
    // Exact substring match
    if (haystackLower.includes(needleLower)) return true;
    
    // Fuzzy character sequence match
    let needleIndex = 0;
    for (let i = 0; i < haystackLower.length && needleIndex < needleLower.length; i++) {
        if (haystackLower[i] === needleLower[needleIndex]) {
            needleIndex++;
        }
    }
    
    return needleIndex === needleLower.length;
}

/**
 * Scores a fuzzy match (higher = better match).
 * @param {string} needle - Search term
 * @param {string} haystack - Text to search in
 * @returns {number} Match score
 */
export function fuzzyScore(needle, haystack) {
    if (!needle || !haystack) return 0;
    
    const needleLower = needle.toLowerCase();
    const haystackLower = haystack.toLowerCase();
    
    // Exact match = highest score
    if (haystackLower === needleLower) return 1000;
    
    // Starts with = high score
    if (haystackLower.startsWith(needleLower)) return 500;
    
    // Contains = medium score
    if (haystackLower.includes(needleLower)) return 100;
    
    // Fuzzy match = lower score based on gaps
    let score = 0;
    let needleIndex = 0;
    let lastMatchIndex = -1;
    
    for (let i = 0; i < haystackLower.length && needleIndex < needleLower.length; i++) {
        if (haystackLower[i] === needleLower[needleIndex]) {
            score += 10;
            // Consecutive matches get bonus
            if (lastMatchIndex === i - 1) score += 5;
            lastMatchIndex = i;
            needleIndex++;
        }
    }
    
    return needleIndex === needleLower.length ? score : 0;
}

// Export invalidation functions for cache management
export function invalidatePersonalDataCache() {
    personalDataCache = null;
}

export function invalidateUserTagsCache() {
    userTagsCache = null;
}

export function invalidateFilterPresetsCache() {
    filterPresetsCache = null;
}
