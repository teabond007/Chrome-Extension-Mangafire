/**
 * @fileoverview Webtoons Platform Adapter
 * Implements the PlatformAdapter interface for Webtoons.com
 * 
 * @module platforms/webtoons/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * Webtoons adapter implementing the cross-platform interface.
 * Uses "episode" terminology instead of "chapter".
 * @extends PlatformAdapter
 */
export class WebtoonsAdapter extends PlatformAdapter {
    // Platform identification
    static id = 'webtoons';
    static name = 'Webtoons';
    static icon = '📺';
    static color = '#00D564';
    static urlPatterns = [
        /webtoons\.com/i,
        /webtoon\.com/i
    ];
    static unitName = 'episode'; // Webtoons uses "episodes"

    /** Namespace prefix for storage */
    static PREFIX = 'webtoon:';

    // DOM selectors for Webtoons
    static selectors = {
        // Homepage cards
        cardContainer: '.daily_card, .card_wrap, .ranking_lst',
        card: 'li[class*="card"], .daily_card_item, .ranking_item, .challenge_item',
        cardTitle: '.title, .subj, a[title]',
        cardLink: 'a[href*="/webtoon/"], a[href*="/challenge/"]',
        cardCover: '.thumb img, .pic img, img',

        // Originals/Canvas listing
        originalsCard: '.daily_card_item',
        canvasCard: '.challenge_item',

        // Reader (Viewer) page
        readerContainer: '.viewer_img, #content',
        readerImage: '.viewer_img img',

        // Genre/archive pages
        genreCard: '.card_item',
        archiveCard: '.NE=a:tlist'
    };

    /**
     * Extract data from a Webtoons card element.
     * @param {HTMLElement} cardElement - The card element.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        let title = '';
        let url = '';
        let coverUrl = '';
        let titleNo = '';
        let slug = '';

        // Find title - try multiple patterns
        const titleEl = cardElement.querySelector('.title, .subj, [class*="title"]');
        const linkEl = cardElement.querySelector('a[href*="/webtoon/"], a[href*="/challenge/"]');
        const coverEl = cardElement.querySelector('img');

        if (titleEl) {
            title = titleEl.textContent?.trim() || titleEl.getAttribute('title') || '';
        } else if (linkEl) {
            title = linkEl.getAttribute('title') || linkEl.textContent?.trim() || '';
        }

        if (linkEl?.href) {
            url = linkEl.href;
            const parsed = this.extractInfoFromUrl(url);
            titleNo = parsed.titleNo;
            slug = parsed.slug;
        }

        if (coverEl?.src) {
            coverUrl = coverEl.src;
        }

        return {
            id: titleNo,
            title,
            slug,
            url,
            coverUrl
        };
    }

    /**
     * Extract info from Webtoons URL.
     * @param {string} href - Full URL.
     * @returns {{titleNo: string, slug: string, episodeNo: string|null}}
     */
    static extractInfoFromUrl(href) {
        const result = { titleNo: '', slug: '', episodeNo: null };

        try {
            const url = new URL(href);
            const pathname = url.pathname;

            // Extract slug from path: /en/webtoon/{slug}/...
            const slugMatch = pathname.match(/\/(?:webtoon|challenge)\/([^/]+)/);
            if (slugMatch) {
                result.slug = slugMatch[1];
            }

            // Extract titleNo from query: ?title_no=123
            result.titleNo = url.searchParams.get('title_no') || '';

            // Extract episode number if present
            result.episodeNo = url.searchParams.get('episode_no') || null;

        } catch (e) {
            console.warn('[Webtoons] Failed to parse URL:', href);
        }

        return result;
    }

    /**
     * Parse a Webtoons URL to extract type, ID, and episode.
     * @param {string} url - URL to parse.
     * @returns {{type: string, id: string, slug: string, chapterNo: string|null}}
     */
    static parseUrl(url) {
        const info = this.extractInfoFromUrl(url);

        // Viewer page has episode_no
        if (info.episodeNo) {
            return {
                type: 'reader',
                id: info.titleNo,
                slug: info.slug,
                chapterNo: info.episodeNo
            };
        }

        // Series page
        if (info.titleNo) {
            return {
                type: 'manga', // Still use 'manga' for consistency
                id: info.titleNo,
                slug: info.slug,
                chapterNo: null
            };
        }

        // Homepage or listing
        return {
            type: 'listing',
            id: '',
            slug: '',
            chapterNo: null
        };
    }

    /**
     * Custom border application for Webtoons.
     * Webtoons uses LI elements, need to target parent properly.
     * @param {HTMLElement} element - Element to apply border to.
     * @param {string} color - Border color.
     * @param {number} size - Border size.
     * @param {string} style - Border style.
     */
    static applyBorder(element, color, size, style) {
        // Webtoons cards are typically inside li elements
        let target = element.closest('li') ||
                     element.closest('.card_item') ||
                     element;

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('overflow', 'hidden', 'important');
    }

    /**
     * Get badge position for Webtoons cards.
     * @returns {{bottom: string, left: string}}
     */
    static getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    }

    /**
     * Get storage key with webtoon namespace.
     * @param {string} slug - Webtoon slug.
     * @returns {string} Namespaced key.
     */
    static getStorageKey(slug) {
        return `${this.PREFIX}${slug}`;
    }
}

// Auto-register when module loads
PlatformRegistry.register(WebtoonsAdapter);

export default WebtoonsAdapter;
