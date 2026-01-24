/**
 * @fileoverview MangaDex Platform Adapter
 */

import { CardEnhancer } from '../../core/card-enhancer';
import { OverlayFactory } from '../../core/overlay-factory.js';
import ReaderEnhancements from '../../core/reader-enhancements.js';

export const MangaDexAdapter = {
    id: 'mangadex',
    name: 'MangaDex',
    unitName: 'chapter',
    PREFIX: 'mangadex:',
    displayName: 'MangaDex',
    hosts: ['mangadex.org'],

    selectors: {
        card: '.manga-card, .hchaptercard, [class*="chapter-feed__container"]',
        cardTitle: 'a[href*="/title/"] h6, a.title span, a.title, [class*="title"]',
        cardLink: 'a[href*="/title/"]',
        cardCover: '.manga-card-cover img, img'
    },

    extractCardData(cardElement: HTMLElement) {
        let title = '';
        let url = '';
        let uuid = '';

        const linkEl = cardElement.querySelector(this.selectors.cardLink) as HTMLAnchorElement;

        if (linkEl) {
            url = linkEl.href;
            uuid = this.extractUUID(url);

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

    extractUUID(url: string) {
        if (!url) return '';
        const match = url.match(/\/(title|chapter)\/([a-f0-9-]{36})/i);
        return match ? match[2] : '';
    },

    slugify(title: string) {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    },

    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        let target: HTMLElement;
        if (element.classList.contains('hchaptercard')) {
            target = element.querySelector('a[href*="/title/"]') as HTMLElement || element;
        } else {
            target = element.querySelector('.manga-card-cover') as HTMLElement || element;
        }

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    buildChapterUrl(entry: any, chapter: number) {
        return null;
    },

    isReaderPage() {
        return window.location.href.includes('/chapter/');
    },

    parseUrl(url: string) {
        return null;
    },

    goToNextChapter() {
        const nextBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('Next') || a.textContent?.includes('next'));
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('Previous') || a.textContent?.includes('Prev'));
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        const titleLink = document.querySelector('a[href*="/title/"]') as HTMLElement;
        if (titleLink) {
            titleLink.click();
        } else {
            window.history.back();
        }
    }
};

export async function initMangaDex(settings: any) {
    const log = (msg: string) => {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: 'log', text: `[MangaDex] ${msg}` });
    };

    log('Initializing MangaDex Adapter...');
    if (!document.getElementById('bmh-mangadex-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-mangadex-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const enhancer = new CardEnhancer(MangaDexAdapter, {
        highlighting: true,
        progressBadges: settings.MangaDexShowProgress !== false,
        quickActions: settings.MangaDexQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    await enhancer.enhanceAll();

    if (MangaDexAdapter.isReaderPage()) {
        saveReadChapter(log);
        const reader = new ReaderEnhancements(MangaDexAdapter);
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
            setTimeout(() => enhancer.enhanceAll(), 500);
            if (MangaDexAdapter.isReaderPage()) {
                setTimeout(() => {
                    saveReadChapter(log);
                    const reader = new ReaderEnhancements(MangaDexAdapter);
                    reader.init();
                }, 1000);
            }
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
}

function saveReadChapter(log: Function) {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const match = href.match(/\/chapter\/([a-f0-9-]{36})/i);
    const chapterUUID = match ? match[1] : null;
    if (!chapterUUID) return;

    const titleEl = document.querySelector('[class*="title"]') || document.querySelector('a[href*="/title/"]');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const mangaLink = document.querySelector('a[href*="/title/"]') as HTMLAnchorElement;
    const mangaUUID = mangaLink ? MangaDexAdapter.extractUUID(mangaLink.href) : null;

    const storageKey = mangaUUID ? `${MangaDexAdapter.PREFIX}${mangaUUID}` : title;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;
        let history: { [key: string]: (string | number)[] } = data.savedReadChapters || {};
        if (!history[storageKey]) history[storageKey] = [];
        if (!(history[storageKey] as (string | number)[]).includes(chapterUUID)) {
            (history[storageKey] as (string | number)[]).push(chapterUUID);
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                log(`Saved chapter ${chapterUUID} for ${title}`);
            });
        }
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title,
            chapter: chapterUUID,
            slugWithId: `mangadex-${mangaUUID || 'unknown'}`,
            readChapters: history[storageKey].length,
            source: 'mangadex'
        });
    });
}
