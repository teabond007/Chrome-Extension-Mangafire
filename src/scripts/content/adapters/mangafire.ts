/**
 * @fileoverview MangaFire Platform Adapter
 * Preserves original functionality while standardizing for the unified entry point.
 */

import { CardEnhancer } from '../../core/card-enhancer';
import { OverlayFactory } from '../../core/overlay-factory.js';
import ReaderEnhancements from '../../core/reader-enhancements.js';

export const MangaFireAdapter = {
    id: 'mangafire',
    name: 'MangaFire',
    unitName: 'chapter',
    PREFIX: '',  // MangaFire uses direct title keys (legacy)
    displayName: 'MangaFire',
    hosts: ['mangafire.to'],

    selectors: {
        card: '.unit, .swiper-slide, #top-trending .swiper-slide',
        cardTitle: '.info a, .info h6 a, .above a',
        cardLink: 'a[href*="/manga/"]',
        cardCover: '.poster img, img'
    },

    extractCardData(cardElement: HTMLElement) {
        let title = '';
        let url = '';
        let slug = '';

        const titleEl = cardElement.querySelector('.info a') ||
            cardElement.querySelector('.info h6 a') ||
            cardElement.querySelector('.above a');

        if (titleEl) {
            title = titleEl.textContent?.trim() || '';
        }

        const linkEl = cardElement.querySelector(this.selectors.cardLink) as HTMLAnchorElement;
        if (linkEl) {
            url = linkEl.href;
            slug = this.extractSlug(url);
        }

        return { id: slug, title, slug, url };
    },

    extractSlug(url: string) {
        if (!url) return '';
        try {
            const match = url.match(/\/manga\/([^/?#]+)/);
            return match ? match[1] : '';
        } catch (e) {
            return '';
        }
    },

    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        let target = element;

        if (element.classList.contains('swiper-slide')) {
            const inner = element.querySelector('.swiper-inner') as HTMLElement || element;
            inner.style.setProperty('border-left', `${size}px ${style} ${color}`, 'important');
            return;
        }

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

    buildChapterUrl(entry: any, chapter: number) {
        return null;
    },

    isReaderPage() {
        return window.location.href.includes('/read/');
    },

    parseUrl(url: string) {
        const match = url.match(/\/read\/([^/]+)\.?(\d*)\/(?:[^/]+\/)?chapter-([^/?#]+)/);
        if (!match) return null;
        return {
            slug: match[1],
            id: match[2] || null,
            chapterNo: parseFloat(match[3])
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('a.btn-next, .chapter-nav .next, [data-direction="next"]') as HTMLElement;
        if (nextBtn) nextBtn.click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('a.btn-prev, .chapter-nav .prev, [data-direction="prev"]') as HTMLElement;
        if (prevBtn) prevBtn.click();
    },

    exitReader() {
        const detailLink = document.querySelector('a.manga-link, a[href*="/manga/"]') as HTMLAnchorElement;
        if (detailLink) {
            window.location.href = detailLink.href;
        } else {
            window.history.back();
        }
    }
};

/**
 * MangaFire-specific initialization logic
 */
export async function initMangaFire(settings: any) {
    const log = (msg: string) => {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: 'log', text: `[MangaFire] ${msg}` }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
        });
    };

    log('Initializing MangaFire Adapter...');

    // Inject custom styles
    if (!document.getElementById('bmh-mangafire-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-mangafire-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const enhancer = new CardEnhancer(MangaFireAdapter, {
        highlighting: true,
        progressBadges: settings.MangaFireShowProgress !== false,
        quickActions: settings.MangaFireQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    await enhancer.enhanceAll();

    if (MangaFireAdapter.isReaderPage()) {
        saveReadChapter(log);
        const reader = new ReaderEnhancements(MangaFireAdapter);
        reader.init();
    }

    // Dynamic content tracking
    let debounceTimer: any;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => enhancer.enhanceAll(), 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // SPA tracking
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            document.querySelectorAll('[data-bmh-enhanced]').forEach(el => {
                (el as HTMLElement).dataset.bmhEnhanced = undefined;
            });
            setTimeout(() => enhancer.enhanceAll(), 500);
            if (MangaFireAdapter.isReaderPage()) {
                setTimeout(() => saveReadChapter(log), 1000);
            }
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
}

function saveReadChapter(log: Function) {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const match = href.match(/\/read\/([^/]+)\/(?:[^/]+\/)?chapter-([^/?#]+)/);
    if (!match) return;

    const slugWithId = match[1];
    const chapter = match[2];
    let title = slugWithId.includes('.') ? slugWithId.substring(0, slugWithId.lastIndexOf('.')) : slugWithId;
    if (title.endsWith('gg')) title = title.slice(0, -1);

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;
        let history: { [key: string]: (string | number)[] } = data.savedReadChapters || {};
        if (!history[title]) history[title] = [];
        if (!(history[title] as (string | number)[]).includes(chapter)) {
            (history[title] as (string | number)[]).push(chapter);
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                if (chrome.runtime.lastError) return;
                log(`Saved chapter ${chapter} for ${title}`);
            });
        }
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title,
            chapter,
            slugWithId,
            readChapters: history[title].length,
            source: 'mangafire'
        });
    });
}
