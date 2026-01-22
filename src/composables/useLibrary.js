/**
 * useLibrary Composable
 * 
 * Provides reactive access to the manga library with
 * filtering, sorting, and CRUD operations.
 */

import { ref, computed } from 'vue';
import { useSyncedStorage } from './useStorage';
import { STORAGE_KEYS } from '@/core/storage-schema';

/**
 * Creates a reactive library manager
 * @returns {Object} Library state and methods
 */
export function useLibrary() {
    /** Raw library entries from storage (Array) */
    const entries = useSyncedStorage(STORAGE_KEYS.LIBRARY, []);
    
    /** Current search query */
    const searchQuery = ref('');
    
    /** Current status filter */
    const statusFilter = ref('ALL');
    
    /** Current sort field */
    const sortBy = ref('lastReadDate');
    
    /** Sort direction */
    const sortDesc = ref(true);
    
    /**
     * All entries as an array (pass-through since it is an array)
     */
    const entriesArray = computed(() => {
        return Array.isArray(entries.value) ? entries.value : [];
    });
    
    /**
     * Filtered and sorted entries
     */
    const filteredEntries = computed(() => {
        let result = [...entriesArray.value];
        
        // Apply status filter
        if (statusFilter.value !== 'ALL') {
            result = result.filter(e => e.status === statusFilter.value);
        }
        
        // Apply search filter
        if (searchQuery.value.trim()) {
            const query = searchQuery.value.toLowerCase();
            result = result.filter(e => 
                (e.title && e.title.toLowerCase().includes(query)) ||
                (e.slug && e.slug.toLowerCase().includes(query))
            );
        }
        
        // Apply sorting
        result.sort((a, b) => {
            const aVal = a[sortBy.value];
            const bVal = b[sortBy.value];
            
            // Handle null/undefined
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            
            if (typeof aVal === 'string') {
                return sortDesc.value 
                    ? bVal.localeCompare(aVal)
                    : aVal.localeCompare(bVal);
            }
            
            return sortDesc.value ? bVal - aVal : aVal - bVal;
        });
        
        return result;
    });
    
    /**
     * Statistics computed from library
     */
    const stats = computed(() => ({
        total: entriesArray.value.length,
        reading: entriesArray.value.filter(e => e.status === 'Reading').length,
        completed: entriesArray.value.filter(e => e.status === 'Completed').length,
        planToRead: entriesArray.value.filter(e => e.status === 'Plan to Read').length,
        onHold: entriesArray.value.filter(e => e.status === 'On-Hold').length,
        dropped: entriesArray.value.filter(e => e.status === 'Dropped').length,
        rereading: entriesArray.value.filter(e => e.status === 'Re-reading').length
    }));
    
    /**
     * Updates an entry's status
     * @param {string} id - Entry ID
     * @param {string} status - New status
     */
    function updateStatus(id, status) {
        if (!Array.isArray(entries.value)) return;
        
        const index = entries.value.findIndex(e => e.id === id);
        if (index !== -1) {
            // Vue 3 + Proxy: modifying the object property triggers reactivity
            // provided the array itself is reactive (which useSyncedStorage return is)
            const entry = entries.value[index];
            entry.status = status;
            entry.updatedAt = Date.now(); // Should match schema: lastUpdated
            entry.lastUpdated = Date.now();
            
            // Trigger save by assigning to itself (shallow copy) to notify useSyncedStorage deep watcher?
            // useSyncedStorage likely uses deep watch, so direct mutation should work IF configured.
            // But to be safe with array mutation detection in some setups:
            entries.value = [...entries.value];
        }
    }
    
    /**
     * Updates an entry's rating
     * @param {string} id - Entry ID
     * @param {number} rating - Rating value (0-10)
     */
    function updateRating(id, rating) {
        if (!Array.isArray(entries.value)) return;

        const index = entries.value.findIndex(e => e.id === id);
        if (index !== -1) {
            const entry = entries.value[index];
            if (!entry.personalData) entry.personalData = {};
            entry.personalData.rating = rating;
            entry.lastUpdated = Date.now();
            entries.value = [...entries.value];
        }
    }
    
    /**
     * Removes an entry from the library
     * @param {string} id - Entry ID to remove
     */
    function removeEntry(id) {
        if (!Array.isArray(entries.value)) return;
        entries.value = entries.value.filter(e => e.id !== id);
    }

    /**
     * Clears the entire library
     */
    function clearLibrary() {
        entries.value = [];
    }
    
    /**
     * Updates an entry's tags
     * @param {string} id - Entry ID
     * @param {string[]} tags - Array of tags
     */
    function updateTags(id, tags) {
        if (!Array.isArray(entries.value)) return;

        const index = entries.value.findIndex(e => e.id === id);
        if (index !== -1) {
            const entry = entries.value[index];
            if (!entry.personalData) entry.personalData = {};
            entry.personalData.tags = tags;
            entry.lastUpdated = Date.now();
            entries.value = [...entries.value];
        }
    }

    /**
     * Updates an entry's notes
     * @param {string} id - Entry ID
     * @param {string} notes - Notes text
     */
    function updateNotes(id, notes) {
        if (!Array.isArray(entries.value)) return;

        const index = entries.value.findIndex(e => e.id === id);
        if (index !== -1) {
            const entry = entries.value[index];
            if (!entry.personalData) entry.personalData = {};
            entry.personalData.notes = notes;
            entry.lastUpdated = Date.now();
            entries.value = [...entries.value];
        }
    }
    
    return {
        entries,
        entriesArray,
        filteredEntries,
        stats,
        searchQuery,
        statusFilter,
        sortBy,
        sortDesc,
        updateStatus,
        updateRating,
        updateTags,
        updateNotes,
        removeEntry,
        clearLibrary
    };
}
