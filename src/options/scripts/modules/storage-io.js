/**
 * @fileoverview Shared utility for gathering and merging extension data.
 * Used by both local Import/Export and Google Drive Sync.
 */

export const EXPORT_CATEGORIES = {
    library: {
        keys: ['savedEntriesMerged'],
        label: 'Library Entries'
    },
    history: {
        keys: ['savedReadChapters'],
        label: 'Reading History'
    },
    settings: {
        keys: [
            'profileAutoSync',
            'autoScrollEnabled',
            'keybindsEnabled',
            'progressTrackingEnabled',
            'cardViewSize',
            'theme',
            'LibraryCardBordersEnabled',
            'LibraryCardBorderThickness',
            'LibraryGlowEffect',
            'LibraryAnimatedBorders',
            'LibraryStatusIcons',
            'LibraryProgressBars',
            'customBookmarks',
            'highlightThickness',
            'quickActions',
            'showReadingBadges'
        ],
        label: 'Settings'
    },
    personalData: {
        keys: ['libraryPersonalData', 'libraryUserTags', 'libraryFilterPresets'],
        label: 'Tags, Notes & Ratings'
    },
    cache: {
        keys: ['anilistCache', 'mangadexCache'],
        label: 'API Cache'
    },
    customSites: {
        keys: ['customSites'],
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


    // Merge savedEntriesMerged (modern library)
    if (remoteData.savedEntriesMerged && currentData.savedEntriesMerged) {
        const entryMap = new Map();
        currentData.savedEntriesMerged.forEach(e => { if (e.title) entryMap.set(e.title.toLowerCase(), e); });
        remoteData.savedEntriesMerged.forEach(e => { if (e.title) entryMap.set(e.title.toLowerCase(), e); });
        mergedData.savedEntriesMerged = Array.from(entryMap.values());
    }

    // Merge custom statuses
    if (remoteData.customBookmarks && currentData.customBookmarks) {
        const markerMap = new Map();
        currentData.customBookmarks.forEach(m => { if (m.name) markerMap.set(m.name.toLowerCase(), m); });
        remoteData.customBookmarks.forEach(m => { if (m.name) markerMap.set(m.name.toLowerCase(), m); });
        mergedData.customBookmarks = Array.from(markerMap.values());
    }

    // Merge reading history (combine unique chapter numbers/IDs)
    if (remoteData.savedReadChapters && currentData.savedReadChapters) {
        const mergedHistory = { ...currentData.savedReadChapters };
        Object.entries(remoteData.savedReadChapters).forEach(([key, chapters]) => {
            if (mergedHistory[key] && Array.isArray(chapters)) {
                mergedHistory[key] = [...new Set([...mergedHistory[key], ...chapters])];
            } else {
                mergedHistory[key] = chapters;
            }
        });
        mergedData.savedReadChapters = mergedHistory;
    }

    // Basic spread merges for other JSON objects
    if (remoteData.anilistCache && currentData.anilistCache) {
        mergedData.anilistCache = { ...currentData.anilistCache, ...remoteData.anilistCache };
    }
    if (remoteData.libraryPersonalData && currentData.libraryPersonalData) {
        mergedData.libraryPersonalData = { ...currentData.libraryPersonalData, ...remoteData.libraryPersonalData };
    }
    if (Array.isArray(remoteData.customSites) && Array.isArray(currentData.customSites)) {
        const siteMap = new Map();
        currentData.customSites.forEach(s => { if (s.hostname) siteMap.set(s.hostname, s); });
        remoteData.customSites.forEach(s => { if (s.hostname) siteMap.set(s.hostname, s); });
        mergedData.customSites = Array.from(siteMap.values());
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
