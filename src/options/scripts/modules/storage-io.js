/**
 * @fileoverview Shared utility for gathering and merging extension data.
 * Used by both local Import/Export and Google Drive Sync.
 */

import { TOGGLES, SETTINGS, DATA } from '../../../config.js';

/**
 * Gathers all data from storage.
 * @returns {Promise<Object>} The gathered data object
 */
export async function gatherStorageData() {
    const data = await chrome.storage.local.get(null);
    
    // Add metadata
    data._exportMeta = {
        version: '4.0.0',
        exportDate: new Date().toISOString()
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
    const remoteLibrary = remoteData[DATA.LIBRARY_ENTRIES];
    const currentLibrary = currentData[DATA.LIBRARY_ENTRIES];
    if (Array.isArray(remoteLibrary) || Array.isArray(currentLibrary)) {
        const entryMap = new Map();
        if (Array.isArray(currentLibrary)) currentLibrary.forEach(e => { if (e && e.title) entryMap.set(e.title.toLowerCase(), e); });
        if (Array.isArray(remoteLibrary)) remoteLibrary.forEach(e => { if (e && e.title) entryMap.set(e.title.toLowerCase(), e); });
        mergedData[DATA.LIBRARY_ENTRIES] = Array.from(entryMap.values());
    }

    // Merge custom statuses
    const remoteStatuses = remoteData[DATA.CUSTOM_STATUSES];
    const currentStatuses = currentData[DATA.CUSTOM_STATUSES];
    if (Array.isArray(remoteStatuses) || Array.isArray(currentStatuses)) {
        const markerMap = new Map();
        if (Array.isArray(currentStatuses)) currentStatuses.forEach(m => { if (m && m.name) markerMap.set(m.name.toLowerCase(), m); });
        if (Array.isArray(remoteStatuses)) remoteStatuses.forEach(m => { if (m && m.name) markerMap.set(m.name.toLowerCase(), m); });
        mergedData[DATA.CUSTOM_STATUSES] = Array.from(markerMap.values());
    }

    // Merge reading history 
    const remoteHistory = remoteData[DATA.READING_HISTORY];
    const currentHistory = currentData[DATA.READING_HISTORY];
    if (remoteHistory && typeof remoteHistory === 'object' && currentHistory && typeof currentHistory === 'object') {
        const mergedHistory = { ...currentHistory };
        Object.entries(remoteHistory).forEach(([key, chapters]) => {
            if (mergedHistory[key] && Array.isArray(mergedHistory[key]) && Array.isArray(chapters)) {
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
    
    const remoteSites = remoteData[DATA.CUSTOM_SITES];
    const currentSites = currentData[DATA.CUSTOM_SITES];
    if (Array.isArray(remoteSites) || Array.isArray(currentSites)) {
        const siteMap = new Map();
        if (Array.isArray(currentSites)) currentSites.forEach(s => { if (s && s.hostname) siteMap.set(s.hostname, s); });
        if (Array.isArray(remoteSites)) remoteSites.forEach(s => { if (s && s.hostname) siteMap.set(s.hostname, s); });
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
