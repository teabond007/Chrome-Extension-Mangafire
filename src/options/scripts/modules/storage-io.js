/**
 * @fileoverview Shared utility for gathering and merging extension data.
 * Used by both local Import/Export and Google Drive Sync.
 */

import { STORAGE_KEYS } from '../../../config.js';

export const EXPORT_CATEGORIES = {
    library: {
        keys: [STORAGE_KEYS.LIBRARY_ENTRIES],
        label: 'Library Entries'
    },
    history: {
        keys: [STORAGE_KEYS.READING_HISTORY],
        label: 'Reading History'
    },
    settings: {
        keys: [
            STORAGE_KEYS.SETTINGS_PROFILE_SYNC,
            STORAGE_KEYS.SETTINGS_AUTO_SCROLL,
            STORAGE_KEYS.SETTINGS_KEYBINDS,
            STORAGE_KEYS.SETTINGS_PROGRESS,
            STORAGE_KEYS.SETTINGS_CARD_SIZE,
            STORAGE_KEYS.THEME,
            STORAGE_KEYS.BORDERS_ENABLED,
            STORAGE_KEYS.BORDER_THICKNESS,
            STORAGE_KEYS.GLOW_EFFECT,
            STORAGE_KEYS.ANIMATED_BORDERS,
            STORAGE_KEYS.STATUS_ICONS,
            STORAGE_KEYS.PROGRESS_BARS,
            STORAGE_KEYS.CUSTOM_BOOKMARKS,
            STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS,
            STORAGE_KEYS.SETTINGS_QUICK_ACTIONS,
            STORAGE_KEYS.SETTINGS_SHOW_BADGES
        ],
        label: 'Settings'
    },
    personalData: {
        keys: [STORAGE_KEYS.PERSONAL_DATA, STORAGE_KEYS.USER_TAGS, STORAGE_KEYS.FILTER_PRESETS],
        label: 'Tags, Notes & Ratings'
    },
    cache: {
        keys: [STORAGE_KEYS.ANILIST_CACHE, STORAGE_KEYS.MANGADEX_CACHE],
        label: 'API Cache'
    },
    customSites: {
        keys: [STORAGE_KEYS.CUSTOM_SITES],
        label: 'Custom Site Configs'
    }
};

/**
 * Gathers data for specified categories from storage.
 * @param {Object} categoryFlags - Map of category keys to boolean enabled status
 * @returns {Promise<Object>} The gathered data object
 */
export async function gatherStorageData(categoryFlags) {
    const keysToExport = [];
    
    for (const [category, enabled] of Object.entries(categoryFlags)) {
        if (enabled && EXPORT_CATEGORIES[category]) {
            keysToExport.push(...EXPORT_CATEGORIES[category].keys);
        }
    }

    if (keysToExport.length === 0) return {};

    const data = await chrome.storage.local.get(keysToExport);
    
    // Add metadata
    data._exportMeta = {
        version: '4.0.0',
        exportDate: new Date().toISOString(),
        categories: { ...categoryFlags }
    };

    return data;
}

/**
 * Merges remote data with current local storage data using smart rules.
 * @param {Object} currentData - The local data from storage.get(null)
 * @param {Object} remoteData - The data to merge in
 * @returns {Object} The merged data object
 */
export function mergeStorageData(currentData, remoteData) {
    const mergedData = { ...currentData, ...remoteData };

    // Remove metadata
    delete mergedData._exportMeta;


    // Merge library entries
    if (remoteData[STORAGE_KEYS.LIBRARY_ENTRIES] && currentData[STORAGE_KEYS.LIBRARY_ENTRIES]) {
        const entryMap = new Map();
        currentData[STORAGE_KEYS.LIBRARY_ENTRIES].forEach(e => { if (e.title) entryMap.set(e.title.toLowerCase(), e); });
        remoteData[STORAGE_KEYS.LIBRARY_ENTRIES].forEach(e => { if (e.title) entryMap.set(e.title.toLowerCase(), e); });
        mergedData[STORAGE_KEYS.LIBRARY_ENTRIES] = Array.from(entryMap.values());
    }

    // Merge custom statuses
    if (remoteData[STORAGE_KEYS.CUSTOM_BOOKMARKS] && currentData[STORAGE_KEYS.CUSTOM_BOOKMARKS]) {
        const markerMap = new Map();
        currentData[STORAGE_KEYS.CUSTOM_BOOKMARKS].forEach(m => { if (m.name) markerMap.set(m.name.toLowerCase(), m); });
        remoteData[STORAGE_KEYS.CUSTOM_BOOKMARKS].forEach(m => { if (m.name) markerMap.set(m.name.toLowerCase(), m); });
        mergedData[STORAGE_KEYS.CUSTOM_BOOKMARKS] = Array.from(markerMap.values());
    }

    // Merge reading history 
    if (remoteData[STORAGE_KEYS.READING_HISTORY] && currentData[STORAGE_KEYS.READING_HISTORY]) {
        const mergedHistory = { ...currentData[STORAGE_KEYS.READING_HISTORY] };
        Object.entries(remoteData[STORAGE_KEYS.READING_HISTORY]).forEach(([key, chapters]) => {
            if (mergedHistory[key] && Array.isArray(chapters)) {
                mergedHistory[key] = [...new Set([...mergedHistory[key], ...chapters])];
            } else {
                mergedHistory[key] = chapters;
            }
        });
        mergedData[STORAGE_KEYS.READING_HISTORY] = mergedHistory;
    }

    // Basic spread merges
    if (remoteData[STORAGE_KEYS.ANILIST_CACHE] && currentData[STORAGE_KEYS.ANILIST_CACHE]) {
        mergedData[STORAGE_KEYS.ANILIST_CACHE] = { ...currentData[STORAGE_KEYS.ANILIST_CACHE], ...remoteData[STORAGE_KEYS.ANILIST_CACHE] };
    }
    if (remoteData[STORAGE_KEYS.PERSONAL_DATA] && currentData[STORAGE_KEYS.PERSONAL_DATA]) {
        mergedData[STORAGE_KEYS.PERSONAL_DATA] = { ...currentData[STORAGE_KEYS.PERSONAL_DATA], ...remoteData[STORAGE_KEYS.PERSONAL_DATA] };
    }
    if (Array.isArray(remoteData[STORAGE_KEYS.CUSTOM_SITES]) && Array.isArray(currentData[STORAGE_KEYS.CUSTOM_SITES])) {
        const siteMap = new Map();
        currentData[STORAGE_KEYS.CUSTOM_SITES].forEach(s => { if (s.hostname) siteMap.set(s.hostname, s); });
        remoteData[STORAGE_KEYS.CUSTOM_SITES].forEach(s => { if (s.hostname) siteMap.set(s.hostname, s); });
        mergedData[STORAGE_KEYS.CUSTOM_SITES] = Array.from(siteMap.values());
    }

    return mergedData;
}

/**
 * Applies data to local storage.
 * @param {Object} data - Data to save
 * @param {boolean} isMerge - Whether to merge with existing or overwrite
 */
export async function applyStorageData(data, isMerge) {
    if (isMerge) {
        const currentData = await chrome.storage.local.get(null);
        const merged = mergeStorageData(currentData, data);
        await chrome.storage.local.set(merged);
    } else {
        // Overwrite: clear and set
        delete data._exportMeta;
        await chrome.storage.local.clear();
        await chrome.storage.local.set(data);
    }
}
