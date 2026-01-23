/**
 * @fileoverview Webtoons Content Script (Webpack Bundled)
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

console.log("[Webtoons] Script loaded! URL:", window.location.href);

// ============================================================================
// WEBTOONS ADAPTER
// ============================================================================

const WebtoonsAdapter = {
    id: 'webtoons',
    name: 'Webtoons',
    unitName: 'episode',
    PREFIX: 'webtoon:',

    selectors: {
        // Select LI elements that contain the title anchor tags
        // This covers Daily, Trending, Genre, Canvas, etc. which all use '..._title_a' classes
        card: 'li:has(a[class*="_title_a"])',
        
        // Title text is usually in a strong tag with class .title or .subj
        cardTitle: '.title, .subj, strong.title',
        
        // The main anchor tag
        cardLink: 'a[class*="_title_a"], a.link',
        
        // Cover image
        cardCover: 'img'
    },

    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let titleNo = '';
        let slug = '';

        const linkEl = cardElement.querySelector(this.selectors.cardLink) || 
                      (cardElement.tagName === 'A' ? cardElement : null);

        if (linkEl) {
            url = linkEl.href;
            const info = this.extractInfoFromUrl(url);
            titleNo = info.titleNo;
            slug = info.slug;

            // Try multiple title selectors
            const titleEl = cardElement.querySelector('.title') ||
                           cardElement.querySelector('.subj') ||
                           cardElement.querySelector('p.subj') ||
                           cardElement.querySelector('.info .subj') ||
                           cardElement.querySelector('.info_area .subj');
            
            if (titleEl) {
                title = titleEl.textContent?.trim() || '';
            } else if (linkEl.getAttribute('title')) {
                title = linkEl.getAttribute('title');
            }
        }

        return { id: titleNo, title, slug, url };
    },

    extractInfoFromUrl(href) {
        if (!href) return { titleNo: '', slug: '', episodeNo: null };
        try {
            const url = new URL(href);
            const slugMatch = url.pathname.match(/\/(?:webtoon|challenge)\/([^/]+)/);
            const slug = slugMatch ? slugMatch[1] : '';
            const titleNo = url.searchParams.get('title_no') || '';
            const episodeNo = url.searchParams.get('episode_no') || null;
            return { titleNo, slug, episodeNo };
        } catch (e) {
            return { titleNo: '', slug: '', episodeNo: null };
        }
    },

    applyBorder(element, color, size, style) {
        // Webtoons cards are typically LIs or wrappers
        const target = element.closest('li') || element;
        
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        
        // Ensure relative positioning for badge placement
        target.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    /**
     * Build episode URL for continue reading.
     * Webtoons uses title_no and episode_no params.
     */
    buildChapterUrl(entry, chapter) {
        const baseUrl = entry.sourceUrl || entry.url;
        if (!baseUrl) return null;
        
        // Convert list URL to viewer URL
        // From: .../title/list?title_no=123
        // To:   .../title/viewer?title_no=123&episode_no=456
        
        try {
            const url = new URL(baseUrl);
            if (url.pathname.endsWith('/list')) {
                url.pathname = url.pathname.replace('/list', '/viewer');
                url.searchParams.set('episode_no', chapter);
                return url.toString();
            }
        } catch (e) {
            return null;
        }
        return null;
    },

    // Reader detection and navigation methods
    isReaderPage() {
        return window.location.href.includes('episode_no') || window.location.href.includes('/viewer');
    },

    parseUrl(url) {
        // Can use existing extractInfoFromUrl
        const info = this.extractInfoFromUrl(url);
        return {
            slug: info.slug,
            id: info.titleNo,
            chapterNo: parseFloat(info.episodeNo)
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('.pg_next') || document.querySelector('a.next');
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('.pg_prev') || document.querySelector('a.prev');
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        // Go back to the list page (found in top breadcrumbs usually)
        const listBtn = document.querySelector('#detail_list_btn') || 
                       document.querySelector('a[href*="/list"]');
        if (listBtn) {
            listBtn.click();
        } else {
            // Try modifying URL: /viewer -> /list
            const url = new URL(window.location.href);
            url.pathname = url.pathname.replace('/viewer', '/list');
            url.searchParams.delete('episode_no');
            window.location.href = url.toString();
        }
    }
};

// ============================================================================
// READING HISTORY TRACKING
// ============================================================================

function saveReadEpisode() {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const { titleNo, slug, episodeNo } = WebtoonsAdapter.extractInfoFromUrl(href);
    
    if (!episodeNo) return;

    // Get title from page
    const titleEl = document.querySelector('.subj');
    const title = titleEl?.textContent?.trim();

    if (!title || !slug) return;

    const storageKey = `${WebtoonsAdapter.PREFIX}${slug}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;

        let history = data.savedReadChapters || {};

        if (!history[storageKey]) {
            history[storageKey] = [];
        }

        if (!history[storageKey].includes(episodeNo)) {
            history[storageKey].push(episodeNo);

            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                Log(`Saved episode ${episodeNo} for ${title} (${slug})`);
            });
        }

        // Notify background
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title: title,
            chapter: episodeNo,
            slugWithId: `webtoon-${slug}`,
            readChapters: history[storageKey].length,
            source: 'webtoons'
        }, () => {
            if (chrome.runtime.lastError) return;
        });
    });
}

// ============================================================================
// UTILITIES
// ============================================================================

function Log(message) {
    const text = typeof message === 'object' ? JSON.stringify(message) : message;
    console.log(`[Webtoons] ${text}`);
    if (!chrome.runtime?.id) return;
    chrome.runtime.sendMessage({ type: 'log', text: `[Webtoons] ${text}` }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
    });
}

function injectStyles() {
    if (document.getElementById('bmh-webtoons-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-webtoons-styles';
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

async function initWebtoonsEnhancer() {
    if (!chrome.runtime?.id) return;

    Log('Webtoons CardEnhancer v3.8.0 (Bundled) initializing...');
    injectStyles();

    // Load user settings
    const settings = await new Promise(resolve => {
        chrome.storage.local.get([
            'WebtoonsHighlightEnabled',
            'WebtoonsQuickActionsEnabled', // Quick Action Toggle
            'CustomBorderSize',
            'CustomBorderSizefeatureEnabled',
            'CustomBookmarksfeatureEnabled',
            'customBookmarks',
            'WebtoonsShowProgress'
        ], data => {
            if (chrome.runtime.lastError) {
                resolve({});
                return;
            }
            resolve(data);
        });
    });

    // Check if highlighting is disabled
    if (settings.WebtoonsHighlightEnabled === false) {
        Log('Highlighting disabled');
        return;
    }

    // Create enhancer with settings
    const enhancer = new CardEnhancer(WebtoonsAdapter, {
        highlighting: true,
        progressBadges: settings.WebtoonsShowProgress !== false,
        quickActions: settings.WebtoonsQuickActionsEnabled !== false, // Enabled by default
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    // Initial enhancement
    const cards = enhancer.findCards();
    Log(`Found ${cards.length} potential cards`);
    if (cards.length > 0) {
        Log(`Sample card data: ${JSON.stringify(cards[0].data)}`);
    }

    const count = await enhancer.enhanceAll();
    Log(`Enhanced ${count} cards (Quick Actions: ${settings.WebtoonsQuickActionsEnabled !== false ? 'ON' : 'OFF'})`);

    // Track reading on viewer pages & initialize reader enhancements
    if (location.href.includes('episode_no')) {
        saveReadEpisode();
        
        // Initialize reader enhancements
        const reader = new ReaderEnhancements(WebtoonsAdapter);
        reader.init();
        Log('Reader enhancements initialized');
    }

    // Mutation observer
    const observer = new MutationObserver(() => {
        enhancer.enhanceAll();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Robust initialization for document_idle scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initWebtoonsEnhancer, 800));
} else {
    setTimeout(initWebtoonsEnhancer, 500);
}

window.addEventListener('load', () => setTimeout(initWebtoonsEnhancer, 500));

// URL change handler (for SPA-like behavior if any)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
    if (!chrome.runtime?.id) return;

    if (location.href !== lastUrl) {
        lastUrl = location.href;

        document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
            delete el.dataset.bmhEnhanced;
        });

        setTimeout(initWebtoonsEnhancer, 500);

        if (location.href.includes('episode_no')) {
            setTimeout(saveReadEpisode, 1000);
        }
    }
});
urlObserver.observe(document, { subtree: true, childList: true });
