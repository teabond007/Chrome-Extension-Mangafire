import { initTabs, initInfoRedirects, initScrollToTop, initUrlParams, initMessageListeners } from './ui/ui-navigation.js';
import { initFeatureToggles } from './modules/feature-toggles.js';
import { initMarkerManager } from './modules/marker-manager.js';
import { initImportExport } from './modules/import-export.js';
import { initQuickAccessManager } from './modules/quick-access-manager.js';
import { CrystalSelect } from './ui/custom-select.js';
import { Log } from './ui/logger.js';

import { useSettingsStore } from './store/settings.store.js';
import { useLibraryStore } from './store/library.store.js';

// Note: Pinia is initialized in src/options/index.js before this init() is called

/**
 * Main initialization event listener.
 * Triggered when the app is mounted.
 * Sequentially initializes all subsystems to ensure the options page is fully functional.
 */
export async function init() {
    console.log("[Options] Initializing...");

    // 1. Initialize Pinia Stores
    const settingsStore = useSettingsStore();
    const libraryStore = useLibraryStore();

    // Load initial data (library only, settings loaded by App.vue)
    await libraryStore.loadLibrary(); // This is async, UI should show loading state

    // 2. Navigation
    initTabs();
    initInfoRedirects();
    initScrollToTop();
    initUrlParams();
    initMessageListeners();

    // 3. Legacy Modules (To be refactored later)
    initFeatureToggles();
    // initSettings(); // REPLACED BY PINIA
    initMarkerManager();
    initImportExport();
    // initLibrary(); // REPLACED BY PINIA
    initQuickAccessManager();
    // initAppearanceManager(); // REPLACED BY PINIA (mostly) but keeping for now for DOM manipulation

    // Setup Storage Listener for Cross-Context Sync
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            settingsStore.syncFromStorage(changes);
            libraryStore.syncFromStorage(changes);
        }
    });

    // 8.5 Initial Animation (Anime.js)
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.tab-pane.active .card',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutExpo'
        });
    }

    // 8. Manual Sync Button
    const syncBtn = document.getElementById("sendMessageBtnSyncBookmarks");
    if (syncBtn) {
        syncBtn.addEventListener("click", () => {
            Log("Requesting bookmark sync...");
            chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 }, (response) => {
                if (chrome.runtime.lastError) {
                    Log("Error: " + chrome.runtime.lastError.message);
                } else {
                    Log("Sync process initiated...");
                }
            });
        });
    }

    // 10. Premium Custom Selects
    try {
        CrystalSelect.autoInit();
        Log("CrystalSelect auto-initialization enabled.");
    } catch (e) {
        console.error("CrystalSelect Error:", e);
    }
}

/**
 * Handle messages from background/runtime
 */
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "log") {
        Log(msg.text);
    }
});
