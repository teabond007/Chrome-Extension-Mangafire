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
        isLoading: true,
        lastSync: null,
        isSyncing: false,
        syncProgress: { current: 0, total: 0, title: '' }
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
                const data = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES, DATA.READING_HISTORY, DATA.LAST_SYNC_TIME]);
                
                this.entries = data[DATA.LIBRARY_ENTRIES] || [];
                this.history = data[DATA.READING_HISTORY] || {};
                this.lastSync = data[DATA.LAST_SYNC_TIME] || null;

                // Auto-maintenance: Read stale entries
                const settingsStore = useSettingsStore();
                if (settingsStore.autoReadStale && this.entries.length > 0) {
                    const { updatedLibrary, changedCount } = LibraryService.autoReadStaleEntries(this.entries);
                    if (changedCount > 0) {
                        console.log(`[LibraryStore] Auto-read ${changedCount} stale entries.`);
                        this.entries = updatedLibrary;
                        await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(this.entries)) });
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
            if (changes[DATA.LIBRARY_ENTRIES]) {
                this.entries = changes[DATA.LIBRARY_ENTRIES].newValue || [];
            }
            if (changes[DATA.READING_HISTORY]) {
                this.history = changes[DATA.READING_HISTORY].newValue || {};
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
            const aniId = entry.anilistData?.id;
            const slug = entry.mangaSlug;
            const title = entry.title?.toLowerCase();

            this.entries = this.entries.filter(e => {
                if (aniId && e.anilistData?.id === aniId) return false;
                if (slug && e.mangaSlug === slug) return false;
                if (title && e.title?.toLowerCase() === title) return false;
                return true;
            });

            await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(this.entries)) });
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
                // Wait for components to mount if needed (standard practice in current codebase)
                const attemptShow = (retries = 0) => {
                    if (window.showMangaDetails) {
                        window.showMangaDetails(entry);
                    } else if (retries < 15) {
                        setTimeout(() => attemptShow(retries + 1), 200);
                    }
                };
                attemptShow();
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
         * Forces a re-fetch of metadata for ALL entries in the library.
         * Clears existing AniList match data to force a fresh lookup.
         */
        async forceSync() {
            if (this.isSyncing) {
                if (!confirm("A sync is already in progress. Do you want to restart it?")) return;
                this.isSyncing = false;
            }

            this.isSyncing = true;
            console.log("Starting forced library sync...");

            try {
                // Clear metadata for all entries
                const updatedEntries = this.entries.map(e => ({
                    ...e,
                    anilistData: undefined,
                    lastChecked: undefined
                }));

                // Clear caches
                await wipeMangadexCache();
                console.log("Cleared MangaDex cache.");

                // Identify missing data (all of them now)
                await this.fetchMissingMetadata(updatedEntries);
                
                alert("Library sync completed!");
            } catch (e) {
                console.error("Force sync failed:", e);
                alert("Sync failed. Check console constraints.");
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

                    // Save periodically
                    await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(entriesList)) });
                    
                    // Throttle
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    console.error('Error fetching metadata for', liveEntry.title, err);
                }
            }
            
            window.dispatchEvent(new CustomEvent('library-sync-complete'));
        }
    }
});
