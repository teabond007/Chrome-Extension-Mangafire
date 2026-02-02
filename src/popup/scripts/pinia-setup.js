import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue'; 
// Note: Popup likely has its own App.vue or HTML entry point.
// Let's verify popup structure first.
import { useSettingsStore } from '../../options/scripts/store/settings.store.js';

export function setupPopupPinia(app) {
    const pinia = createPinia();
    app.use(pinia);

    // Initial Sync Listeners
    const settingsStore = useSettingsStore();
    settingsStore.loadSettings();
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            settingsStore.syncFromStorage(changes);
        }
    });

    return pinia;
}
