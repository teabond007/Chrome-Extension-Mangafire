/**
 * @fileoverview Unified Content Script Entry Point
 * Detects the current platform and initializes the appropriate adapter.
 */

// Selector tool - auto-initializes when ?bmh-selector-mode=true is in URL
import './selector-tool';
import { initCustomSite, GenericAdapter } from '../core/generic-adapter';
import ReaderEnhancements from '../core/reader/reader-enhancements';
import { TOGGLES, SETTINGS, DATA } from '../../config.js';

// Prevent multiple initializations in the same window/frame
if ((window as any).__BMH_INITIALIZED__) {
    console.log('[BMH] already initialized on this page, skipping');
} else {
    (window as any).__BMH_INITIALIZED__ = true;

    async function bootstrap() {
        if (!chrome.runtime?.id) return;

        const currentHost = window.location.hostname;

        // Load ALL settings needed by various adapters
        const settingsKeys = [
            SETTINGS.HIGHLIGHT_THICKNESS,
            TOGGLES.CUSTOM_BORDER_SIZE_ENABLED,
            TOGGLES.CUSTOM_STATUS_ENABLED,
            DATA.CUSTOM_STATUSES,
            DATA.CUSTOM_SITES,
            TOGGLES.CUSTOM_SITE_QUICK_ACTIONS,
            TOGGLES.CUSTOM_SITE_HIGHLIGHT,
            TOGGLES.CUSTOM_SITE_GLOW_EFFECT,
            TOGGLES.CUSTOM_SITE_SHOW_RIBBONS
        ];

        try {
            const settings: any = await new Promise(resolve => {
                chrome.storage.local.get(settingsKeys, resolve);
            });

            // Try to find a matching custom site configuration
            console.log(`[BMH] Checking custom sites for ${currentHost}...`);
            const rawSites = settings[DATA.CUSTOM_SITES];
            const customSites = Array.isArray(rawSites) ? rawSites : [];
            const customConfig = customSites.find((s: any) =>
                s && s.enabled && currentHost.includes(s.hostname)
            );

            if (customConfig) {
                console.log('[BMH] Matched custom config:', customConfig);
                const adapter = new GenericAdapter(customConfig);
                
                // Check if this is a reader page first
                const isReader = adapter.isReaderPage();

                if (isReader) {
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
        }
    }

    // Initialize as early as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

    // Fallback for extremely late-loading content or dynamic updates
    window.addEventListener('load', () => {
        // Only run if bootstrap hasn't successfully run yet or if new content might have loaded
        // However, with __BMH_INITIALIZED__ we only run ONCE per page context.
        // If the user wants a "second pass", we should handle that inside adapters.
        // For now, let's keep it simple to fix the "runs twice" issue.
    });
}
