/**
 * @fileoverview Unified Content Script Entry Point
 * Detects the current platform and initializes the appropriate adapter.
 */

// Selector tool - auto-initializes when ?bmh-selector-mode=true is in URL
import './selector-tool';
import { initCustomSite, GenericAdapter } from '../core/generic-adapter';
import ReaderEnhancements from '../core/reader/reader-enhancements';
import { STORAGE_KEYS } from '../../config.js';

async function bootstrap() {
    if (!chrome.runtime?.id) return;

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
            // Always enhance cards on any page
            await initCustomSite(customConfig, settings);

            // Additionally track progress if reader page is explicitly detected
            const adapter = new GenericAdapter(customConfig);
            if (customConfig.readerSelectors?.readerDetect && adapter.isReaderPage()) {
                console.log('[BMH] Reader page detected for custom site, initializing reader enhancements');
                const enhancements = new ReaderEnhancements(adapter);
                await enhancements.init();
            }
        } else {
            console.warn(`[BMH] No adapter found for host: ${currentHost}`);
        }
    } catch (e) {
        console.error(`[BMH] Failed to initialize adapter:`, e);
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
