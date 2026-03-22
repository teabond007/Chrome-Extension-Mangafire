/**
 * @fileoverview Shared utility for gathering and merging extension data.
 * Used by both local Import/Export and Google Drive Sync.
 */

import { TOGGLES, SETTINGS, DATA } from '../../../config.js';

export const EXPORT_CATEGORIES = {
    library: {
        keys: [DATA.LIBRARY_ENTRIES],
        label: 'Library Entries'
    },
    history: {
        keys: [DATA.READING_HISTORY],
        label: 'Reading History'
    },
    settings: {
        keys: [
            TOGGLES.AUTO_SYNC,
            TOGGLES.AUTO_SCROLL,
            TOGGLES.KEYBINDS_ENABLED,
            TOGGLES.PROGRESS_TRACKING,
            SETTINGS.VIEW_MODE,
            SETTINGS.THEME,
            TOGGLES.LIBRARY_BORDERS,
            SETTINGS.LIBRARY_THICKNESS,
            TOGGLES.LIBRARY_GLOW_EFFECT,
            TOGGLES.LIBRARY_ANIMATED_BORDERS,
            TOGGLES.LIBRARY_STATUS_ICONS,
            TOGGLES.LIBRARY_PROGRESS_BARS,
            DATA.CUSTOM_STATUSES,
            SETTINGS.HIGHLIGHT_THICKNESS,
            TOGGLES.QUICK_ACTIONS,
            TOGGLES.SHOW_READING_BADGES
        ],
        label: 'Settings'
    },
    personalData: {
        keys: [DATA.PERSONAL_DATA, DATA.FILTER_PRESETS],
        label: 'Tags, Notes & Ratings'
    },
    cache: {
        keys: [DATA.ANILIST_CACHE, DATA.MANGADEX_CACHE],
        label: 'API Cache'
    },
    customSites: {
        keys: [DATA.CUSTOM_SITES],
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
    if (remoteData[DATA.LIBRARY_ENTRIES] && currentData[DATA.LIBRARY_ENTRIES]) {
        const entryMap = new Map();
        currentData[DATA.LIBRARY_ENTRIES].forEach(e => { if (e.title) entryMap.set(e.title.toLowerCase(), e); });
        remoteData[DATA.LIBRARY_ENTRIES].forEach(e => { if (e.title) entryMap.set(e.title.toLowerCase(), e); });
        mergedData[DATA.LIBRARY_ENTRIES] = Array.from(entryMap.values());
    }

    // Merge custom statuses
    if (remoteData[DATA.CUSTOM_STATUSES] && currentData[DATA.CUSTOM_STATUSES]) {
        const markerMap = new Map();
        currentData[DATA.CUSTOM_STATUSES].forEach(m => { if (m.name) markerMap.set(m.name.toLowerCase(), m); });
        remoteData[DATA.CUSTOM_STATUSES].forEach(m => { if (m.name) markerMap.set(m.name.toLowerCase(), m); });
        mergedData[DATA.CUSTOM_STATUSES] = Array.from(markerMap.values());
    }

    // Merge reading history 
    if (remoteData[DATA.READING_HISTORY] && currentData[DATA.READING_HISTORY]) {
        const mergedHistory = { ...currentData[DATA.READING_HISTORY] };
        Object.entries(remoteData[DATA.READING_HISTORY]).forEach(([key, chapters]) => {
            if (mergedHistory[key] && Array.isArray(chapters)) {
                mergedHistory[key] = [...new Set([...mergedHistory[key], ...chapters])];
            } else {
                mergedHistory[key] = chapters;
            }
        });
        mergedData[DATA.READING_HISTORY] = mergedHistory;
    }

    // Basic spread merges
    if (remoteData[DATA.ANILIST_CACHE] && currentData[DATA.ANILIST_CACHE]) {
        mergedData[DATA.ANILIST_CACHE] = { ...currentData[DATA.ANILIST_CACHE], ...remoteData[DATA.ANILIST_CACHE] };
    }
    if (remoteData[DATA.PERSONAL_DATA] && currentData[DATA.PERSONAL_DATA]) {
        mergedData[DATA.PERSONAL_DATA] = { ...currentData[DATA.PERSONAL_DATA], ...remoteData[DATA.PERSONAL_DATA] };
    }
    if (Array.isArray(remoteData[DATA.CUSTOM_SITES]) && Array.isArray(currentData[DATA.CUSTOM_SITES])) {
        const siteMap = new Map();
        currentData[DATA.CUSTOM_SITES].forEach(s => { if (s.hostname) siteMap.set(s.hostname, s); });
        remoteData[DATA.CUSTOM_SITES].forEach(s => { if (s.hostname) siteMap.set(s.hostname, s); });
        mergedData[DATA.CUSTOM_SITES] = Array.from(siteMap.values());
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
