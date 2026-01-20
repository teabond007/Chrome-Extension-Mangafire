/**
 * @fileoverview MangaFire Platform Adapter
 * Implements the PlatformAdapter interface for MangaFire.to
 * 
 * @module platforms/mangafire/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * MangaFire adapter implementing the cross-platform interface.
 * @extends PlatformAdapter
 */
export class MangaFireAdapter extends PlatformAdapter {
    // Platform identification
    static id = 'mangafire';
    static name = 'MangaFire';
    static icon = '🔥';
    static color = '#FF6740';
    static urlPatterns = [
        /mangafire\.to/i,
        /mangafire\.com/i
    ];
    static unitName = 'chapter';

    // DOM selectors for MangaFire
    static selectors = {
        // Listing pages
        cardContainer: '.manga-list',
        card: '.unit, .swiper-slide, .type-novel .info a',
        cardTitle: '.info a, .info h6 a, .name, a.unit',
        cardLink: 'a[href*="/manga/"]',
        cardCover: '.poster img, img',

        // Homepage sections
        homeTrending: '.top-trending .unit',
        homeRecent: '.recently-updated .item',
        homeMostViewed: '.most-viewed .unit',

        // Reader page
        readerContainer: '#reader',
        readerImage: '.reader-image img',

        // Search/filter pages
        filterResults: '.list-items .unit'
    };

    /**
     * Extract data from a MangaFire manga card element.
     * @param {HTMLElement} cardElement - The card element.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        let title = '';
        let url = '';
        let coverUrl = '';

        // Try different selector patterns based on card type
        const titleEl = cardElement.querySelector('.info a, .info h6 a, .name');
        const linkEl = cardElement.querySelector('a[href*="/manga/"]') || cardElement;
        const coverEl = cardElement.querySelector('.poster img, img');

        if (titleEl) {
            title = titleEl.textContent?.trim() || '';
        }

        if (linkEl?.href) {
            url = linkEl.href;
        } else if (cardElement.href) {
            url = cardElement.href;
        }

        if (coverEl?.src) {
            coverUrl = coverEl.src;
        }

        // Extract slug from URL
        const slug = this.extractSlugFromUrl(url);

        return {
            id: slug,
            title: title || this.titleFromSlug(slug),
            slug,
            url,
            coverUrl
        };
    }

    /**
     * Extract slug from MangaFire URL.
     * @param {string} url - Full URL.
     * @returns {string} Slug with optional ID.
     */
    static extractSlugFromUrl(url) {
        const match = url.match(/\/manga\/([^/?]+)/);
        return match ? match[1] : '';
    }

    /**
     * Convert slug back to readable title.
     * @param {string} slug - URL slug.
     * @returns {string} Human-readable title.
     */
    static titleFromSlug(slug) {
        return slug
            .replace(/\.[a-z0-9]+$/, '') // Remove .ID suffix
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Parse a MangaFire URL to extract type, slug, and chapter.
     * @param {string} url - URL to parse.
     * @returns {{type: string, id: string, slug: string, chapterNo: string|null}}
     */
    static parseUrl(url) {
        const pathname = new URL(url).pathname;

        // Reader URL: /read/{slug}/{chapter}
        const readerMatch = pathname.match(/\/read\/([^/]+)\/([^/]+)/);
        if (readerMatch) {
            return {
                type: 'reader',
                id: readerMatch[1],
                slug: readerMatch[1],
                chapterNo: readerMatch[2]
            };
        }

        // Manga page: /manga/{slug}
        const mangaMatch = pathname.match(/\/manga\/([^/]+)/);
        if (mangaMatch) {
            return {
                type: 'manga',
                id: mangaMatch[1],
                slug: mangaMatch[1],
                chapterNo: null
            };
        }

        // Homepage or other
        return {
            type: 'listing',
            id: '',
            slug: '',
            chapterNo: null
        };
    }

    /**
     * Custom border application for MangaFire (handles Swiper conflicts).
     * @param {HTMLElement} element - Element to apply border to.
     * @param {string} color - Border color.
     * @param {number} size - Border size.
     * @param {string} style - Border style.
     */
    static applyBorder(element, color, size, style) {
        // Find the correct target element
        let target = element.closest('.unit') || element.closest('.swiper-slide');

        // For top trending, use left border due to Swiper conflicts
        if (element.closest('.top-trending') || element.closest('.swiper-wrapper')) {
            target = target || element;
            target.style.setProperty('border-left', `${size}px ${style} ${color}`, 'important');
            return;
        }

        // Standard border application
        target = target || element;
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    }

    /**
     * Get badge position for MangaFire cards.
     * @returns {{bottom: string, left: string}}
     */
    static getBadgePosition() {
        return { bottom: '40px', left: '4px' }; // Above card info section
    }
}

// Auto-register when module loads
PlatformRegistry.register(MangaFireAdapter);

export default MangaFireAdapter;
