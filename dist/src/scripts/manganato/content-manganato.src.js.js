/**
 * @fileoverview Manganato Content Script (Webpack Bundled)
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
// MANGANATO ADAPTER
// ============================================================================

const ManganatoAdapter = {
    id: 'manganato',
    name: 'Manganato',
    unitName: 'chapter',
    PREFIX: 'manganato:',

    selectors: {
        cardContainer: '.panel-content-genres, .daily-update, .truyen-list',
        card: '.content-genres-item, .list-truyen-item-wrap, .sh',
        cardTitle: 'h3 a, a.genres-item-name',
        cardLink: 'h3 a, a.genres-item-name',
        cardCover: 'img'
    },

    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let slug = '';

        const linkEl = cardElement.querySelector(this.selectors.cardLink) ||
                      (cardElement.tagName === 'A' ? cardElement : null);

        if (linkEl) {
            title = linkEl.getAttribute('title') || linkEl.textContent?.trim() || '';
            url = linkEl.href;
            slug = this.extractSlug(url);
        }

        return { id: slug, title, slug, url };
    },

    extractSlug(url) {
        try {
            const path = new URL(url).pathname;
            return path.replace(/^\//, '').split('/')[0]; // Get first path segment
        } catch (e) {
            return '';
        }
    },

    applyBorder(element, color, size, style) {
        element.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        element.style.setProperty('border-radius', '5px', 'important');
        element.style.setProperty('box-sizing', 'border-box', 'important');
        element.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    buildChapterUrl(entry, chapter) {
        return null; // Navigation fallback to manga page
    },

    // Reader detection and navigation methods
    isReaderPage() {
        return window.location.pathname.includes('chapter-');
    },

    parseUrl(url) {
        // Manganato URLs: /manga-id/chapter-123
        const match = url.match(/\/([^/]+)\/chapter-([\d.-]+)/);
        if (!match) return null;
        return {
            slug: match[1],
            chapterNo: parseFloat(match[2])
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('.navi-change-chapter-btn-next');
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('.navi-change-chapter-btn-prev');
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        // Go back to manga title page
        // Usually breadcrumbs or title link
        const titleLink = document.querySelector('.panel-breadcrumb a:last-child') || 
                         document.querySelector('a[href*="/manga-"]');
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

function extractChapterFromUrl(url) {
    try {
        const path = new URL(url).pathname;
        const parts = path.split('/');
        // Usually /manga-id/chapter-123
        const chapterPart = parts.find(p => p.startsWith('chapter-'));
        return chapterPart ? chapterPart.replace('chapter-', '') : null;
    } catch (e) {
        return null;
    }
}

function saveReadChapter() {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const chapterNo = extractChapterFromUrl(href);
    if (!chapterNo) return;

    // Get manga title from page
    const titleEl = document.querySelector('.panel-chapter-info-top h1, .story-info-right h1');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const slug = ManganatoAdapter.extractSlug(href);
    const storageKey = `${ManganatoAdapter.PREFIX}${slug}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;

        let history = data.savedReadChapters || {};
        let isNewChapter = false;

        if (!history[storageKey]) {
            history[storageKey] = [];
        }

        if (!history[storageKey].includes(chapterNo)) {
            history[storageKey].push(chapterNo);
            isNewChapter = true;
        }

        const historyCount = history[storageKey].length;

        // Notify background
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title: title,
            chapter: chapterNo,
            slugWithId: `manganato-${slug}`,
            readChapters: historyCount,
            source: 'manganato'
        }, () => {
            if (chrome.runtime.lastError) return;
        });

        if (isNewChapter) {
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                Log(`Saved chapter ${chapterNo} for ${title}`);
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
    chrome.runtime.sendMessage({ type: 'log', text: `[Manganato] ${text}` }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
    });
}

function injectStyles() {
    if (document.getElementById('bmh-manganato-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-manganato-styles';
    styles.textContent = `
        @keyframes bmh-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        .bmh-progress-badge {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
    `;
    document.head.appendChild(styles);

    OverlayFactory.injectStyles();
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function initManganatoEnhancer() {
    if (!chrome.runtime?.id) return;

    Log('Manganato CardEnhancer v3.8.0 (Bundled) initializing...');
    injectStyles();

    // Load user settings
    const settings = await new Promise(resolve => {
        chrome.storage.local.get([
            'ManganatoHighlightEnabled',
            'ManganatoQuickActionsEnabled',
            'CustomBorderSize',
            'CustomBorderSizefeatureEnabled',
            'CustomBookmarksfeatureEnabled',
            'customBookmarks',
            'ManganatoShowProgress'
        ], data => {
            if (chrome.runtime.lastError) {
                resolve({});
                return;
            }
            resolve(data);
        });
    });

    // Check if highlighting is disabled
    if (settings.ManganatoHighlightEnabled === false) {
        Log('Highlighting disabled');
        return;
    }

    // Create enhancer with settings
    const enhancer = new CardEnhancer(ManganatoAdapter, {
        highlighting: true,
        progressBadges: settings.ManganatoShowProgress !== false,
        quickActions: settings.ManganatoQuickActionsEnabled !== false, // Default ON
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    // Initial enhancement
    const count = await enhancer.enhanceAll();
    Log(`Enhanced ${count} cards`);

    // Track reading on chapter pages & initialize reader enhancements
    if (window.location.pathname.includes('chapter-')) {
        saveReadChapter();
        
        // Initialize reader enhancements
        const reader = new ReaderEnhancements(ManganatoAdapter);
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
}

// Robust initialization for document_idle scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initManganatoEnhancer, 800));
} else {
    setTimeout(initManganatoEnhancer, 500);
}

window.addEventListener('load', () => setTimeout(initManganatoEnhancer, 500));

// URL Watcher
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    if (!chrome.runtime?.id) return;
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        
        document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
            delete el.dataset.bmhEnhanced;
        });

        setTimeout(initManganatoEnhancer, 500);
        
        if (location.pathname.includes('chapter-')) {
            setTimeout(saveReadChapter, 500);
        }
    }
});
urlObserver.observe(document, { subtree: true, childList: true });
