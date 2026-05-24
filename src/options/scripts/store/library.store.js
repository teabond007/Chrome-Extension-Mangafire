import { defineStore } from 'pinia';
import { wipeMangadexCache } from '../../../scripts/core/api/mangadex-api.js';
import { getMergedMetadata } from '../../../scripts/core/api/metadata-service';
import { DATA } from '../../../config.js';
import * as LibraryService from '../../../scripts/core/library-service.js';
import { useSettingsStore } from './settings.store.js';

export const useLibraryStore = defineStore('library', {
    state: () => ({
        entries: [], // Array of saved manga objects
        history: {}, // Map of reading history
        personalData: {}, // Map of notes and ratings
        isLoading: true,
        lastSync: null,
        isSyncing: false,
        syncProgress: { current: 0, total: 0, title: '' },
        selectedEntry: null // For reactive modal navigation
    }),

    getters: {
        totalEntries: (state) => state.entries.length,
        readingEntries: (state) => state.entries.filter(e => e.status === 'Reading'),
        completedEntries: (state) => state.entries.filter(e => e.status === 'Completed'),
        planToReadEntries: (state) => state.entries.filter(e => e.status === 'Plan to Read')
    },

    actions: {
        async loadLibrary() {
            console.log("[LibraryStore] loadLibrary function has started!");
            this.isLoading = true;
            try {
                console.log("[LibraryStore] Loading library data keys from chrome storage...");
                const data = await chrome.storage.local.get([
                    DATA.LIBRARY_ENTRIES, 
                    DATA.READING_HISTORY, 
                    DATA.PERSONAL_DATA, 
                    DATA.LAST_SYNC_TIME
                ]);
                
                const rawEntries = data[DATA.LIBRARY_ENTRIES];
                console.log('[LibraryStore] Raw entries retrieved: type=' + typeof rawEntries + ', isArray=' + Array.isArray(rawEntries));
                
                if (Array.isArray(rawEntries)) {
                    console.log('[LibraryStore] Success! Loaded library entries count: ' + rawEntries.length);
                    this.entries = rawEntries;
                } else {
                    console.log('[LibraryStore] Warning! entries retrieved was not an array! We will reset entries to [].');
                    this.entries = [];
                }

                this.history = data[DATA.READING_HISTORY] || {};
                this.personalData = data[DATA.PERSONAL_DATA] || {};
                this.lastSync = data[DATA.LAST_SYNC_TIME] || null;
                console.log("[LibraryStore] Done setting state variables in loadLibrary!");

            } catch (err) {
                console.log('[LibraryStore] Error occurred inside loadLibrary: ' + err);
            } finally {
                this.isLoading = false;
                console.log("[LibraryStore] loadLibrary has finished running!");
            }
        },

        /**
         * Efficiently update a single entry or list from background sync
         * @param {Object} changes - The changes object from chrome.storage.onChanged
         */
        syncFromStorage(changes) {
            console.log('[LibraryStore] syncFromStorage triggered. Keys changed:', Object.keys(changes));
            
            if (changes[DATA.LIBRARY_ENTRIES]) {
                const newValue = changes[DATA.LIBRARY_ENTRIES].newValue;
                console.log('[LibraryStore] sync: LibraryEntries changed. New count:', Array.isArray(newValue) ? newValue.length : 'NOT_ARRAY');
                this.entries = Array.isArray(newValue) ? newValue : [];
            }
            if (changes[DATA.READING_HISTORY]) {
                this.history = changes[DATA.READING_HISTORY].newValue || {};
            }
            if (changes[DATA.PERSONAL_DATA]) {
                this.personalData = changes[DATA.PERSONAL_DATA].newValue || {};
            }
            if (changes[DATA.LAST_SYNC_TIME]) {
                this.lastSync = changes[DATA.LAST_SYNC_TIME].newValue;
            }
        },

        /**
         * Removes a manga entry matching by anilist ID, slug, or title fallback.
         * @param {Object} entry - The entry object to remove
         */
        async removeEntry(entry) {
            console.log('[LibraryStore] removeEntry started!');
            try {
                if (!entry) {
                    console.log('[LibraryStore] The entry passed is null or undefined!');
                    return;
                }
                
                var titleToMatch = (entry.title || '').toLowerCase().trim();
                console.log('[LibraryStore] We want to remove the manga with title: ' + titleToMatch);

                if (!Array.isArray(this.entries)) {
                    console.log('[LibraryStore] Oh no! entries is not an array, resetting to empty array.');
                    this.entries = [];
                    await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: [] });
                    return;
                }

                var oldLength = this.entries.length;
                console.log('[LibraryStore] Number of entries before removal: ' + oldLength);

                // Create a brand new array and push elements that do NOT match the title
                var newEntriesList = [];
                for (var i = 0; i < this.entries.length; i++) {
                    var currentEntry = this.entries[i];
                    if (currentEntry) {
                        var currentTitle = (currentEntry.title || '').toLowerCase().trim();
                        if (currentTitle === titleToMatch) {
                            console.log('[LibraryStore] Found the match to delete! Skipping: ' + currentEntry.title);
                        } else {
                            newEntriesList.push(currentEntry);
                        }
                    }
                }

                this.entries = newEntriesList;
                var newLength = this.entries.length;
                console.log('[LibraryStore] Number of entries after removal: ' + newLength);

                console.log('[LibraryStore] Serializing entries list to plain JS array...');
                var plainString = JSON.stringify(this.entries);
                var plainEntries = JSON.parse(plainString);
                
                console.log('[LibraryStore] Saving new entries list to local chrome storage...');
                await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: plainEntries });
                console.log('[LibraryStore] Saved to storage successfully!');
            } catch (err) {
                console.log('[LibraryStore] Error in removeEntry: ' + err);
            }
        },

        /**
         * Helper to save the current entries array to storage.
         * @param {Array} entries - The array of entries to save.
         */
        saveEntries(entries) {
            this.entries = entries;
            chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: entries });
        },

        /**
         * Finds an entry by title or slug and opens the details modal.
         * Used for deep linking and background message handling.
         * @param {string} titleOrSlug - The title or slug to match.
         */
        showEntryDetails(titleOrSlug) {
            console.log("[LibraryStore] showEntryDetails called for titleOrSlug: " + titleOrSlug);
            try {
                if (!titleOrSlug) {
                    console.log("[LibraryStore] titleOrSlug is empty, exiting.");
                    return;
                }
                var target = titleOrSlug.toLowerCase().trim();
                console.log("[LibraryStore] Normalized target search term is: " + target);

                var entryFound = null;

                // Loop 1: search for an exact title match first
                console.log("[LibraryStore] Loop 1: Looking for exact title match...");
                for (var i = 0; i < this.entries.length; i++) {
                    var e = this.entries[i];
                    if (e && e.title) {
                        var currentTitle = e.title.toLowerCase().trim();
                        if (currentTitle === target) {
                            console.log("[LibraryStore] Found exact title match! Entry: " + e.title);
                            entryFound = e;
                            break;
                        }
                    }
                }

                // Loop 2: fuzzy or slug-based match if we found nothing in Loop 1
                if (entryFound == null) {
                    console.log("[LibraryStore] Loop 2: Looking for fallback matching...");
                    var targetSlug = target.replace(/[^a-z0-9]/g, '');
                    
                    for (var j = 0; j < this.entries.length; j++) {
                        var e = this.entries[j];
                        if (e && e.title) {
                            var eSlug = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                            var eMangaSlug = (e.mangaSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (eSlug === targetSlug || eMangaSlug === targetSlug || eSlug.indexOf(targetSlug) !== -1 || targetSlug.indexOf(eSlug) !== -1) {
                                console.log("[LibraryStore] Found slug/fuzzy match! Entry: " + e.title);
                                entryFound = e;
                                break;
                            }
                        }
                    }
                }

                if (entryFound != null) {
                    console.log("[LibraryStore] Setting selectedEntry to: " + entryFound.title);
                    this.selectedEntry = entryFound;
                } else {
                    console.log("[LibraryStore] Warning! Could not find any entry in library matching: " + titleOrSlug);
                }
            } catch (err) {
                console.log("[LibraryStore] Error in showEntryDetails: " + err);
            }
        },

        /**
         * Adds or updates an entry in the library.
         * @param {Object} entryData - The data to upsert
         */
        async upsertEntry(entryData) {
            // Using service for logic, store will update via syncFromStorage (if set up)
            // or we manually update it here for immediate feedback.
            const updated = await LibraryService.upsertEntry(entryData);
            
            // Local update for immediate UI response
            const idx = this.entries.findIndex(e => 
                LibraryService.getMangaId(e) === LibraryService.getMangaId(updated)
            );
            
            if (idx !== -1) {
                this.entries[idx] = updated;
            } else {
                this.entries.push(updated);
            }
            return updated;
        },

        
        /**
         * Sync metadata for entries in the library.
         * @param {boolean} wipeAll - If true, clears existing metadata to force a fresh lookup.
         */
        async forceSync(wipeAll = false) {
            if (this.isSyncing) {
                if (!confirm("A sync is already in progress. Do you want to restart it?")) return;
                this.isSyncing = false;
            }

            if (wipeAll) {
                if (!confirm("WARNING: This will wipe all cached metadata and re-fetch from scratch. This can take a long time and hits rate limits. Are you sure?")) return;
            }

            this.isSyncing = true;
            console.log(wipeAll ? "Starting full forced library sync..." : "Starting missing info sync...");

            try {
                var updatedEntries = [];
                
                for (var i = 0; i < this.entries.length; i++) {
                    var entry = this.entries[i];
                    
                    if (wipeAll == true) {
                        entry.anilistData = undefined;
                        entry.lastChecked = undefined;
                    }
                    
                    updatedEntries.push(entry);
                }

                if (wipeAll == true) {
                    await wipeMangadexCache();
                    console.log("Cleared MangaDex cache.");
                }

                await this.fetchMissingMetadata(updatedEntries);
                
                alert(wipeAll ? "Full library sync completed!" : "Missing info sync completed!");
            } catch (e) {
                console.error("Sync failed:", e);
                alert("Sync failed. Check console for details.");
            } finally {
                this.isSyncing = false;
                this.syncProgress = { current: 0, total: 0, title: '' };
            }
        },

        async fetchMissingMetadata(entriesList) {
            const missing = entriesList.filter(e => 
                (!e.anilistData || (e.anilistData.id && !e.anilistData.chapters)) &&
                (!e.lastChecked || (Date.now() - e.lastChecked > 3600000))
            );

            if (missing.length === 0) return;

            this.syncProgress = { current: 0, total: missing.length, title: 'Starting...' };
            // Notify global listeners if any
            window.dispatchEvent(new CustomEvent('library-sync-start', { detail: { total: missing.length } }));

            for (let i = 0; i < missing.length; i++) {
                const staleEntry = missing[i];
                
                // Always get fresh ref in case syncFromStorage updated it
                const liveEntry = entriesList.find(e => e.title === staleEntry.title);
                if (!liveEntry) continue;

                this.syncProgress = { current: i + 1, total: missing.length, title: liveEntry.title };
                window.dispatchEvent(new CustomEvent('library-sync-progress', {
                    detail: { current: i + 1, total: missing.length, title: liveEntry.title }
                }));

                try {
                    // Use centralized metadata service
                    const data = await getMergedMetadata(liveEntry.title);

                    if (data != null) {
                        liveEntry.anilistData = data;
                    }
                    liveEntry.lastChecked = Date.now();
                    
                    // Throttle
                    await new Promise(r => setTimeout(r, 600));
                } catch (err) {
                    console.error('Error fetching metadata for', liveEntry.title, err);
                }
            }

            // Save all updates once after the loop
            await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: entriesList });
            this.entries = entriesList;
            
            window.dispatchEvent(new CustomEvent('library-sync-complete'));
        }
    }
});
