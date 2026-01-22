/**
 * useSyncedStorage Composable
 * 
 * Provides a reactive bridge between Vue and chrome.storage.
 * Automatically syncs changes bidirectionally.
 * 
 * @example
 * const myData = useSyncedStorage('settingKey', defaultValue);
 * myData.value = 'new value'; // Automatically saved to chrome.storage
 */

import { ref, watch, onMounted, onUnmounted } from 'vue';

/**
 * Creates a reactive reference synced with chrome.storage.local
 * @param {string} key - Storage key to sync with
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {import('vue').Ref} Reactive reference to the stored value
 */
export function useSyncedStorage(key, defaultValue) {
    const data = ref(defaultValue);
    let isUpdating = false;
    
    /**
     * Loads initial value from storage
     */
    async function loadFromStorage() {
        try {
            const result = await chrome.storage.local.get(key);
            if (result[key] !== undefined) {
                isUpdating = true;
                data.value = result[key];
                isUpdating = false;
            }
        } catch (error) {
            console.error(`[useSyncedStorage] Failed to load ${key}:`, error);
        }
    }
    
    /**
     * Handles storage change events from other contexts
     * @param {Object} changes - Storage changes object
     * @param {string} areaName - Storage area that changed
     */
    function handleStorageChange(changes, areaName) {
        if (areaName !== 'local') return;
        if (!changes[key]) return;
        
        isUpdating = true;
        data.value = changes[key].newValue;
        isUpdating = false;
    }
    
    // Watch for local changes and sync to storage
    watch(data, async (newValue) => {
        if (isUpdating) return;
        
        try {
            await chrome.storage.local.set({ [key]: newValue });
        } catch (error) {
            console.error(`[useSyncedStorage] Failed to save ${key}:`, error);
        }
    }, { deep: true });
    
    // Setup lifecycle
    onMounted(() => {
        loadFromStorage();
        chrome.storage.onChanged.addListener(handleStorageChange);
    });
    
    onUnmounted(() => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
    });
    
    return data;
}

/**
 * Creates a reactive reference synced with chrome.storage.sync
 * (cross-device sync for smaller data)
 * @param {string} key - Storage key to sync with
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {import('vue').Ref} Reactive reference to the stored value
 */
export function useChromeSync(key, defaultValue) {
    const data = ref(defaultValue);
    let isUpdating = false;
    
    async function loadFromStorage() {
        try {
            const result = await chrome.storage.sync.get(key);
            if (result[key] !== undefined) {
                isUpdating = true;
                data.value = result[key];
                isUpdating = false;
            }
        } catch (error) {
            console.error(`[useChromeSync] Failed to load ${key}:`, error);
        }
    }
    
    function handleStorageChange(changes, areaName) {
        if (areaName !== 'sync') return;
        if (!changes[key]) return;
        
        isUpdating = true;
        data.value = changes[key].newValue;
        isUpdating = false;
    }
    
    watch(data, async (newValue) => {
        if (isUpdating) return;
        
        try {
            await chrome.storage.sync.set({ [key]: newValue });
        } catch (error) {
            console.error(`[useChromeSync] Failed to save ${key}:`, error);
        }
    }, { deep: true });
    
    onMounted(() => {
        loadFromStorage();
        chrome.storage.onChanged.addListener(handleStorageChange);
    });
    
    onUnmounted(() => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
    });
    
    return data;
}
