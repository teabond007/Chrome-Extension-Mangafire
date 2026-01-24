/**
 * @fileoverview MangaPlus Platform Adapter
 */

import { CardEnhancer } from '../../core/card-enhancer';
import { OverlayFactory } from '../../core/overlay-factory.js';
import ReaderEnhancements from '../../core/reader-enhancements.js';

export const MangaPlusAdapter = {
    id: 'mangaplus',
    name: 'MangaPlus',
    unitName: 'chapter',
    PREFIX: 'mp:',
    displayName: 'MangaPlus',
    hosts: ['mangaplus.shueisha.co.jp'],

    selectors: {
        cardContainer: 'div[class*="TitleList"]',
        card: 'a[href*="/titles/"]',
        cardTitle: 'h3, div[class*="TitleName"]',
        cardLink: 'a[href*="/titles/"]',
        cardCover: 'img'
    },

    extractCardData(cardElement: HTMLAnchorElement) {
        let title = '';
        let url = '';
        let id = '';

        url = cardElement.href;
        id = this.extractIdFromUrl(url);

        const titleEl = cardElement.querySelector('h3, div[class*="TitleName"], p');
        title = titleEl?.textContent?.trim() || '';

        return { id: id, title: title, slug: id, url: url };
    },

    extractIdFromUrl(url: string) {
        if (!url) return '';
        const match = url.match(/\/titles\/(\d+)/);
        return match ? match[1] : '';
    },

    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        const imgContainer = element.querySelector('div[class*="Cover"]') as HTMLElement;
        const target = imgContainer || element;

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('border-radius', '4px', 'important');
        target.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { top: '4px', right: '4px' };
    },

    buildChapterUrl(entry: any, chapter: number) {
        return null;
    },

    isReaderPage() {
        return window.location.href.includes('/viewer/');
    },

    parseUrl(url: string) {
        const id = this.extractIdFromUrl(url);
        if (!id) return null;
        return {
            slug: null,
            id: id,
            chapterNo: null
        };
    },

    goToNextChapter() {
        return;
    },

    goToPrevChapter() {
        return;
    },

    exitReader() {
        const closeBtn = document.querySelector('a[href*="/titles/"]') as HTMLElement;
        if (closeBtn) {
            closeBtn.click();
        } else {
            window.history.back();
        }
    }
};

export async function initMangaPlus(settings: any) {
    const log = (msg: string) => {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: 'log', text: `[MangaPlus] ${msg}` });
    };

    log('Initializing MangaPlus Adapter...');
    if (!document.getElementById('bmh-mangaplus-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-mangaplus-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const enhancer = new CardEnhancer(MangaPlusAdapter, {
        highlighting: true,
        progressBadges: settings.MangaPlusShowProgress !== false,
        quickActions: settings.MangaPlusQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    await enhancer.enhanceAll();

    if (MangaPlusAdapter.isReaderPage()) {
        setTimeout(() => saveReadChapter(log), 1500);
        const reader = new ReaderEnhancements(MangaPlusAdapter);
        reader.init();
    }

    const observer = new MutationObserver((mutations) => {
        const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
        if (hasNewNodes) {
            enhancer.enhanceAll();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
                (el as HTMLElement).dataset.bmhEnhanced = undefined;
            });
            setTimeout(() => enhancer.enhanceAll(), 1000);
            if (MangaPlusAdapter.isReaderPage()) {
                setTimeout(() => {
                    saveReadChapter(log);
                    const reader = new ReaderEnhancements(MangaPlusAdapter);
                    reader.init();
                }, 1500);
            }
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
}

function saveReadChapter(log: Function) {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const match = href.match(/\/viewer\/(\d+)/);
    const chapterId = match ? match[1] : null;
    if (!chapterId) return;

    const titleEl = document.querySelector('h1, a[href*="/titles/"]');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const backLink = document.querySelector('a[href*="/titles/"]') as HTMLAnchorElement;
    const mangaId = backLink ? MangaPlusAdapter.extractIdFromUrl(backLink.href) : null;
    if (!mangaId) return;

    const storageKey = `${MangaPlusAdapter.PREFIX}${mangaId}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;
        let history: { [key: string]: (string | number)[] } = data.savedReadChapters || {};
        if (!history[storageKey]) history[storageKey] = [];
        if (!(history[storageKey] as (string | number)[]).includes(chapterId)) {
            (history[storageKey] as (string | number)[]).push(chapterId);
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                log(`Saved chapter ${chapterId} for ${title}`);
            });
        }
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title,
            chapter: chapterId,
            slugWithId: `mangaplus-${mangaId}`,
            readChapters: (history[storageKey] as (string | number)[]).length,
            source: 'mangaplus'
        });
    });
}
