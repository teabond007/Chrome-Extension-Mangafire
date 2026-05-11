/**
 * @fileoverview Unified Content Script Entry Point
 * Detects the current platform and initializes the appropriate adapter.
 */

// Selector tool - auto-initializes when ?bmh-selector-mode=true is in URL
import './selector-tool';
import { initCustomSite, GenericAdapter } from '../core/generic-adapter.js';
import ProgressTracker from '../core/reader/progress-tracker.js';
import { TOGGLES, SETTINGS, DATA } from '../../config.js';

/**
 * Main bootstrap function to start the extension logic on the page.
 */
function bootstrap() {
    // If the extension context is gone, we must stop
    if (!chrome.runtime || !chrome.runtime.id) {
        return;
    }

    var currentHost = window.location.hostname;

    // Load ALL settings needed by various adapters
    var settingsKeys = [
        SETTINGS.HIGHLIGHT_THICKNESS,
        TOGGLES.CUSTOM_STATUS_ENABLED,
        DATA.CUSTOM_STATUSES,
        DATA.CUSTOM_SITES,
        TOGGLES.QUICK_ACTIONS,
        TOGGLES.LIBRARY_SHOW_RIBBONS
    ];

    // We use a callback here because it is simpler than Promises
    chrome.storage.local.get(settingsKeys, function(settings) {
        if (chrome.runtime.lastError) {
            console.error("[BMH] Storage error:", chrome.runtime.lastError);
            return;
        }

        // Try to find a matching custom site configuration
        console.log("[BMH] Checking custom sites for " + currentHost + "...");
        
        var rawSites = settings[DATA.CUSTOM_SITES];
        var customSites = [];
        if (Array.isArray(rawSites)) {
            customSites = rawSites;
        }

        // Look for a match in our custom sites using a simple loop
        var customConfig = null;
        for (var i = 0; i < customSites.length; i++) {
            var s = customSites[i];
            if (s && s.enabled && currentHost.indexOf(s.hostname) !== -1) {
                customConfig = s;
                break;
            }
        }

        if (customConfig) {
            console.log('[BMH] Matched custom config:', customConfig);
            var adapter = new GenericAdapter(customConfig);

            // Check if this is a reader page first
            var isReader = adapter.isReaderPage();

            if (isReader) {
                console.log('[BMH] Reader page detected, initializing progress tracking');
                var tracker = new ProgressTracker(adapter);
                tracker.init();
            } else {
                // Listing/Gallery page: Always enhance cards
                console.log('[BMH] Gallery/Listing page detected, initializing card enhancements');
                initCustomSite(customConfig, settings);
            }
        } else {
            console.warn("[BMH] No adapter found for host: " + currentHost);
        }
    });
}

// Prevent multiple initializations in the same window
if (window.__BMH_INITIALIZED__) {
    console.log('[BMH] already initialized on this page, skipping');
} else {
    window.__BMH_INITIALIZED__ = true;

    // Initialize when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
}
