/**
 * @fileoverview Asura Scans Platform Adapter
 */

import { CardEnhancer } from '../../core/card-enhancer';
import { OverlayFactory } from '../../core/overlay-factory.js';
import ReaderEnhancements from '../../core/reader-enhancements.js';

export const AsuraAdapter = {
    id: 'asurascans',
    name: 'Asura Scans',
    unitName: 'chapter',
    PREFIX: 'asura:',
    displayName: 'Asura Scans',
    hosts: ['asuracomic.net', 'asurascans.com', 'asuratoon.com'],

    selectors: {
        card: 'a[href*="/series/"]:has(img), div.grid.grid-cols-12:has(a[href*="/series/"])',
        cardTitle: 'span.font-medium, a[href*="/series/"] span, h2, h3',
        cardLink: 'a[href*="/series/"]',
        cardCover: 'img.object-cover, img'
    },

    extractCardData(cardElement: HTMLElement) {
        let title = '';
        let url = '';
        let slug = '';

        const linkEl = cardElement.tagName === 'A' ? cardElement as HTMLAnchorElement : cardElement.querySelector('a[href*="/series/"]') as HTMLAnchorElement;

        if (linkEl) {
            url = linkEl.href;
            slug = this.extractSlug(url);

            const titleEl = cardElement.querySelector(this.selectors.cardTitle) ||
                linkEl.querySelector('span') ||
                linkEl;
            title = titleEl.textContent?.trim() || '';
            title = title.split(/\n|Chapter/i)[0].trim();
        }

        if (!title && cardElement.classList.contains('grid')) {
            const titleLink = cardElement.querySelector('span.font-medium a, a[href*="/series/"]') as HTMLAnchorElement;
            if (titleLink) {
                title = titleLink.textContent?.trim() || '';
                url = titleLink.href;
                slug = this.extractSlug(url);
            }
        }

        return { id: slug, title, slug, url };
    },

    extractSlug(url: string) {
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

    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        element.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        element.style.setProperty('border-radius', '8px', 'important');
        element.style.setProperty('box-sizing', 'border-box', 'important');
    },

    getBadgePosition() {
        return { bottom: '8px', left: '8px' };
    },

    buildChapterUrl(entry: any, chapter: number) {
        if (entry.slug) {
            return `https://asuracomic.net/series/${entry.slug}/chapter-${chapter}`;
        }
        return null;
    },

    isReaderPage() {
        return window.location.href.includes('/chapter');
    },

    parseUrl(url: string) {
        const match = url.match(/\/series\/([^/]+)\/chapter[/-]?([\d.-]+)/i);
        if (!match) return null;
        return {
            slug: match[1],
            chapterNo: parseFloat(match[2])
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('a[href*="/chapter"]:has(svg[class*="right"]), button:has(svg[stroke*="next"]), .next-chapter') as HTMLElement;
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('a[href*="/chapter"]:has(svg[class*="left"]), button:has(svg[stroke*="prev"]), .prev-chapter') as HTMLElement;
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        const seriesLink = document.querySelector('a[href*="/series/"]:not([href*="/chapter"])') as HTMLAnchorElement;
        if (seriesLink) {
            window.location.href = seriesLink.href;
        } else {
            window.history.back();
        }
    }
};

export async function initAsura(settings: any) {
    const log = (msg: string) => {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: 'log', text: `[AsuraScans] ${msg}` });
    };

    log('Initializing Asura Scans Adapter...');
    if (!document.getElementById('bmh-asura-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-asura-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const enhancer = new CardEnhancer(AsuraAdapter, {
        highlighting: true,
        progressBadges: true,
        quickActions: settings.AsuraScansQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    await enhancer.enhanceAll();

    if (AsuraAdapter.isReaderPage()) {
        saveReadChapter(log);
        const reader = new ReaderEnhancements(AsuraAdapter);
        reader.init();
    }

    let debounceTimer: any;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => enhancer.enhanceAll(), 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
                (el as HTMLElement).dataset.bmhEnhanced = undefined;
            });
            setTimeout(() => enhancer.enhanceAll(), 800);
            if (AsuraAdapter.isReaderPage()) {
                setTimeout(() => saveReadChapter(log), 1000);
            }
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
}

function saveReadChapter(log: Function) {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const match = href.match(/\/chapter[/-]?([\d.-]+)/i);
    const chapterNo = match ? match[1] : null;
    if (!chapterNo) return;

    const titleEl = document.querySelector('h1, span.font-bold, a[href*="/series/"]');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const slug = AsuraAdapter.extractSlug(href);
    const storageKey = `${AsuraAdapter.PREFIX}${slug}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;
        let history: { [key: string]: (string | number)[] } = data.savedReadChapters || {};
        if (!history[storageKey]) history[storageKey] = [];
        if (!(history[storageKey] as (string | number)[]).includes(chapterNo)) {
            (history[storageKey] as (string | number)[]).push(chapterNo);
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                log(`Saved chapter ${chapterNo} for ${title}`);
            });
        }
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title,
            chapter: chapterNo,
            slugWithId: `asura-${slug}`,
            readChapters: history[storageKey].length,
            source: 'asurascans'
        });
    });
}
