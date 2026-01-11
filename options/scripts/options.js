/**
 * Options Page Entry Point (Modular)
 */

import { initTheme } from './ui/theme-manager.js';
import { initTabs, initInfoRedirects, initScrollToTop } from './ui/ui-navigation.js';
import { initFeatureToggles } from './modules/feature-toggles.js';
import { initSettings } from './modules/settings-manager.js';
import { initMarkerManager } from './modules/marker-manager.js';
import { initImportExport } from './modules/import-export.js';
import { initLibrary } from './modules/library-manager.js';
import { Log } from './core/utils.js';

/**
 * Main initialization event listener.
 * Triggered when the DOM content is fully loaded.
 * Sequentially initializes all subsystems to ensure the options page is fully functional.
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme
    /**
     * Initializes the theme settings for the options page.
     */
    initTheme();

    // 2. Navigation
    /**
     * Initializes the tab navigation functionality.
     */
    initTabs();
    /**
     * Initializes redirects for info links.
     */
    initInfoRedirects();
    /**
     * Initializes the scroll-to-top button functionality.
     */
    initScrollToTop();

    // 3. Settings & Toggles
    /**
     * Initializes the feature toggles manager.
     */
    initFeatureToggles();
    /**
     * Initializes the settings manager.
     */
    initSettings();

    // 4. Custom Markers
    /**
     * Initializes the custom marker manager.
     */
    initMarkerManager();

    // 5. Import / Export
    /**
     * Initializes the import/export functionality.
     */
    initImportExport();

    // 6. Saved Entries
    /**
     * Initializes the library manager for saved entries.
     */
    initLibrary();

    // 7. Manual Sync Button
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
});

/**
 * Handle messages from background/runtime
 */
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "log") {
        Log(msg.text);
    }
});
