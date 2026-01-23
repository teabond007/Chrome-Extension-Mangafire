/**
 * Options Page Entry Point (Modular)
 */

// Redundant theme import removed
// Redundant theme import removed
// Redundant theme import removed
import { initTabs, initInfoRedirects, initScrollToTop, initUrlParams, initMessageListeners } from './ui/ui-navigation.js';
import { initFeatureToggles } from './modules/feature-toggles.js';
import { initSettings } from './modules/settings-manager.js';
import { initMarkerManager } from './modules/marker-manager.js';
import { initImportExport } from './modules/import-export.js';
import { initLibrary } from '../../scripts/core/library-manager';
import { initQuickAccessManager } from './modules/quick-access-manager.js';
import { initAppearanceManager } from './modules/appearance-manager.js';
import { CrystalSelect } from './ui/custom-select.js';
import { Log } from './ui/logger.js';

/**
 * Main initialization event listener.
 * Triggered when the DOM content is fully loaded.
 * Sequentially initializes all subsystems to ensure the options page is fully functional.
 */
export function init() {

    // 2. Navigation
    initTabs();
    initInfoRedirects();
    initScrollToTop();
    initUrlParams();
    initMessageListeners();

    // 3. Settings & Toggles
    initFeatureToggles();
    initSettings();

    // 4. Custom Markers
    initMarkerManager();

    // 5. Import / Export
    initImportExport();

    // 6. Saved Entries
    initLibrary();

    // 7. Quick Access
    initQuickAccessManager();
    
    // 8. Appearance & Themes
    initAppearanceManager();

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

    // 9. Clear Reading History
    const clearHistoryBtn = document.getElementById("ClearReadingHistoryBtn");
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener("click", () => {
            chrome.storage.local.remove("userbookmarkshistory", () => {
                Log("Reading history cleared.");
                alert("Reading history cleared!");
            });
        });
    }

    // 10. Premium Custom Selects
    // Auto-init handles everything, including dynamic elements
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
