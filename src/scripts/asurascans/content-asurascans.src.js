/**
 * @fileoverview Asura Scans Content Script (Webpack Bundled)
 * Uses ES6 imports from core modules for full feature support.
 * Includes Quick Actions Overlay from Phase 2.2.
 * 
 * Build: npm run build
 * @version 3.8.0
 */

import { CardEnhancer } from '../core/card-enhancer';
import { OverlayFactory } from '../core/overlay-factory.js';
import { Config } from '../core/config.js';
import ReaderEnhancements from '../core/reader-enhancements.js';



// ============================================================================
// ASURA ADAPTER
// ============================================================================

/**
 * Platform adapter for Asura Scans websites.
 * Provides selectors and methods specific to Asura's DOM structure.
 */
const AsuraAdapter = {
    id: 'asurascans',
    name: 'Asura Scans',
    unitName: 'chapter',
    PREFIX: 'asura:',

    selectors: {
        card: 'a[href*="/series/"]:has(img), div.grid.grid-cols-12:has(a[href*="/series/"])',
        cardTitle: 'span.font-medium, a[href*="/series/"] span, h2, h3',
        cardLink: 'a[href*="/series/"]',
        cardCover: 'img.object-cover, img'
    },

    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let slug = '';

        const linkEl = cardElement.tagName === 'A' ? cardElement : cardElement.querySelector('a[href*="/series/"]');

        if (linkEl) {
            url = linkEl.href;
            slug = this.extractSlug(url);

            const titleEl = cardElement.querySelector(this.selectors.cardTitle) ||
                           linkEl.querySelector('span') ||
                           linkEl;
            title = titleEl.textContent?.trim() || '';
            title = title.split(/\n|Chapter/i)[0].trim();
        }

        // Handle grid rows (Latest Updates section)
        if (!title && cardElement.classList.contains('grid')) {
            const titleLink = cardElement.querySelector('span.font-medium a, a[href*="/series/"]');
            if (titleLink) {
                title = titleLink.textContent?.trim();
                url = titleLink.href;
                slug = this.extractSlug(url);
            }
        }

        return { id: slug, title, slug, url };
    },

    extractSlug(url) {
        try {
            const parts = new URL(url).pathname.split('/').filter(p => p);
            const seriesIndex = parts.indexOf('series');
            if (seriesIndex !== -1 && parts[seriesIndex + 1]) {
                return parts[seriesIndex + 1];
            }
            return parts[parts.length - 1];
        } catch (e) {
            return '';
        }
    },

    applyBorder(element, color, size, style) {
        element.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        element.style.setProperty('border-radius', '8px', 'important');
        element.style.setProperty('box-sizing', 'border-box', 'important');
    },

    getBadgePosition() {
        return { bottom: '8px', left: '8px' };
    },

    buildChapterUrl(entry, chapter) {
        if (entry.slug) {
            return `https://asuracomic.net/series/${entry.slug}/chapter-${chapter}`;
        }
        return null;
    },

    isReaderPage() {
        return window.location.href.includes('/chapter');
    },

    parseUrl(url) {
        const match = url.match(/\/series\/([^/]+)\/chapter[/-]?([\d.-]+)/i);
        if (!match) return null;
        return {
            slug: match[1],
            chapterNo: parseFloat(match[2])
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('a[href*="/chapter"]:has(svg[class*="right"]), button:has(svg[stroke*="next"]), .next-chapter');
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('a[href*="/chapter"]:has(svg[class*="left"]), button:has(svg[stroke*="prev"]), .prev-chapter');
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        const seriesLink = document.querySelector('a[href*="/series/"]:not([href*="/chapter"])');
        if (seriesLink) {
            window.location.href = seriesLink.href;
        } else {
            window.history.back();
        }
    }
};



function extractChapterFromUrl(url) {
    const match = url.match(/\/chapter[/-]?([\d.-]+)/i);
    return match ? match[1] : null;
}

function saveReadChapter() {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const chapterNo = extractChapterFromUrl(href);
    if (!chapterNo) return;

    const titleEl = document.querySelector('h1, span.font-bold, a[href*="/series/"]');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const slug = AsuraAdapter.extractSlug(href);
    const storageKey = `${AsuraAdapter.PREFIX}${slug}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;

        let history = data.savedReadChapters || {};

        if (!history[storageKey]) {
            history[storageKey] = [];
        }

        if (!history[storageKey].includes(chapterNo)) {
            history[storageKey].push(chapterNo);

            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                Log(`Saved chapter ${chapterNo} for ${title}`);
            });
        }

        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title: title,
            chapter: chapterNo,
            slugWithId: `asura-${slug}`,
            readChapters: history[storageKey].length,
            source: 'asurascans'
        }, () => {
            if (chrome.runtime.lastError) return;
        });
    });
}



function Log(message) {
    if (!chrome.runtime?.id) return;
    const text = typeof message === 'object' ? JSON.stringify(message) : message;
    chrome.runtime.sendMessage({ type: 'log', text: `[AsuraScans] ${text}` }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
    });
}

function injectStyles() {
    if (document.getElementById('bmh-asura-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-asura-styles';
    styles.textContent = `
        @keyframes bmh-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(styles);
    OverlayFactory.injectStyles();
}



async function initAsuraEnhancer() {
    try {
        if (!chrome.runtime?.id) {
            console.error("[AsuraScans] Invalid runtime ID");
            return;
        }

        Log('Asura Scans CardEnhancer v3.8.0 (with Quick Actions) initializing...');
        injectStyles();

        Log('Fetching settings...');
        const settings = await new Promise(resolve => {
            chrome.storage.local.get([
                'AsuraScansHighlightEnabled',
                'AsuraScansQuickActionsEnabled',
                'CustomBorderSize',
                'CustomBorderSizefeatureEnabled',
                'CustomBookmarksfeatureEnabled',
                'customBookmarks'
            ], data => {
                if (chrome.runtime.lastError) {
                    Log(`Settings error: ${chrome.runtime.lastError.message}`);
                    resolve({});
                    return;
                }
                resolve(data);
            });
        });
        Log(`Settings loaded: ${JSON.stringify(settings)}`);

        if (settings.AsuraScansHighlightEnabled === false) {
            Log('Highlighting disabled');
            return;
        }

        if (typeof CardEnhancer === 'undefined') {
            Log('CRITICAL: CardEnhancer is undefined!');
            return;
        }

        const enhancer = new CardEnhancer(AsuraAdapter, {
            highlighting: true,
            progressBadges: true,
            quickActions: settings.AsuraScansQuickActionsEnabled !== false,
            CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
            CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
            customBookmarks: settings.customBookmarks
        });

        const cards = enhancer.findCards();
        Log(`Found ${cards.length} potential cards`);
        
        const count = await enhancer.enhanceAll();
        Log(`Enhanced ${count} cards`);

        if (window.location.href.includes('/chapter')) {
            Log('Initializing reader features...');
            saveReadChapter();
            const reader = new ReaderEnhancements(AsuraAdapter);
            reader.init();
            Log('Reader enhancements initialized');
        }

        let debounceTimer;
        const observer = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => enhancer.enhanceAll(), 200);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        let lastUrl = location.href;
        const urlObserver = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
                    delete el.dataset.bmhEnhanced;
                });
                setTimeout(() => enhancer.enhanceAll(), 800);
                if (location.href.includes('/chapter')) {
                    setTimeout(saveReadChapter, 1000);
                }
            }
        });
        urlObserver.observe(document, { subtree: true, childList: true });
    } catch (e) {
        console.error("[AsuraScans] CRITICAL ERROR:", e);
        Log(`CRITICAL ERROR: ${e.message}`);
    }
}

// Robust initialization for document_idle scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initAsuraEnhancer, 800));
} else {
    setTimeout(initAsuraEnhancer, 500);
}

window.addEventListener('load', () => setTimeout(initAsuraEnhancer, 500));

