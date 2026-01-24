/**
 * @fileoverview Manganato Platform Adapter
 */

import { CardEnhancer } from '../../core/card-enhancer';
import { OverlayFactory } from '../../core/overlay-factory.js';
import ReaderEnhancements from '../../core/reader-enhancements.js';

export const ManganatoAdapter = {
    id: 'manganato',
    name: 'Manganato',
    unitName: 'chapter',
    PREFIX: 'manganato:',
    displayName: 'Manganato',
    hosts: ['manganato.com', 'chapmanganato.com'],

    selectors: {
        cardContainer: '.panel-content-genres, .daily-update, .truyen-list',
        card: '.content-genres-item, .list-truyen-item-wrap, .sh',
        cardTitle: 'h3 a, a.genres-item-name',
        cardLink: 'h3 a, a.genres-item-name',
        cardCover: 'img'
    },

    extractCardData(cardElement: HTMLElement) {
        let title = '';
        let url = '';
        let slug = '';

        const linkEl = cardElement.querySelector(this.selectors.cardLink) as HTMLAnchorElement ||
            (cardElement.tagName === 'A' ? cardElement as HTMLAnchorElement : null);

        if (linkEl) {
            title = linkEl.getAttribute('title') || linkEl.textContent?.trim() || '';
            url = linkEl.href;
            slug = this.extractSlug(url);
        }

        return { id: slug, title, slug, url };
    },

    extractSlug(url: string) {
        try {
            const path = new URL(url).pathname;
            return path.replace(/^\//, '').split('/')[0];
        } catch (e) {
            return '';
        }
    },

    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        element.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        element.style.setProperty('border-radius', '5px', 'important');
        element.style.setProperty('box-sizing', 'border-box', 'important');
        element.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    buildChapterUrl(entry: any, chapter: number) {
        return null;
    },

    isReaderPage() {
        return window.location.pathname.includes('chapter-');
    },

    parseUrl(url: string) {
        const match = url.match(/\/([^/]+)\/chapter-([\d.-]+)/);
        if (!match) return null;
        return {
            slug: match[1],
            chapterNo: parseFloat(match[2])
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('.navi-change-chapter-btn-next') as HTMLElement;
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('.navi-change-chapter-btn-prev') as HTMLElement;
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        const titleLink = document.querySelector('.panel-breadcrumb a:last-child') ||
            document.querySelector('a[href*="/manga-"]') as HTMLElement;
        if (titleLink) {
            (titleLink as HTMLElement).click();
        } else {
            window.history.back();
        }
    }
};

export async function initManganato(settings: any) {
    const log = (msg: string) => {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: 'log', text: `[Manganato] ${msg}` });
    };

    log('Initializing Manganato Adapter...');
    if (!document.getElementById('bmh-manganato-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-manganato-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const enhancer = new CardEnhancer(ManganatoAdapter, {
        highlighting: true,
        progressBadges: settings.ManganatoShowProgress !== false,
        quickActions: settings.ManganatoQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    await enhancer.enhanceAll();

    if (ManganatoAdapter.isReaderPage()) {
        saveReadChapter(log);
        const reader = new ReaderEnhancements(ManganatoAdapter);
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
            if (ManganatoAdapter.isReaderPage()) {
                setTimeout(() => {
                    saveReadChapter(log);
                    const reader = new ReaderEnhancements(ManganatoAdapter);
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
    const match = href.match(/\/chapter[/-]?([\d.-]+)/i);
    const chapterNo = match ? match[1] : null;
    if (!chapterNo) return;

    const titleEl = document.querySelector('.panel-chapter-info-top h1, .story-info-right h1');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const slug = ManganatoAdapter.extractSlug(href);
    const storageKey = `${ManganatoAdapter.PREFIX}${slug}`;

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
            slugWithId: `manganato-${slug}`,
            readChapters: (history[storageKey] as (string | number)[]).length,
            source: 'manganato'
        });
    });
}
