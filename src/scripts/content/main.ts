/**
 * @fileoverview Unified Content Script Entry Point
 * Detects the current platform and initializes the appropriate adapter.
 */

// Selector tool - auto-initializes when ?bmh-selector-mode=true is in URL
import './selector-tool';
import { initCustomSite, GenericAdapter } from '../core/generic-adapter';
import ReaderEnhancements from '../core/reader/reader-enhancements';
import { STORAGE_KEYS } from '../../config.js';

let isBootstrapping = false;

async function bootstrap() {
    if (isBootstrapping) return;
    if (!chrome.runtime?.id) return;

    isBootstrapping = true;
    const currentHost = window.location.hostname;

    // Load ALL settings needed by various adapters
    const settingsKeys = [
        STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS,
        STORAGE_KEYS.SETTINGS_CUSTOM_BORDER_SIZE_ENABLED,
        STORAGE_KEYS.SETTINGS_CUSTOM_STATUS_ENABLED,
        STORAGE_KEYS.CUSTOM_BOOKMARKS,
        STORAGE_KEYS.CUSTOM_SITES,
        STORAGE_KEYS.SETTINGS_CUSTOM_SITE_QUICK_ACTIONS,
        STORAGE_KEYS.SETTINGS_CUSTOM_SITE_HIGHLIGHT
    ];

    try {
        const settings: any = await new Promise(resolve => {
            chrome.storage.local.get(settingsKeys, resolve);
        });

        // Try to find a matching custom site configuration
        console.log(`[BMH] Checking custom sites for ${currentHost}...`);
        const customSites = settings[STORAGE_KEYS.CUSTOM_SITES] || [];

        const customConfig = customSites.find((s: any) =>
            s.enabled && currentHost.includes(s.hostname)
        );

        if (customConfig) {
            console.log('[BMH] Matched custom config:', customConfig);
            const adapter = new GenericAdapter(customConfig);
            
            // Check if this is a reader page first
            const isReader = adapter.isReaderPage();

            if (isReader) {
                // If it's a reader page, skip card enhancement (initCustomSite)
                // as it can cause performance issues and is usually not needed here.
                console.log('[BMH] Reader page detected, initializing reader enhancements');
                const enhancements = new ReaderEnhancements(adapter);
                await enhancements.init();
            } else {
                // Listing/Gallery page: Always enhance cards
                console.log('[BMH] Gallery/Listing page detected, initializing card enhancements');
                await initCustomSite(customConfig, settings);
            }
        } else {
            console.warn(`[BMH] No adapter found for host: ${currentHost}`);
        }
    } catch (e) {
        console.error(`[BMH] Failed to initialize adapter:`, e);
    } finally {
        // Reset guard after short delay to allow for late-loading elements
        setTimeout(() => { isBootstrapping = false; }, 1000);
    }
}

// Robust execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

window.addEventListener('load', () => {
    // Second pass for late-loading elements
    setTimeout(bootstrap, 500);
});
