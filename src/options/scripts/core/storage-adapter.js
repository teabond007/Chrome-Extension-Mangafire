/**
 * Abstraction layer for storage to allow easy swapping between
 * Chrome Storage (Extension), LocalStorage (Web), or SQLite/Capacitor (Android).
 */
class StorageAdapter {
    /**
     * @param {string[]} keys 
     * @returns {Promise<Object>}
     */
    async get(keys) {
        throw new Error("Method 'get' must be implemented.");
    }

    /**
     * @param {Object} items 
     * @returns {Promise<void>}
     */
    async set(items) {
        throw new Error("Method 'set' must be implemented.");
    }

    /**
     * @param {string[]} keys 
     * @returns {Promise<void>}
     */
    async remove(keys) {
        throw new Error("Method 'remove' must be implemented.");
    }
}

/**
 * Adapter implementation for Chrome Extension environment.
 */
class ChromeStorageAdapter extends StorageAdapter {
    async get(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
                resolve(result || {});
            });
        });
    }

    async set(items) {
        return new Promise((resolve) => {
            chrome.storage.local.set(items, () => {
                resolve();
            });
        });
    }

    async remove(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(keys, () => {
                resolve();
            });
        });
    }
}

// Singleton instance
export const storage = new ChromeStorageAdapter();
