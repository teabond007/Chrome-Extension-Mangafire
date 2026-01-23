/**
 * @fileoverview MangaDex Content Script (Webpack Bundled)
 * Uses ES6 imports from core modules for full feature support.
 * Includes Quick Actions Overlay from Phase 2.2.
 * 
 * Build: npm run build
 * @version 3.8.0
 */

import { CardEnhancer } from "/src/scripts/core/card-enhancer.ts.js";
import { OverlayFactory } from "/src/scripts/core/overlay-factory.js.js";
import { Config, STATUS_COLORS } from "/src/scripts/core/config.js.js";
import ReaderEnhancements from "/src/scripts/core/reader-enhancements.js.js";

// ============================================================================
// MANGADEX ADAPTER
// ============================================================================

const MangaDexAdapter = {
    id: 'mangadex',
    name: 'MangaDex',
    unitName: 'chapter',
    PREFIX: 'mangadex:',

    selectors: {
        card: '.manga-card, .hchaptercard, [class*="chapter-feed__container"]',
        cardTitle: 'a[href*="/title/"] h6, a.title span, a.title, [class*="title"]',
        cardLink: 'a[href*="/title/"]',
        cardCover: '.manga-card-cover img, img'
    },

    /**
     * Extract manga data from a card element.
     * @param {HTMLElement} cardElement - The card DOM element
     * @returns {Object} Extracted card data
     */
    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let uuid = '';

        const linkEl = cardElement.querySelector(this.selectors.cardLink);
        
        if (linkEl) {
            url = linkEl.href;
            uuid = this.extractUUID(url);

            // Try multiple title selectors for different card layouts
            let titleEl;
            if (cardElement.classList.contains('hchaptercard')) {
                titleEl = cardElement.querySelector('a[href*="/title/"] h6');
            } else {
                titleEl = cardElement.querySelector('a.title span') ||
                         cardElement.querySelector('a.title') ||
                         cardElement.querySelector('[class*="title"]');
            }
            
            title = titleEl?.textContent?.trim() || '';
        }

        return { id: uuid, title, slug: this.slugify(title), url };
    },

    extractUUID(url) {
        if (!url) return '';
        const match = url.match(/\/(title|chapter)\/([a-f0-9-]{36})/i);
        return match ? match[2] : '';
    },

    slugify(title) {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    },

    applyBorder(element, color, size, style) {
        // Find best target for border based on card type
        let target;
        if (element.classList.contains('hchaptercard')) {
            target = element.querySelector('a[href*="/title/"]') || element;
        } else {
            target = element.querySelector('.manga-card-cover') || element;
        }

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('position', 'relative', 'important');
        
        // Store reference for badge placement
        element._bmhBorderTarget = target;
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    /**
     * Build chapter URL for continue reading.
     * Returns null for MangaDex as it requires UUIDs not numbers.
     * Fallback to main manga page will be used.
     */
    buildChapterUrl(entry, chapter) {
        return null;
    },

    // Reader detection and navigation methods
    isReaderPage() {
        return window.location.href.includes('/chapter/');
    },

    parseUrl(url) {
        // MangaDex uses UUIDs, so simple parsing of chapter number from URL is hard
        // We rely on page content parsing by ProgressTracker fallback
        return null; 
    },

    goToNextChapter() {
        // MangaDex has a specific UI for this, often right/left areas or menu
        // Try finding a link that looks like next chapter
        // This is tricky on SPA, might need specific selector research
        // For now, try finding "Next" button/link
        const nextBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Next') || a.textContent.includes('next'));
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Previous') || a.textContent.includes('Prev'));
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        // Go back to title page (usually /title/uuid)
        const titleLink = document.querySelector('a[href*="/title/"]');
        if (titleLink) {
            titleLink.click();
        } else {
            window.history.back();
        }
    }
};

// ============================================================================
// READING HISTORY TRACKING
// ============================================================================

/**
 * Extract chapter UUID from URL.
 */
function extractChapterUUID(url) {
    const match = url.match(/\/chapter\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
}

/**
 * Save current chapter to reading history.
 */
function saveReadChapter() {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const chapterUUID = extractChapterUUID(href);
    if (!chapterUUID) return;

    // For MangaDex, we need to get the manga info from the page
    const titleEl = document.querySelector('[class*="title"]') ||
                   document.querySelector('a[href*="/title/"]');
    const title = titleEl?.textContent?.trim();
    
    if (!title) {
        Log('Could not extract title from reader page');
        return;
    }

    // Try to get manga UUID from a link on the page
    const mangaLink = document.querySelector('a[href*="/title/"]');
    const mangaUUID = mangaLink ? MangaDexAdapter.extractUUID(mangaLink.href) : null;

    const storageKey = mangaUUID 
        ? `${MangaDexAdapter.PREFIX}${mangaUUID}`
        : title;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;

        let history = data.savedReadChapters || {};

        if (!history[storageKey]) {
            history[storageKey] = [];
        }

        if (!history[storageKey].includes(chapterUUID)) {
            history[storageKey].push(chapterUUID);

            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                Log(`Saved chapter ${chapterUUID} for ${title}`);
            });
        }

        // Notify background
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title: title,
            chapter: chapterUUID,
            slugWithId: `mangadex-${mangaUUID || 'unknown'}`,
            readChapters: history[storageKey].length,
            source: 'mangadex'
        }, () => {
            if (chrome.runtime.lastError) return;
        });
    });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Log messages via extension messaging.
 * @param {string|Object} message - Message to log
 */
function Log(message) {
    if (!chrome.runtime?.id) return;
    const text = typeof message === 'object' ? JSON.stringify(message) : message;
    chrome.runtime.sendMessage({ type: 'log', text: `[MangaDex] ${text}` }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
    });
}

/**
 * Inject CSS styles for animations.
 */
function injectStyles() {
    if (document.getElementById('bmh-mangadex-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-mangadex-styles';
    styles.textContent = `
        @keyframes bmh-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(styles);

    // Inject overlay styles
    OverlayFactory.injectStyles();
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Initialize the MangaDex card enhancer with Quick Actions.
 */
async function initMangaDexEnhancer() {
    if (!chrome.runtime?.id) return;

    Log('MangaDex CardEnhancer v3.8.0 (Bundled) initializing...');
    injectStyles();

    // Load user settings
    const settings = await new Promise(resolve => {
        chrome.storage.local.get([
            'MangaDexHighlightEnabled',
            'MangaDexQuickActionsEnabled', // Quick Action Toggle
            'CustomBorderSize',
            'CustomBorderSizefeatureEnabled',
            'CustomBookmarksfeatureEnabled',
            'customBookmarks',
            'MangaDexShowProgress'
        ], data => {
            if (chrome.runtime.lastError) {
                resolve({});
                return;
            }
            resolve(data);
        });
    });

    // Check if highlighting is disabled
    if (settings.MangaDexHighlightEnabled === false) {
        Log('Highlighting disabled');
        return;
    }

    // Create enhancer with settings
    const enhancer = new CardEnhancer(MangaDexAdapter, {
        highlighting: true,
        progressBadges: settings.MangaDexShowProgress !== false,
        quickActions: settings.MangaDexQuickActionsEnabled !== false, // Enabled by default
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    // Initial enhancement
    const count = await enhancer.enhanceAll();
    Log(`Enhanced ${count} cards (Quick Actions: ${settings.MangaDexQuickActionsEnabled !== false ? 'ON' : 'OFF'})`);

    // Track reading on chapter pages & initialize reader enhancements
    if (window.location.href.includes('/chapter/')) {
        saveReadChapter();
        
        // Initialize reader enhancements
        const reader = new ReaderEnhancements(MangaDexAdapter);
        reader.init();
        Log('Reader enhancements initialized');
    }

    // Mutation observer for dynamic content
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => enhancer.enhanceAll(), 200);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // SPA navigation handler
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;

            // Reset enhanced status
            document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
                delete el.dataset.bmhEnhanced;
            });

            setTimeout(() => enhancer.enhanceAll(), 500);

            if (location.href.includes('/chapter/')) {
                setTimeout(() => {
                    saveReadChapter();
                    // Re-init reader enhancements on SPA nav
                    const reader = new ReaderEnhancements(MangaDexAdapter);
                    reader.init();
                }, 1000);
            }
        }
    });

    urlObserver.observe(document, { subtree: true, childList: true });
}

// Robust initialization for document_idle scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initMangaDexEnhancer, 800));
} else {
    setTimeout(initMangaDexEnhancer, 500);
}

window.addEventListener('load', () => setTimeout(initMangaDexEnhancer, 500));
