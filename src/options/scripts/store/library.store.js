import { defineStore } from 'pinia';
import { storage } from '../core/storage-adapter.js';
import { fetchMangaFromAnilist } from '../../../scripts/core/anilist-api';
import { fetchMangaFromMangadex, wipeMangadexCache } from '../../../scripts/core/mangadex-api.js';

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
                const data = await storage.get(['savedEntriesMerged', 'userbookmarkshistory', 'lastSyncTime']);
                
                this.entries = data.savedEntriesMerged || [];
                this.history = data.userbookmarkshistory || {};
                this.lastSync = data.lastSyncTime || null;
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
            if (changes.savedEntriesMerged) {
                this.entries = changes.savedEntriesMerged.newValue || [];
            }
            if (changes.userbookmarkshistory) {
                this.history = changes.userbookmarkshistory.newValue || {};
            }
            if (changes.lastSyncTime) {
                this.lastSync = changes.lastSyncTime.newValue;
            }
        },

        async removeEntry(entryUrl) {
            // Optimistic update
            this.entries = this.entries.filter(e => e.mangafireUrl !== entryUrl);
            
            // Persist
            await storage.set({ savedEntriesMerged: JSON.parse(JSON.stringify(this.entries)) });
        },

        /**
         * Removes duplicate manga entries based on title.
         * Keeps the entry with the most data (read chapters, anilist info).
         */
        async cleanDuplicates() {
            const unique = new Map();
            let removedCount = 0;
            const entries = [...this.entries];

            entries.forEach(entry => {
                const title = entry.title.toLowerCase().trim();
                const existing = unique.get(title);

                if (!existing) {
                    unique.set(title, entry);
                } else {
                    // Keep the one with more progress or anilist data
                    const existingProgress = parseInt(String(existing.readChapters || 0));
                    const currentProgress = parseInt(String(entry.readChapters || 0));

                    if (currentProgress > existingProgress || (!existing.anilistData && entry.anilistData)) {
                        unique.set(title, entry);
                    }
                    removedCount++;
                }
            });

            if (removedCount > 0) {
                const cleaned = Array.from(unique.values());
                this.entries = cleaned; // Optimistic
                await storage.set({ savedEntriesMerged: cleaned });
                console.log(`Library cleaned: removed ${removedCount} duplicates.`);
                return removedCount;
            }
            return 0;
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
                    // Fetch logic mirrored from library-manager.ts
                    let data = await fetchMangaFromAnilist(liveEntry.title);
                    const isAniListIncomplete = data && (!data.bannerImage || !data.description || !data.coverImage?.large || data.genres?.length === 0);

                    if (!data || isAniListIncomplete) {
                        const mdData = await fetchMangaFromMangadex(liveEntry.title);
                        if (mdData) {
                            if (!data) {
                                data = mdData;
                            } else {
                                // Merge
                                if (!data.bannerImage) data.bannerImage = mdData.bannerImage;
                                if (!data.description) data.description = mdData.description;
                                if ((!data.coverImage?.large || data.coverImage.large.includes('default')) && mdData.coverImage?.large) {
                                  data.coverImage = mdData.coverImage;
                                }
                                if ((!data.genres || data.genres.length === 0) && mdData.genres?.length > 0) {
                                  data.genres = mdData.genres;
                                }
                            }
                        }
                    }

                    if (data) liveEntry.anilistData = data;
                    liveEntry.lastChecked = Date.now();

                    // Save periodically
                    await storage.set({ savedEntriesMerged: JSON.parse(JSON.stringify(entriesList)) });
                    
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
