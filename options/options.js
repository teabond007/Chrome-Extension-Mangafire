/**
 * Options Page Entry Point (Modular)
 */

import { initTheme } from './theme-manager.js';
import { initTabs, initInfoRedirects, initScrollToTop } from './ui-navigation.js';
import { initFeatureToggles } from './feature-toggles.js';
import { initSettings } from './settings-manager.js';
import { initMarkerManager } from './marker-manager.js';
import { initImportExport } from './import-export.js';
import { initLibrary } from './library-manager.js';
import { Log } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme
    initTheme();

    // 2. Navigation
    initTabs();
    initInfoRedirects();
    initScrollToTop();

    // 3. Settings & Toggles
    initFeatureToggles();
    initSettings();

    // 4. Custom Markers
    initMarkerManager();

    // 5. Import / Export
    initImportExport();

    // 6. Saved Entries
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
