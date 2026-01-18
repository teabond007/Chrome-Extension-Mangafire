/**
 * Options Page Entry Point (Modular)
 */

// Redundant theme import removed
import { initTabs, initInfoRedirects, initScrollToTop } from './ui/ui-navigation.js';
import { initFeatureToggles } from './modules/feature-toggles.js';
import { initSettings } from './modules/settings-manager.js';
import { initMarkerManager } from './modules/marker-manager.js';
import { initImportExport } from './modules/import-export.js';
import { initLibrary } from './modules/library-manager.js';
import { initQuickAccessManager } from './modules/quick-access-manager.js';
import { initAppearanceManager } from './modules/appearance-manager.js';
import { CrystalSelect } from './ui/custom-select.js';
import { Log } from './core/utils.js';

/**
 * Main initialization event listener.
 * Triggered when the DOM content is fully loaded.
 * Sequentially initializes all subsystems to ensure the options page is fully functional.
 */
document.addEventListener("DOMContentLoaded", () => {

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

    // 7. Quick Access
    /**
     * Initializes the quick access shortcuts manager.
     */
    initQuickAccessManager();
    
    // 8. Appearance & Themes
    /**
     * Initializes the appearance manager for themes and global styles.
     */
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
});

/**
 * Handle messages from background/runtime
 */
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "log") {
        Log(msg.text);
    }
});
