/**
 * @fileoverview Webtoons Platform Adapter
 */

import { CardEnhancer } from '../../core/card-enhancer';
import { OverlayFactory } from '../../core/overlay-factory.js';
import ReaderEnhancements from '../../core/reader-enhancements.js';

export const WebtoonsAdapter = {
    id: 'webtoons',
    name: 'Webtoons',
    unitName: 'episode',
    PREFIX: 'webtoon:',
    displayName: 'Webtoons',
    hosts: ['www.webtoons.com', 'webtoons.com'],

    selectors: {
        card: 'li:has(a[class*="_title_a"])',
        cardTitle: '.title, .subj, strong.title',
        cardLink: 'a[class*="_title_a"], a.link',
        cardCover: 'img'
    },

    extractCardData(cardElement: HTMLElement) {
        let title = '';
        let url = '';
        let titleNo = '';
        let slug = '';

        const linkEl = cardElement.querySelector(this.selectors.cardLink) as HTMLAnchorElement ||
            (cardElement.tagName === 'A' ? cardElement as HTMLAnchorElement : null);

        if (linkEl) {
            url = linkEl.href;
            const info = this.extractInfoFromUrl(url);
            titleNo = info.titleNo;
            slug = info.slug;

            const titleEl = cardElement.querySelector('.title') ||
                cardElement.querySelector('.subj') ||
                cardElement.querySelector('p.subj') ||
                cardElement.querySelector('.info .subj') ||
                cardElement.querySelector('.info_area .subj');

            if (titleEl) {
                title = titleEl.textContent?.trim() || '';
            } else if (linkEl.getAttribute('title')) {
                title = linkEl.getAttribute('title') || '';
            }
        }

        return { id: titleNo, title, slug, url };
    },

    extractInfoFromUrl(href: string) {
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

    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        const target = element.closest('li') || element;
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('position', 'relative', 'important');
    },

    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    },

    buildChapterUrl(entry: any, chapter: number) {
        const baseUrl = entry.sourceUrl || entry.url;
        if (!baseUrl) return null;
        try {
            const url = new URL(baseUrl);
            if (url.pathname.endsWith('/list')) {
                url.pathname = url.pathname.replace('/list', '/viewer');
                url.searchParams.set('episode_no', String(chapter));
                return url.toString();
            }
        } catch (e) {
            return null;
        }
        return null;
    },

    isReaderPage() {
        return window.location.href.includes('episode_no') || window.location.href.includes('/viewer');
    },

    parseUrl(url: string) {
        const info = this.extractInfoFromUrl(url);
        return {
            slug: info.slug,
            id: info.titleNo,
            chapterNo: info.episodeNo ? parseFloat(info.episodeNo) : null
        };
    },

    goToNextChapter() {
        const nextBtn = document.querySelector('.pg_next') || document.querySelector('a.next') as HTMLElement;
        if (nextBtn) (nextBtn as HTMLElement).click();
    },

    goToPrevChapter() {
        const prevBtn = document.querySelector('.pg_prev') || document.querySelector('a.prev') as HTMLElement;
        if (prevBtn) (prevBtn as HTMLElement).click();
    },

    exitReader() {
        const listBtn = document.querySelector('#detail_list_btn') ||
            document.querySelector('a[href*="/list"]') as HTMLElement;
        if (listBtn) {
            (listBtn as HTMLElement).click();
        } else {
            const url = new URL(window.location.href);
            url.pathname = url.pathname.replace('/viewer', '/list');
            url.searchParams.delete('episode_no');
            window.location.href = url.toString();
        }
    }
};

export async function initWebtoons(settings: any) {
    const log = (msg: string) => {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: 'log', text: `[Webtoons] ${msg}` });
    };

    log('Initializing Webtoons Adapter...');
    if (!document.getElementById('bmh-webtoons-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-webtoons-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const enhancer = new CardEnhancer(WebtoonsAdapter, {
        highlighting: true,
        progressBadges: settings.WebtoonsShowProgress !== false,
        quickActions: settings.WebtoonsQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    await enhancer.enhanceAll();

    if (WebtoonsAdapter.isReaderPage()) {
        saveReadEpisode(log);
        const reader = new ReaderEnhancements(WebtoonsAdapter);
        reader.init();
    }

    const observer = new MutationObserver(() => {
        enhancer.enhanceAll();
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
            if (WebtoonsAdapter.isReaderPage()) {
                setTimeout(() => saveReadEpisode(log), 1000);
            }
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });
}

function saveReadEpisode(log: Function) {
    if (!chrome.runtime?.id) return;

    const href = window.location.href;
    const { slug, episodeNo } = WebtoonsAdapter.extractInfoFromUrl(href);
    if (!episodeNo || !slug) return;

    const titleEl = document.querySelector('.subj');
    const title = titleEl?.textContent?.trim();
    if (!title) return;

    const storageKey = `${WebtoonsAdapter.PREFIX}${slug}`;

    chrome.storage.local.get(['savedReadChapters'], (data) => {
        if (chrome.runtime.lastError) return;
        let history: Record<string, (string | number)[]> = data.savedReadChapters || {};
        if (!history[storageKey]) history[storageKey] = [];
        if (!(history[storageKey] as (string | number)[]).includes(episodeNo)) {
            (history[storageKey] as (string | number)[]).push(episodeNo);
            chrome.storage.local.set({ savedReadChapters: history }, () => {
                log(`Saved episode ${episodeNo} for ${title} (${slug})`);
            });
        }
        chrome.runtime.sendMessage({
            type: 'autoSyncEntry',
            title,
            chapter: episodeNo,
            slugWithId: `webtoon-${slug}`,
            readChapters: (history[storageKey] as (string | number)[]).length,
            source: 'webtoons'
        });
    });
}
