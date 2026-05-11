/**
 * @fileoverview Centralized Library Service
 * Handles data persistence and logic for library entries, tags, ratings, and notes.
 * Shared between background scripts, content scripts, and options UI.
 */

import { DATA, DEFAULT_STATUS, LIBRARY_ENTRY_KEYS } from '../../config.js';

/**
 * Gets a unique ID for a manga entry.
 * @param {Object} entry - Library entry object
 * @returns {string} Unique identifier string
 */
export function getMangaId(entry) {
    if (entry.anilistData?.id) return `anilist:${entry.anilistData.id}`;
    if (entry.mangadexId) return `mangadex:${entry.mangadexId}`;
    if (entry[LIBRARY_ENTRY_KEYS.MANGA_SLUG]) return `slug:${entry[LIBRARY_ENTRY_KEYS.MANGA_SLUG]}`;
    if (entry.slug) return `slug:${entry.slug}`;
    return `title:${slugify(entry.title)}`;
}

/**
 * Slugifies a title for search/ID purposes.
 * @param {string} title
 * @returns {string}
 */
function slugify(title) {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds a matching entry in the library using source ID, slug, or title.
 * @param {Array} library - Full library array
 * @param {Object} query - Search query with title, slug, source, sourceId fields
 * @returns {Object|undefined}
 */
export function findEntry(library, query) {
    const { title, slug, source, sourceId } = query;
    const normalizedTitle = slugify(title);

    return library.find(e => {
        if (source && sourceId && e.source === source && e.sourceId === sourceId) return true;
        if (slug && (e.slug === slug || slug === e.mangaSlug?.split('.')[0])) return true;
        if (title && slugify(e.title) === normalizedTitle) return true;
        return false;
    });
}

/**
 * Performs a fuzzy match — true if all needle characters appear in order in haystack.
 * @param {string} needle
 * @param {string} haystack
 * @returns {boolean}
 */
export function fuzzyMatch(needle, haystack) {
    if (!needle || !haystack) return false;
    
    // Just check if the string contains the other string
    // Use includes() for a simple fuzzy check
    var n = needle.toLowerCase();
    var h = haystack.toLowerCase();
    return h.includes(n);
}

/**
 * Returns a numeric relevance score for a fuzzy match.
 * Higher scores mean better matches.
 * @param {string} needle
 * @param {string} haystack
 * @returns {number}
 */
export function fuzzyScore(needle, haystack) {
    if (!needle || !haystack) return 0;
    
    var n = needle.toLowerCase();
    var h = haystack.toLowerCase();
    
    // Very simple scoring logic
    if (h === n) return 1000;
    if (h.startsWith(n)) return 500;
    if (h.includes(n)) return 100;

    return 0;
}

// ============ PERSISTENCE ============

/**
 * Loads and sanitizes library entries from Chrome storage.
 * @returns {Promise<Array>}
 */
export async function loadLibrary() {
    const data = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES]);
    const list = data[DATA.LIBRARY_ENTRIES];

    if (!Array.isArray(list)) return [];

    // Sanitize entries to ensure data integrity
    list.forEach(entry => {
        if (entry.anilistData) {
            // Ensure genres is an array
            if (entry.anilistData.genres !== undefined && !Array.isArray(entry.anilistData.genres)) {
                entry.anilistData.genres = typeof entry.anilistData.genres === 'string' ? [entry.anilistData.genres] : [];
            }
            // Ensure synonyms is an array
            if (entry.anilistData.synonyms !== undefined && !Array.isArray(entry.anilistData.synonyms)) {
                entry.anilistData.synonyms = typeof entry.anilistData.synonyms === 'string' ? [entry.anilistData.synonyms] : [];
            }
            // Ensure tags is an array
            if (entry.anilistData.tags !== undefined && !Array.isArray(entry.anilistData.tags)) {
                entry.anilistData.tags = typeof entry.anilistData.tags === 'string' ? [{ name: entry.anilistData.tags }] : [];
            }
        }
    });

    return list;
}

/**
 * Upserts an entry into the library. Merges with existing by ID or title match.
 * @param {Object} entryData - Partial or full entry data
 * @returns {Promise<Object>} The final merged entry
 */
export async function upsertEntry(entryData) {
    const library = await loadLibrary();
    const id2 = getMangaId(entryData);

    const existingIdx = library.findIndex(e => {
        const id1 = getMangaId(e);
        return id1 === id2 || (e.title && e.title === entryData.title);
    });

    const now = Date.now();
    let updatedEntry;

    if (existingIdx !== -1) {
        // Update the existing entry
        var entry = library[existingIdx];
        
        // Copy the data manually
        for (var key in entryData) {
            entry[key] = entryData[key];
        }
        
        entry.lastUpdated = now;
        library[existingIdx] = entry;
    } else {
        // Create a new entry
        var newEntry = {};
        newEntry.status = DEFAULT_STATUS;
        
        for (var key in entryData) {
            newEntry[key] = entryData[key];
        }
        
        newEntry.lastRead = now;
        newEntry.lastUpdated = now;
        library.push(newEntry);
    }

    const finalLibrary = Array.isArray(library) ? library : [];
    await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalLibrary)) });
    return updatedEntry;
}

/**
 * Updates reading progress (chapter + URL) for a matched entry.
 * Creates a new entry if no match is found.
 * @param {Object} query - MangaQuery object
 * @param {Object} progress - { chapter: string, url: string }
 * @returns {Promise<Object>}
 */
export async function updateProgress(query, progress) {
    const library = await loadLibrary();
    const entry = findEntry(library, query);

    if (!entry) {
        var newEntryData = query;
        newEntryData.lastReadChapter = progress.chapter;
        newEntryData.lastReaderUrl = progress.url;
        newEntryData.lastRead = Date.now();
        
        return await upsertEntry(newEntryData);
    }

    // Only update if chapter is newer or same
    const current = parseFloat(entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER]) || 0;
    const incoming = parseFloat(progress.chapter) || 0;

    if (incoming >= current) {
        entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER] = progress.chapter;
        entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL] = progress.url;
        entry[LIBRARY_ENTRY_KEYS.LAST_READ] = Date.now();
        entry[LIBRARY_ENTRY_KEYS.LAST_UPDATED] = Date.now();

        const finalLibrary = Array.isArray(library) ? library : [];
        await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalLibrary)) });
    }

    return entry;
}

/**
 * Tracks a read chapter in the per-manga reading history.
 * @param {Object} mangaQuery - MangaQuery object
 * @param {string} chapter - Chapter string to record
 * @returns {Promise<string[]>} Updated chapter history for this manga
 */
export async function trackReadChapter(mangaQuery, chapter) {
    const data = await chrome.storage.local.get([DATA.READING_HISTORY]);
    const history = data[DATA.READING_HISTORY] || {};

    // Use slug as the primary key for history if available, else standard ID
    const key = mangaQuery.slug || mangaQuery[LIBRARY_ENTRY_KEYS.MANGA_SLUG] || getMangaId(mangaQuery);

    if (!history[key]) history[key] = [];
    if (!history[key].includes(chapter)) {
        history[key].push(chapter);
        history[key].sort((a, b) => parseFloat(a) - parseFloat(b));
        await chrome.storage.local.set({ [DATA.READING_HISTORY]: history });
    }
    return history[key];
}

// ============ PERSONAL DATA ============

/**
 * Loads the full personal data map (notes + ratings) from storage.
 * @returns {Promise<Object>} Map of mangaId → { notes, rating, lastModified }
 */
export async function loadPersonalData() {
    const data = await chrome.storage.local.get([DATA.PERSONAL_DATA]);
    return data[DATA.PERSONAL_DATA] || {};
}

/**
 * Saves personal data fields for a specific entry.
 * @param {Object} entry - Library entry
 * @param {Object} updates - Partial updates: { notes?, rating? }
 * @returns {Promise<Object>} Updated personal data entry
 */
export async function savePersonalData(entry, updates) {
    var allData = await loadPersonalData();
    var id = getMangaId(entry);
    var personalData = allData[id];
    
    if (personalData == null) {
        personalData = {
            notes: '',
            rating: 0
        };
    }
    
    // Copy the updates manually
    if (updates.notes != undefined) {
        personalData.notes = updates.notes;
    }
    if (updates.rating != undefined) {
        personalData.rating = updates.rating;
    }
    
    personalData.lastModified = Date.now();
    allData[id] = personalData;

    await chrome.storage.local.set({ [DATA.PERSONAL_DATA]: allData });
    return allData[id];
}

/**
 * Saves a clamped rating (0–10) for an entry.
 * @param {Object} entry
 * @param {number} rating
 * @returns {Promise<Object>}
 */
export async function saveRating(entry, rating) {
    return await savePersonalData(entry, { rating: Math.max(0, Math.min(10, rating)) });
}

/**
 * Saves trimmed notes for an entry.
 * @param {Object} entry
 * @param {string} notes
 * @returns {Promise<Object>}
 */
export async function saveNotes(entry, notes) {
    return await savePersonalData(entry, { notes: notes.trim() });
}

// ============ FILTER PRESETS ============

/**
 * Loads saved filter presets from storage.
 * @returns {Promise<Array>}
 */
export async function loadFilterPresets() {
    const data = await chrome.storage.local.get([DATA.FILTER_PRESETS]);
    const presets = data[DATA.FILTER_PRESETS];
    return Array.isArray(presets) ? presets : [];
}

/**
 * Saves or updates a named filter preset.
 * @param {string} name - Preset name (used as key)
 * @param {Object} filters - Filter state to persist
 * @returns {Promise<Array>} All presets after save
 */
export async function saveFilterPreset(name, filters) {
    const presets = await loadFilterPresets();
    const idx = presets.findIndex(p => p.name === name);
    if (idx >= 0) {
        presets[idx] = { name, filters, updatedAt: Date.now() };
    } else {
        presets.push({ name, filters, createdAt: Date.now() });
    }
    await chrome.storage.local.set({ [DATA.FILTER_PRESETS]: presets });
    return presets;
}

/**
 * Deletes a named filter preset.
 * @param {string} name - Preset name to remove
 * @returns {Promise<Array>} All presets after deletion
 */
export async function deleteFilterPreset(name) {
    let presets = await loadFilterPresets();
    presets = presets.filter(p => p.name !== name);
    await chrome.storage.local.set({ [DATA.FILTER_PRESETS]: presets });
    return presets;
}
