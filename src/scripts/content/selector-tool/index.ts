/**
 * @fileoverview Selector Tool - Entry Point
 * Initializes the DOM selector tool when the page is loaded with
 * the ?bmh-selector-mode=true query parameter.
 * @module selector-tool/index
 */

import { createPanel } from './panel';

/**
 * Checks URL for selector mode flag and initializes the tool.
 */
export function initSelectorTool(): void {
    const url = new URL(window.location.href);
    const selectorMode = url.searchParams.get('bmh-selector-mode');
    const siteId = url.searchParams.get('bmh-site-id');

    console.log('[BMH Selector] Checking URL params:', { selectorMode, siteId, href: window.location.href });

    if (selectorMode === 'true' && siteId) {
        console.log('[BMH Selector] Selector mode detected, initializing panel...');
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('[BMH Selector] DOM ready, creating panel');
                    createPanel(siteId);
                });
            } else {
                console.log('[BMH Selector] DOM already ready, creating panel now');
                createPanel(siteId);
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

