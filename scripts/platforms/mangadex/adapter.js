/**
 * @fileoverview MangaDex Platform Adapter
 * Implements the PlatformAdapter interface for MangaDex.org
 * 
 * @module platforms/mangadex/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * MangaDex adapter implementing the cross-platform interface.
 * @extends PlatformAdapter
 */
export class MangaDexAdapter extends PlatformAdapter {
    // Platform identification
    static id = 'mangadex';
    static name = 'MangaDex';
    static icon = '📖';
    static color = '#FF6740';
    static urlPatterns = [
        /mangadex\.org/i,
        /mangadex\.cc/i
    ];
    static unitName = 'chapter';

    // DOM selectors for MangaDex
    static selectors = {
        // Manga cards (various layouts)
        cardContainer: '.manga-card-container, [data-testid="manga-card"]',
        card: '.manga-card, [class*="chapter-feed"], [data-testid="manga-card"]',
        cardTitle: '.manga-card__title a, [class*="title"], a[href*="/title/"]',
        cardLink: 'a[href*="/title/"]',
        cardCover: '.manga-card__cover img, img',

        // Chapter cards (homepage, follows feed)
        chapterCard: '[class*="chapter-feed__item"], .chapter-card',
        
        // Reader page
        readerContainer: '#chapter-reader, [data-testid="reader-container"]',
        readerImage: '.reader-image img, [data-testid="page-image"]',

        // Search/library pages
        libraryGrid: '[data-testid="library-grid"]',
        searchResults: '[data-testid="search-results"]'
    };

    /**
     * Extract data from a MangaDex manga card element.
     * @param {HTMLElement} cardElement - The card element.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        let title = '';
        let url = '';
        let coverUrl = '';
        let uuid = '';

        // Find title and link
        const linkEl = cardElement.querySelector('a[href*="/title/"]');
        const titleEl = cardElement.querySelector('[class*="title"], .manga-card__title a');
        const coverEl = cardElement.querySelector('img');

        if (titleEl) {
            title = titleEl.textContent?.trim() || '';
        }

        if (linkEl?.href) {
            url = linkEl.href;
            uuid = this.extractUUID(url);
        }

        if (coverEl?.src) {
            coverUrl = coverEl.src;
        }

        // Create slug from title
        const slug = this.slugify(title);

        return {
            id: uuid,
            title,
            slug,
            url,
            coverUrl
        };
    }

    /**
     * Extract UUID from MangaDex URL.
     * @param {string} url - Full URL.
     * @returns {string} UUID or empty string.
     */
    static extractUUID(url) {
        // Match /title/{uuid} or /chapter/{uuid}
        const match = url.match(/\/(title|chapter)\/([a-f0-9-]{36})/i);
        return match ? match[2] : '';
    }

    /**
     * Convert title to URL-friendly slug.
     * @param {string} title - Manga title.
     * @returns {string} URL slug.
     */
    static slugify(title) {
        return title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Parse a MangaDex URL to extract type, UUID, and chapter.
     * @param {string} url - URL to parse.
     * @returns {{type: string, id: string, slug: string, chapterNo: string|null}}
     */
    static parseUrl(url) {
        const pathname = new URL(url).pathname;

        // Chapter reader: /chapter/{uuid}
        const chapterMatch = pathname.match(/\/chapter\/([a-f0-9-]{36})/i);
        if (chapterMatch) {
            return {
                type: 'reader',
                id: chapterMatch[1],
                slug: '',
                chapterNo: null // Chapter number not in URL for MangaDex
            };
        }

        // Manga page: /title/{uuid}/{slug?}
        const titleMatch = pathname.match(/\/title\/([a-f0-9-]{36})(?:\/([^/]+))?/i);
        if (titleMatch) {
            return {
                type: 'manga',
                id: titleMatch[1],
                slug: titleMatch[2] || '',
                chapterNo: null
            };
        }

        // Homepage or other listing
        return {
            type: 'listing',
            id: '',
            slug: '',
            chapterNo: null
        };
    }

    /**
     * Custom border application for MangaDex cards.
     * @param {HTMLElement} element - Element to apply border to.
     * @param {string} color - Border color.
     * @param {number} size - Border size.
     * @param {string} style - Border style.
     */
    static applyBorder(element, color, size, style) {
        // MangaDex uses various card layouts, find the best target
        let target = element.closest('.manga-card') ||
                     element.closest('[data-testid="manga-card"]') ||
                     element;

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    }

    /**
     * Get badge position for MangaDex cards.
     * @returns {{bottom: string, left: string}}
     */
    static getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    }

    /**
     * Check for new chapters using MangaDex API.
     * @param {Array<Object>} entries - Library entries to check.
     * @returns {Promise<Array<{entry: Object, newChapter: string, source: string}>>}
     */
    static async checkForUpdates(entries) {
        const updates = [];
        const RATE_LIMIT_MS = 500;

        for (const entry of entries) {
            if (!entry.sourceId) continue;

            try {
                const response = await fetch(
                    `https://api.mangadex.org/manga/${entry.sourceId}/feed?limit=1&order[chapter]=desc&translatedLanguage[]=en`,
                    { headers: { 'Accept': 'application/json' } }
                );

                if (!response.ok) continue;

                const data = await response.json();
                const latestChapter = data.data?.[0]?.attributes?.chapter;

                if (latestChapter && parseFloat(latestChapter) > parseFloat(entry.lastReadChapter || 0)) {
                    updates.push({
                        entry,
                        newChapter: latestChapter,
                        source: 'mangadex'
                    });
                }
            } catch (e) {
                console.warn(`[MangaDex] Failed to check ${entry.title}:`, e);
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
        }

        return updates;
    }
}

// Auto-register when module loads
PlatformRegistry.register(MangaDexAdapter);

export default MangaDexAdapter;
