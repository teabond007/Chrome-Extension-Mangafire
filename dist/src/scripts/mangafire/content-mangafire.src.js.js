/**
 * @fileoverview MangaFire Content Script (Webpack Bundled)
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
// MANGAFIRE ADAPTER
// ============================================================================

const MangaFireAdapter = {
    id: 'mangafire',
    name: 'MangaFire',
    unitName: 'chapter',
    PREFIX: '',  // MangaFire uses direct title keys (legacy)

    selectors: {
        card: '.unit, .swiper-slide, #top-trending .swiper-slide',
        cardTitle: '.info a, .info h6 a, .above a',
        cardLink: 'a[href*="/manga/"]',
        cardCover: '.poster img, img'
    },

    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let slug = '';

        // Try to find title element
        const titleEl = cardElement.querySelector('.info a') ||
                       cardElement.querySelector('.info h6 a') ||
                       cardElement.querySelector('.above a');
        
        if (titleEl) {
            title = titleEl.textContent?.trim() || '';
        }

        // Find manga link
        const linkEl = cardElement.querySelector(this.selectors.cardLink);
        if (linkEl) {
            url = linkEl.href;
            slug = this.extractSlug(url);
        }

        return { id: slug, title, slug, url };
    },

    extractSlug(url) {
        if (!url) return '';
        try {
            const match = url.match(/\/manga\/([^/?#]+)/);
            return match ? match[1] : '';
        } catch (e) {
            return '';
        }
    },

    applyBorder(element, color, size, style) {
        // MangaFire uses different container types
        // For Swiper slides, target the inner content
        let target = element;
        
        // Check if it's a swiper slide (Top Trending uses left border)
        if (element.classList.contains('swiper-slide')) {
            const inner = element.querySelector('.swiper-inner') || element;
            inner.style.setProperty('border-left', `${size}px ${style} ${color}`, 'important');
            return;
        }

        // For regular units, target li element if present
        const li = element.closest('li');
        if (li) {
            target = li;
        }

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    /**
     * Build chapter URL for continue reading.
     * MangaFire URLs often contain internal IDs, so simple construction is risky.
     * Fallback to manga page for safety.
     */
    buildChapterUrl(entry, chapter) {
        // Potential TODO: precise URL construction if format is reliable
        return null;
    },

    // Reader navigation methods for keybinds
    isReaderPage() {
        return window.location.href.includes('/read/');
    },

    parseUrl(url) {
        const match = url.match(/\/read\/([^/]+)\.?(\d*)\/(?:[^/]+\/)?chapter-([^/?#]+)/);
        if (!match) return null;
        return {
            slug: match[1],
            id: match[2] || null,
            chapterNo: parseFloat(match[3])
        };
    },

    goToNextChapter() {
        // MangaFire has navigation buttons
        const nextBtn = document.querySelector('a.btn-next, .chapter-nav .next, [data-direction="next"]');
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('a.btn-prev, .chapter-nav .prev, [data-direction="prev"]');
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        // Navigate to manga detail page
        const detailLink = document.querySelector('a.manga-link, a[href*="/manga/"]');
        if (detailLink) {
            window.location.href = detailLink.href;
        } else {
            window.history.back();
        }
    }
};

// ============================================================================
// READING HISTORY TRACKING
// ============================================================================

function cleanHrefToTitle(href) {
    if (!href) return { title: '', chapter: '', slugWithId: '' };

    const match = href.match(/\/read\/([^/]+)\/(?:[^/]+\/)?chapter-([^/?#]+)/);
    if (!match) return { title: '', chapter: '', slugWithId: '' };

    const slugWithId = match[1];
    const chapter = match[2];

    let title = slugWithId.includes('.')
        ? slugWithId.substring(0, slugWithId.lastIndexOf('.'))
        : slugWithId;

    if (title.endsWith('gg')) {
        title = title.slice(0, -1);
    }

    return { title, chapter, slugWithId };
}

function saveReadChapter() {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const { title, chapter, slugWithId } = cleanHrefToTitle(href);
    
    if (!title || !chapter) return;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;

        let history = data.savedReadChapters || {};

        if (!history[title]) {
            history[title] = [];
        }

        if (!history[title].includes(chapter)) {
            history[title].push(chapter);

            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                Log(`Saved chapter ${chapter} for ${title}`);
            });
        }

        // Notify background
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title: title,
            chapter: chapter,
            slugWithId: slugWithId,
            readChapters: history[title].length,
            source: 'mangafire'
        }, () => {
            if (chrome.runtime.lastError) return;
        });
    });
}

// ============================================================================
// UTILITIES
// ============================================================================

function Log(message) {
    if (!chrome.runtime?.id) return;
    const text = typeof message === 'object' ? JSON.stringify(message) : message;
    chrome.runtime.sendMessage({ type: 'log', text: `[MangaFire] ${text}` }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
    });
}

function injectStyles() {
    if (document.getElementById('bmh-mangafire-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-mangafire-styles';
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

async function initMangaFireEnhancer() {
    if (!chrome.runtime?.id) return;

    Log('MangaFire CardEnhancer v3.8.0 (Bundled) initializing...');
    injectStyles();

    // Load user settings
    const settings = await new Promise(resolve => {
        chrome.storage.local.get([
            'MangaFireHighlightEnabled',
            'MangaFireQuickActionsEnabled', // Quick Action Toggle
            'CustomBorderSize',
            'CustomBorderSizefeatureEnabled',
            'CustomBookmarksfeatureEnabled',
            'customBookmarks',
            'MangaFireShowProgress'
        ], data => {
            if (chrome.runtime.lastError) {
                resolve({});
                return;
            }
            resolve(data);
        });
    });

    // Check if highlighting is disabled
    if (settings.MangaFireHighlightEnabled === false) {
        Log('Highlighting disabled');
        return;
    }

    // Create enhancer with settings
    const enhancer = new CardEnhancer(MangaFireAdapter, {
        highlighting: true,
        progressBadges: settings.MangaFireShowProgress !== false,
        quickActions: settings.MangaFireQuickActionsEnabled !== false, // Enabled by default
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    // Initial enhancement
    const count = await enhancer.enhanceAll();
    Log(`Enhanced ${count} cards (Quick Actions: ${settings.MangaFireQuickActionsEnabled !== false ? 'ON' : 'OFF'})`);

    // Track reading on chapter pages & initialize reader enhancements
    if (window.location.href.includes('/read/')) {
        saveReadChapter();
        
        // Initialize reader enhancements (auto-scroll, keybinds, progress)
        const reader = new ReaderEnhancements(MangaFireAdapter);
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

            if (location.href.includes('/read/')) {
                setTimeout(saveReadChapter, 1000);
            }
        }
    });

    urlObserver.observe(document, { subtree: true, childList: true });
}

// Initialize on load
window.addEventListener('load', () => {
    setTimeout(initMangaFireEnhancer, 500);
});
