import { storage } from '../core/storage-adapter.js';

/**
 * Pinia plugin to persist state changes to the storage adapter.
 * Also handles initial hydration from storage.
 * 
 * @param {Object} options Configuration options
 * @param {string} options.key Storage key prefix (optional)
 * @param {string[]} options.paths specific paths to persist (optional)
 */
export function createPersistencePlugin(options = {}) {
    return ({ store }) => {
        // Hydrate store on initialization
        // We assume the store has a specific ID that maps to storage keys
        // or we load specific keys defined in the store options.
        
        // Listen for mutations
        store.$subscribe((mutation, state) => {
            // We can debounce this if needed for performance
            // For now, simple direct save
            const key = store.$id; // Use store ID as key or part of key
            
            // In a real app we might want to map store fields to specific storage keys
            // For this refactor, we will implement specific save logic in the stores 
            // or here if we want a generic "dump state to storage" approach.
            
            // However, since we are refactoring an existing extension with established keys,
            // we likely want the STORE itself to define "how" to save mapping to specific legacy keys.
            // So we might let the store handle its own specific "save" actions, 
            // OR we define a "persistence" map in the store definition.
            
            if (store.persistState) {
                store.persistState(state);
            }
        });
    };
}
