import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useSettingsStore } from '../../options/scripts/store/settings.store.js';
import { useLibraryStore } from '../../options/scripts/store/library.store.js';

export function setupDashboardPinia(app) {
    const pinia = createPinia();
    app.use(pinia);

    // Initial Sync Listeners
    const settingsStore = useSettingsStore();
    const libraryStore = useLibraryStore();
    
    settingsStore.loadSettings();
    libraryStore.loadLibrary();
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            settingsStore.syncFromStorage(changes);
            libraryStore.syncFromStorage(changes);
        }
    });

    return pinia;
}
