/**
 * @fileoverview MangaPlus Content Script (Webpack Bundled)
 * Uses ES6 imports from core modules for full feature support.
 * Includes Quick Actions Overlay from Phase 2.2.
 * 
 * Build: npm run build
 * @version 3.8.0
 */

import { CardEnhancer } from '../core/card-enhancer.js';
import { OverlayFactory } from '../core/overlay-factory.js';
import { Config, STATUS_COLORS } from '../core/config.js';
import ReaderEnhancements from '../core/reader-enhancements.js';

// ============================================================================
// MANGAPLUS ADAPTER
// ============================================================================

const MangaPlusAdapter = {
    id: 'mangaplus',
    name: 'MangaPlus',
    unitName: 'chapter',
    PREFIX: 'mp:',

    selectors: {
        cardContainer: 'div[class*="TitleList"]',
        card: 'a[href*="/titles/"]',
        cardTitle: 'h3, div[class*="TitleName"]',
        cardLink: 'a[href*="/titles/"]',
        cardCover: 'img'
    },

    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let id = '';

        url = cardElement.href;
        id = this.extractIdFromUrl(url);

        const titleEl = cardElement.querySelector('h3, div[class*="TitleName"], p');
        title = titleEl?.textContent?.trim() || '';

        return { id: id, title: title, slug: id, url: url }; // MangaPlus uses ID as slug essentially
    },

    extractIdFromUrl(url) {
        if (!url) return '';
        const match = url.match(/\/titles\/(\d+)/);
        return match ? match[1] : '';
    },

    applyBorder(element, color, size, style) {
        // Target the cover container or the element itself
        const imgContainer = element.querySelector('div[class*="Cover"]');
        const target = imgContainer || element;

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('border-radius', '4px', 'important');
        target.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { top: '4px', right: '4px' };
    },

    buildChapterUrl(entry, chapter) {
        return null; // Requires internal ID lookup
    },

    // Reader detection and navigation methods
    isReaderPage() {
        return window.location.href.includes('/viewer/');
    },

    parseUrl(url) {
        // MangaPlus reader URL: /viewer/100123
        const id = this.extractIdFromUrl(url);
        if (!id) return null;
        return {
            slug: null, // MangaPlus relies on IDs
            id: id,
            chapterNo: null // Can't reliably get chapter number from URL alone
        };
    },

    goToNextChapter() {
        // MangaPlus usually has seamless reading or end-of-chapter cards
        // Manual navigation is tricky to script without interfering with React state
        return; 
    },

    goToPrevChapter() {
        return;
    },

    exitReader() {
        // Find X or back button
        const closeBtn = document.querySelector('a[href*="/titles/"]');
        if (closeBtn) {
            closeBtn.click();
        } else {
            window.history.back();
        }
    }
};

// ============================================================================
// READING HISTORY TRACKING
// ============================================================================

function extractChapterIdFromUrl(url) {
    const match = url.match(/\/viewer\/(\d+)/);
    return match ? match[1] : null;
}

function saveReadChapter() {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const chapterId = extractChapterIdFromUrl(href);
    if (!chapterId) return;

    // Try to find the manga title from the page header
    const titleEl = document.querySelector('h1, a[href*="/titles/"]');
    const title = titleEl?.textContent?.trim();
    if (!title) {
        Log('Could not extract title from reader page');
        return;
    }

    // Try to extract the manga ID from a back button or link
    const backLink = document.querySelector('a[href*="/titles/"]');
    const mangaId = backLink ? MangaPlusAdapter.extractIdFromUrl(backLink.href) : null;

    if (!mangaId) {
        Log('Could not extract manga ID from reader page');
        return;
    }

    const storageKey = `${MangaPlusAdapter.PREFIX}${mangaId}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;

        let history = data.savedReadChapters || {};
        let isNewChapter = false;

        if (!history[storageKey]) {
            history[storageKey] = [];
        }

        if (!history[storageKey].includes(chapterId)) {
            history[storageKey].push(chapterId);
            isNewChapter = true;
        }

        const historyCount = history[storageKey].length;

        // Notify background
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title: title,
            chapter: chapterId,
            slugWithId: `mangaplus-${mangaId}`,
            readChapters: historyCount,
            source: 'mangaplus'
        }, () => {
            if (chrome.runtime.lastError) return;
        });

        if (isNewChapter) {
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                Log(`Saved chapter ${chapterId} for ${title}`);
            });
        }
    });
}

// ============================================================================
// UTILITIES
// ============================================================================

function Log(message) {
    if (!chrome.runtime?.id) return;
    const text = typeof message === 'object' ? JSON.stringify(message) : message;
    chrome.runtime.sendMessage({ type: 'log', text: `[MangaPlus] ${text}` }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
    });
}

function injectStyles() {
    if (document.getElementById('bmh-mangaplus-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-mangaplus-styles';
    styles.textContent = `
        @keyframes bmh-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(styles);

    OverlayFactory.injectStyles();
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function initMangaPlusEnhancer() {
    if (!chrome.runtime?.id) return;

    Log('MangaPlus CardEnhancer v3.8.0 (Bundled) initializing...');
    injectStyles();

    // Load user settings
    const settings = await new Promise(resolve => {
        chrome.storage.local.get([
            'MangaPlusHighlightEnabled',
            'MangaPlusQuickActionsEnabled',
            'CustomBorderSize',
            'CustomBorderSizefeatureEnabled',
            'CustomBookmarksfeatureEnabled',
            'customBookmarks',
            'MangaPlusShowProgress'
        ], data => {
            if (chrome.runtime.lastError) {
                resolve({});
                return;
            }
            resolve(data);
        });
    });

    // Check if highlighting is disabled
    if (settings.MangaPlusHighlightEnabled === false) {
        Log('Highlighting disabled');
        return;
    }

    // Create enhancer with settings
    const enhancer = new CardEnhancer(MangaPlusAdapter, {
        highlighting: true,
        progressBadges: settings.MangaPlusShowProgress !== false,
        quickActions: settings.MangaPlusQuickActionsEnabled !== false, // Default ON
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    // Initial enhancement
    const count = await enhancer.enhanceAll();
    Log(`Enhanced ${count} cards`);

    // Track reading on viewer pages & initialize reader enhancements
    if (window.location.href.includes('/viewer/')) {
        setTimeout(saveReadChapter, 1500);
        
        // Initialize reader enhancements
        // Note: MangaPlus might override key events, so capture phase in KeybindManager is crucial
        const reader = new ReaderEnhancements(MangaPlusAdapter);
        reader.init();
        Log('Reader enhancements initialized');
    }

    // Mutation observer for SPA
    const observer = new MutationObserver((mutations) => {
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (hasNewNodes) {
             enhancer.enhanceAll();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize on load
window.addEventListener('load', () => {
    setTimeout(initMangaPlusEnhancer, 1000);
});

// SPA Navigation
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    if (!chrome.runtime?.id) return;
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        
        document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
            delete el.dataset.bmhEnhanced;
        });

        setTimeout(initMangaPlusEnhancer, 1000);

        if (location.href.includes('/viewer/')) {
            setTimeout(() => {
                saveReadChapter();
                // Re-init reader enhancements on SPA nav
                const reader = new ReaderEnhancements(MangaPlusAdapter);
                reader.init();
            }, 1500);
        }
    }
});
urlObserver.observe(document, { subtree: true, childList: true });
