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
    let selectorMode = url.searchParams.get('bmh-selector-mode');
    let readerSelectorMode = url.searchParams.get('bmh-reader-selector-mode');
    let siteId = url.searchParams.get('bmh-site-id');

    // Save to sessionStorage if present in URL
    if (selectorMode || readerSelectorMode) {
        sessionStorage.setItem('bmh-selector-mode', selectorMode || '');
        sessionStorage.setItem('bmh-reader-selector-mode', readerSelectorMode || '');
        sessionStorage.setItem('bmh-site-id', siteId || '');
    } else {
        // Restore from sessionStorage if URL params are missing (e.g. after redirect)
        selectorMode = sessionStorage.getItem('bmh-selector-mode');
        readerSelectorMode = sessionStorage.getItem('bmh-reader-selector-mode');
        siteId = sessionStorage.getItem('bmh-site-id');
    }

    const isActive = selectorMode === 'true' || readerSelectorMode === 'true';
    const isReaderMode = readerSelectorMode === 'true';

    console.log('[BMH Selector] Checking state:', { selectorMode, readerSelectorMode, siteId, href: window.location.href });

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
