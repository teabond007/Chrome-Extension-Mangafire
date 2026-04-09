import { defineStore } from 'pinia';
import { wipeMangadexCache } from '../../../scripts/core/api/mangadex-api.js';
import { getMergedMetadata } from '../../../scripts/core/api/metadata-service';
import { DATA } from '../../../config.js';
import * as LibraryService from '../../../scripts/core/library-service.ts';
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
            this.isLoading = true;
            try {
                const data = await chrome.storage.local.get([
                    DATA.LIBRARY_ENTRIES, 
                    DATA.READING_HISTORY, 
                    DATA.PERSONAL_DATA, 
                    DATA.LAST_SYNC_TIME
                ]);
                
                const rawEntries = data[DATA.LIBRARY_ENTRIES];
                console.log('[LibraryStore] loadLibrary from storage. Raw type:', typeof rawEntries, 'isArray:', Array.isArray(rawEntries));
                
                if (Array.isArray(rawEntries)) {
                    console.log('[LibraryStore] loadLibrary count:', rawEntries.length);
                    this.entries = rawEntries;
                } else {
                    console.warn('[LibraryStore] loadLibrary: entries is not an array! Data:', rawEntries);
                    this.entries = [];
                }

                this.history = data[DATA.READING_HISTORY] || {};
                this.personalData = data[DATA.PERSONAL_DATA] || {};
                this.lastSync = data[DATA.LAST_SYNC_TIME] || null;

                // Auto-maintenance: Read stale entries
                const settingsStore = useSettingsStore();
                if (settingsStore.autoReadStale && this.entries.length > 0) {
                    const { updatedLibrary, changedCount } = LibraryService.autoReadStaleEntries(this.entries);
                    if (changedCount > 0) {
                        console.log(`[LibraryStore] Auto-read ${changedCount} stale entries.`);
                        this.entries = updatedLibrary;
                        await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: this.entries });
                    }
                }
            } catch (err) {
                console.error('Failed to load library:', err);
            } finally {
                this.isLoading = false;
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
            console.log('[LibraryStore] removeEntry requested for:', entry);
            if (!entry) {
                console.warn('[LibraryStore] removeEntry called with null/undefined entry');
                return;
            }

            const aniId = entry.anilistData?.id;
            const slug = entry.mangaSlug;
            const title = (entry.title || '').toLowerCase().trim();

            // Safeguard: ensure this.entries is an array
            if (!Array.isArray(this.entries)) {
                console.warn('[LibraryStore] removeEntry called but entries is not an array. Resetting.');
                this.entries = [];
                await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: [] });
                return;
            }

            const beforeCount = Array.isArray(this.entries) ? this.entries.length : 'NOT_ARRAY';
            
            // Safeguard: ensure this.entries is an array
            if (!Array.isArray(this.entries)) {
                console.warn('[LibraryStore] removeEntry: entries is not an array. Resetting.');
                this.entries = [];
                await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: [] });
                return;
            }

            this.entries = this.entries.filter(e => {
                if (!e) return false; // Filter out nulls/undefineds

                // Match by AniList ID
                if (aniId && e.anilistData?.id === aniId) return false;

                // Match by Slug
                if (slug && e.mangaSlug === slug) return false;

                // Match by Title (Normalize both for robust comparison)
                if (title) {
                    const entryTitle = (e.title || '').toLowerCase().trim();
                    if (entryTitle === title) return false;
                }

                return true;
            });

            const afterCount = this.entries.length;
            console.log(`[LibraryStore] filter complete. Count: ${beforeCount} -> ${afterCount}`);

            // CRITICAL: Convert to plain JS object/array before saving to storage.
            // Vue/Pinia Proxies can sometimes cause issues with chrome.storage serialization.
            try {
                const plainEntries = JSON.parse(JSON.stringify(this.entries));
                console.log('[LibraryStore] saving plainEntries to storage. Length:', plainEntries.length);
                
                await new Promise((resolve, reject) => {
                    chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: plainEntries }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('[LibraryStore] Storage set error:', chrome.runtime.lastError);
                            reject(chrome.runtime.lastError);
                        } else {
                            console.log('[LibraryStore] Storage set successful');
                            resolve();
                        }
                    });
                });
            } catch (err) {
                console.error('[LibraryStore] Failed to save removed entry to storage:', err);
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
            if (!titleOrSlug) return;
            const target = titleOrSlug.toLowerCase().trim();
            const targetSlug = target.replace(/[^a-z0-9]/g, '');

            // 1. Exact title match
            let entry = this.entries.find(e => e.title.toLowerCase().trim() === target);

            // 2. Slug-based match
            if (!entry) {
                entry = this.entries.find(e => {
                    const eSlug = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const eMangaSlug = (e.mangaSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    return eSlug === targetSlug || eMangaSlug === targetSlug || eSlug.includes(targetSlug) || targetSlug.includes(eSlug);
                });
            }

            if (entry) {
                this.selectedEntry = entry;
            } else {
                console.warn(`[LibraryStore] Could not find entry for: ${titleOrSlug}`);
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
                let updatedEntries = [...this.entries];

                if (wipeAll) {
                    updatedEntries = updatedEntries.map(e => ({
                        ...e,
                        anilistData: undefined,
                        lastChecked: undefined
                    }));

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

                    if (data) Object.assign(liveEntry, { anilistData: data });
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
