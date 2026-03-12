/**
 * @fileoverview Selector Tool - Entry Point
 * Initializes the DOM selector tool when the page is loaded with
 * the ?bmh-selector-mode=true or ?bmh-reader-selector-mode=true query parameter.
 * @module selector-tool/index
 */

import { createPanel } from './panel';

/**
 * Checks URL for selector mode flags and initializes the tool.
 * Supports listing mode (card/title selectors) and reader mode (detect/title/chapter).
 */
export function initSelectorTool() {
    const url = new URL(window.location.href);
    const selectorMode = url.searchParams.get('bmh-selector-mode');
    const readerSelectorMode = url.searchParams.get('bmh-reader-selector-mode');
    const siteId = url.searchParams.get('bmh-site-id');

    const isActive = selectorMode === 'true' || readerSelectorMode === 'true';
    const isReaderMode = readerSelectorMode === 'true';

    console.log('[BMH Selector] Checking URL params:', { selectorMode, readerSelectorMode, siteId, href: window.location.href });

    if (isActive && siteId) {
        console.log(`[BMH Selector] ${isReaderMode ? 'Reader' : 'Listing'} selector mode detected, initializing panel...`);
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('[BMH Selector] DOM ready, creating panel');
                    createPanel(siteId, isReaderMode);
                });
            } else {
                console.log('[BMH Selector] DOM already ready, creating panel now');
                createPanel(siteId, isReaderMode);
            }
        } catch (err) {
            console.error('[BMH Selector] Failed to create panel:', err);
        }
    } else {
        console.log('[BMH Selector] Selector mode not active');
    }
}

// Auto-initialize on import
console.log('[BMH Selector] Module loaded');
initSelectorTool();

