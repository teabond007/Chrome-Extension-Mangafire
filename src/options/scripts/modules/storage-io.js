/**
 * @fileoverview Shared utility for gathering and merging extension data.
 * This file helps with importing, exporting and syncing data to the cloud.

 */

import { TOGGLES, SETTINGS, DATA } from '../../../config.js';

/**
 * Gets all the data we have saved in the extension's local storage.
 * @returns {Promise<Object>} All the data object
 */
export async function gatherStorageData() {
    var data = await chrome.storage.local.get(null);
    
    // We add some info about when this was exported so we know later
    data._exportMeta = {
        version: '4.0.0',
        exportDate: new Date().toISOString()
    };

    return data;
}

/**
 * This function mixes two sets of data together (local data and remote data).
 * It makes sure we don't have duplicates and keeps the newest stuff.
 * @param {Object} currentData - The local data from storage.get(null)
 * @param {Object} remoteData - The data to merge in
 * @returns {Object} The merged data object
 */
export function mergeStorageData(currentData, remoteData) {
    // We start with a clean object for the merged results
    var mergedData = {};
    
    // First, copy everything from currentData to mergedData
    for (var key in currentData) {
        mergedData[key] = currentData[key];
    }
    
    // Second, copy everything from remoteData to mergedData
    // This will overwrite values from currentData if the keys are the same
    for (var key in remoteData) {
        mergedData[key] = remoteData[key];
    }

    // We don't want the metadata in the final saved data
    if (mergedData._exportMeta) {
        delete mergedData._exportMeta;
    }

    // --- Merge Library Entries ---
    var remoteLibrary = remoteData[DATA.LIBRARY_ENTRIES];
    var currentLibrary = currentData[DATA.LIBRARY_ENTRIES];
    
    if (Array.isArray(remoteLibrary) || Array.isArray(currentLibrary)) {
        var finalLibrary = [];
        
        // Start with the items we already have
        if (Array.isArray(currentLibrary)) {
            for (var i = 0; i < currentLibrary.length; i++) {
                var entry = currentLibrary[i];
                if (entry && entry.title) {
                    finalLibrary.push(entry);
                }
            }
        }
        
        // Add items from the remote data
        if (Array.isArray(remoteLibrary)) {
            for (var i = 0; i < remoteLibrary.length; i++) {
                var remoteItem = remoteLibrary[i];
                if (remoteItem && remoteItem.title) {
                    var foundIndex = -1;
                    var remoteTitleLower = remoteItem.title.toLowerCase();
                    
                    // Look if we already have this manga in our list
                    for (var j = 0; j < finalLibrary.length; j++) {
                        if (finalLibrary[j].title.toLowerCase() == remoteTitleLower) {
                            foundIndex = j;
                            break;
                        }
                    }
                    
                    if (foundIndex != -1) {
                        // If it's already there, we update it with the remote version
                        finalLibrary[foundIndex] = remoteItem;
                    } else {
                        // If it's new, we just add it to the end
                        finalLibrary.push(remoteItem);
                    }
                }
            }
        }
        mergedData[DATA.LIBRARY_ENTRIES] = finalLibrary;
    }

    // --- Merge Custom Statuses ---
    var remoteStatuses = remoteData[DATA.CUSTOM_STATUSES];
    var currentStatuses = currentData[DATA.CUSTOM_STATUSES];
    
    if (Array.isArray(remoteStatuses) || Array.isArray(currentStatuses)) {
        var finalStatuses = [];
        
        if (Array.isArray(currentStatuses)) {
            for (var i = 0; i < currentStatuses.length; i++) {
                if (currentStatuses[i] && currentStatuses[i].name) {
                    finalStatuses.push(currentStatuses[i]);
                }
            }
        }
        
        if (Array.isArray(remoteStatuses)) {
            for (var i = 0; i < remoteStatuses.length; i++) {
                var s = remoteStatuses[i];
                if (s && s.name) {
                    var sNameLower = s.name.toLowerCase();
                    var found = false;
                    for (var j = 0; j < finalStatuses.length; j++) {
                        if (finalStatuses[j].name.toLowerCase() == sNameLower) {
                            finalStatuses[j] = s;
                            found = true;
                            break;
                        }
                    }
                    if (found == false) {
                        finalStatuses.push(s);
                    }
                }
            }
        }
        mergedData[DATA.CUSTOM_STATUSES] = finalStatuses;
    }

    // --- Merge Reading History ---
    var remoteHistory = remoteData[DATA.READING_HISTORY];
    var currentHistory = currentData[DATA.READING_HISTORY];
    
    if (remoteHistory && currentHistory) {
        var finalHistory = {};
        
        // Copy current history first
        for (var hKey in currentHistory) {
            finalHistory[hKey] = currentHistory[hKey];
        }
        
        // Mix in the remote history
        for (var hKey in remoteHistory) {
            var remoteChapters = remoteHistory[hKey];
            var currentChapters = finalHistory[hKey];
            
            if (Array.isArray(remoteChapters) && Array.isArray(currentChapters)) {
                // Mix chapters together and make sure we don't have duplicates
                var mixed = [];
                for (var k = 0; k < currentChapters.length; k++) {
                    mixed.push(currentChapters[k]);
                }
                for (var k = 0; k < remoteChapters.length; k++) {
                    // Only add if not already in the list
                    if (mixed.indexOf(remoteChapters[k]) == -1) {
                        mixed.push(remoteChapters[k]);
                    }
                }
                finalHistory[hKey] = mixed;
            } else {
                finalHistory[hKey] = remoteChapters;
            }
        }
        mergedData[DATA.READING_HISTORY] = finalHistory;
    }

    // --- Merge Anilist/Personal Cache ---
    if (remoteData[DATA.ANILIST_CACHE] && currentData[DATA.ANILIST_CACHE]) {
        var mergedCache = {};
        for (var cKey in currentData[DATA.ANILIST_CACHE]) {
            mergedCache[cKey] = currentData[DATA.ANILIST_CACHE][cKey];
        }
        for (var cKey in remoteData[DATA.ANILIST_CACHE]) {
            mergedCache[cKey] = remoteData[DATA.ANILIST_CACHE][cKey];
        }
        mergedData[DATA.ANILIST_CACHE] = mergedCache;
    }

    // --- Merge Custom Sites ---
    var remoteSites = remoteData[DATA.CUSTOM_SITES];
    var currentSites = currentData[DATA.CUSTOM_SITES];
    
    if (Array.isArray(remoteSites) || Array.isArray(currentSites)) {
        var finalSites = [];
        
        if (Array.isArray(currentSites)) {
            for (var i = 0; i < currentSites.length; i++) {
                if (currentSites[i] && currentSites[i].hostname) {
                    finalSites.push(currentSites[i]);
                }
            }
        }
        
        if (Array.isArray(remoteSites)) {
            for (var i = 0; i < remoteSites.length; i++) {
                var site = remoteSites[i];
                if (site && site.hostname) {
                    var found = false;
                    for (var j = 0; j < finalSites.length; j++) {
                        if (finalSites[j].hostname == site.hostname) {
                            finalSites[j] = site;
                            found = true;
                            break;
                        }
                    }
                    if (found == false) {
                        finalSites.push(site);
                    }
                }
            }
        }
        mergedData[DATA.CUSTOM_SITES] = finalSites;
    }

    return mergedData;
}

/**
 * Applies data to local storage.
 * @param {Object} data - Data to save
 * @param {boolean} isMerge - Whether to merge with existing data or overwrite everything
 */
export async function applyStorageData(data, isMerge) {
    if (isMerge == true) {
        var currentData = await chrome.storage.local.get(null);
        var merged = mergeStorageData(currentData, data);
        await chrome.storage.local.set(merged);
    } else {
        // If we are replacing everything, we clear the storage first
        if (data._exportMeta) {
            delete data._exportMeta;
        }
        await chrome.storage.local.clear();
        await chrome.storage.local.set(data);
    }
}
