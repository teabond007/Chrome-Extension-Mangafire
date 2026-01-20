/**
 * @fileoverview Asura Scans Platform Adapter
 * Implements the PlatformAdapter interface for Asura Scans.
 * 
 * @module platforms/asurascans/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * Asura Scans adapter.
 * Updated for the new Tailwind-based layout (Jan 2025).
 * @extends PlatformAdapter
 */
export class AsuraScansAdapter extends PlatformAdapter {
    static id = 'asurascans';
    static name = 'Asura Scans';
    static icon = '⚔️';
    static color = '#8A2BE2'; // Violet/Purple theme
    static urlPatterns = [
        /asuracomic\.net/i,
        /asuratoon\.com/i,
        /asurascans\.com/i
    ];
    static unitName = 'chapter';
    static PREFIX = 'asura:';

    /**
     * DOM selectors for Asura Scans.
     * Updated for the new Tailwind-based layout (Jan 2025).
     */
    static selectors = {
        // Homepage / Listing
        cardContainer: 'div.grid',
        card: 'a[href*="/series/"]:has(img), div.grid.grid-cols-12:has(a[href*="/series/"])', 
        cardTitle: 'span.font-medium, a[href*="/series/"] span, h2, h3',
        cardLink: 'a[href*="/series/"]',
        cardCover: 'img.object-cover, img',
        
        // Reader
        readerContainer: 'div.flex.flex-col.items-center.justify-center', // Main wrapper for images
        readerImage: 'img[alt*="chapter"]'
    };

    /**
     * Extract data from a card element.
     * @param {HTMLElement} cardElement - The card element.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        let title = '';
        let url = '';
        let coverUrl = '';
        let slug = '';

        // Case 1: cardElement is the <a> tag itself (Grid view)
        const linkEl = cardElement.tagName === 'A' ? cardElement : cardElement.querySelector('a[href*="/series/"]');
        
        if (linkEl) {
            url = linkEl.href;
            slug = this.extractSlug(url);

            // Title is usually in a span inside the link, or text of the link
            const titleEl = linkEl.querySelector('span') || linkEl;
            title = titleEl.textContent?.trim() || '';
        }

        // Case 2: Latest updates card (div.grid.grid-cols-12)
        if (!title && cardElement.classList.contains('grid')) {
            const titleLink = cardElement.querySelector('span.font-medium a, a[href*="/series/"]');
            if (titleLink) {
                title = titleLink.textContent?.trim();
                url = titleLink.href;
                slug = this.extractSlug(url);
            }
        }

        // Cover
        const imgEl = cardElement.querySelector('img');
        if (imgEl) {
            coverUrl = imgEl.getAttribute('data-src') || imgEl.src;
        }

        return {
            id: slug,
            title,
            slug,
            url,
            coverUrl
        };
    }

    /**
     * Extract slug from URL.
     * @param {string} url - Full URL.
     * @returns {string} Extracted slug.
     */
    static extractSlug(url) {
        try {
            const parts = new URL(url).pathname.split('/').filter(p => p);
            // new pattern: /series/[slug]
            const seriesIndex = parts.indexOf('series');
            if (seriesIndex !== -1 && parts[seriesIndex + 1]) {
                return parts[seriesIndex + 1];
            }
            return parts[parts.length - 1];
        } catch (e) {
            return '';
        }
    }

    /**
     * Parse URL for reader/series info.
     * @param {string} url - URL to parse.
     * @returns {{type: string, id: string, slug: string, chapterNo: string|null}}
     */
    static parseUrl(url) {
        const path = new URL(url).pathname;

        // Reader: /series/[slug]/chapter/[num]
        const chapterMatch = path.match(/\/series\/([^/]+)\/chapter\/([\d.-+]+)/);
        if (chapterMatch) {
            return {
                type: 'reader',
                id: chapterMatch[1],
                slug: chapterMatch[1],
                chapterNo: chapterMatch[2]
            };
        }

        // Series URL: /series/[slug]
        const seriesMatch = path.match(/\/series\/([^/]+)/);
        if (seriesMatch) {
            return {
                type: 'manga',
                id: seriesMatch[1],
                slug: seriesMatch[1],
                chapterNo: null
            };
        }

        return {
            type: 'listing',
            id: '',
            slug: '',
            chapterNo: null
        };
    }

    /**
     * Apply border to Asura cards.
     * Custom override to target the specific card structure properly.
     * @param {HTMLElement} element - Card element.
     * @param {string} color - Border color.
     * @param {number} size - Border size.
     * @param {string} style - Border style.
     */
    static applyBorder(element, color, size, style) {
        // For updates card, apply to the whole grid div
        // For grid card, apply to the <a> tag
        const target = element;
        
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    }

    /**
     * Get optimal badge position for Asura cards.
     * @returns {{bottom: string, left: string}}
     */
    static getBadgePosition() {
        return { bottom: '8px', left: '8px' };
    }
}

PlatformRegistry.register(AsuraScansAdapter);
export default AsuraScansAdapter;
