import { defineStore } from 'pinia';
import { storage } from '../core/storage-adapter.js';

export const useLibraryStore = defineStore('library', {
    state: () => ({
        entries: [], // Array of saved manga objects
        history: {}, // Map of reading history
        isLoading: true,
        lastSync: null
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
        }
    }
});
