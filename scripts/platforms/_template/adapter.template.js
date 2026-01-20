/**
 * @fileoverview Platform Adapter Template
 * Copy this file to create a new platform adapter.
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to /scripts/platforms/{platform-id}/adapter.js
 * 2. Replace all TODO placeholders with actual values
 * 3. Implement all static methods
 * 4. The adapter will auto-register when imported
 * 
 * @module platforms/_template/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * TODO: Rename this class to match your platform.
 * Example: ComickXYZAdapter, MangaPlusAdapter, etc.
 * @extends PlatformAdapter
 */
export class TemplateAdapter extends PlatformAdapter {
    // ========================================
    // REQUIRED: Platform Identification
    // ========================================
    
    /** Unique identifier (lowercase, no spaces) */
    static id = 'template'; // TODO: Change to your platform ID
    
    /** Display name shown in UI */
    static name = 'Template Platform'; // TODO: Change to platform name
    
    /** Emoji icon for quick identification */
    static icon = '📚'; // TODO: Choose appropriate emoji
    
    /** Brand color (hex) for theming */
    static color = '#666666'; // TODO: Use platform's brand color
    
    /** URL patterns to match */
    static urlPatterns = [
        /example\.com/i, // TODO: Add your platform's URL patterns
        /example\.org/i
    ];
    
    /** Unit name: 'chapter' for manga, 'episode' for webtoons */
    static unitName = 'chapter'; // TODO: 'chapter' or 'episode'

    // ========================================
    // REQUIRED: DOM Selectors
    // ========================================
    
    /**
     * CSS selectors for finding elements on the page.
     * Use browser DevTools to find the correct selectors.
     */
    static selectors = {
        // Container that holds all cards
        cardContainer: '.manga-list', // TODO: Update selector
        
        // Individual manga/webtoon cards
        card: '.manga-card', // TODO: Update selector
        
        // Title text element within card
        cardTitle: '.card-title', // TODO: Update selector
        
        // Link element with manga URL
        cardLink: 'a[href*="/title/"]', // TODO: Update selector
        
        // Cover image element
        cardCover: '.cover-image', // TODO: Update selector
        
        // Reader container (for chapter pages)
        readerContainer: '.reader-wrapper', // TODO: Update selector
        
        // Reader page images
        readerImage: '.page-image' // TODO: Update selector
    };

    // ========================================
    // REQUIRED: Data Extraction Methods
    // ========================================

    /**
     * Extract data from a card DOM element.
     * Called by CardEnhancer to get info for matching.
     * 
     * @param {HTMLElement} cardElement - The card element.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        // TODO: Implement extraction logic
        const titleEl = cardElement.querySelector(this.selectors.cardTitle);
        const linkEl = cardElement.querySelector(this.selectors.cardLink);
        const coverEl = cardElement.querySelector(this.selectors.cardCover);

        const title = titleEl?.textContent?.trim() || '';
        const url = linkEl?.href || '';
        const coverUrl = coverEl?.src || '';

        // Extract ID/slug from URL
        const slug = this.extractSlug(url);

        return {
            id: slug,
            title,
            slug,
            url,
            coverUrl
        };
    }

    /**
     * Parse a URL to extract type and identifiers.
     * @param {string} url - URL to parse.
     * @returns {{type: string, id: string, slug: string, chapterNo: string|null}}
     */
    static parseUrl(url) {
        // TODO: Implement URL parsing
        const pathname = new URL(url).pathname;

        // Example: Reader URL pattern
        const readerMatch = pathname.match(/\/read\/([^/]+)\/([^/]+)/);
        if (readerMatch) {
            return {
                type: 'reader',
                id: readerMatch[1],
                slug: readerMatch[1],
                chapterNo: readerMatch[2]
            };
        }

        // Example: Manga page pattern
        const mangaMatch = pathname.match(/\/title\/([^/]+)/);
        if (mangaMatch) {
            return {
                type: 'manga',
                id: mangaMatch[1],
                slug: mangaMatch[1],
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

    // ========================================
    // OPTIONAL: Helper Methods
    // ========================================

    /**
     * Extract slug from URL.
     * @param {string} url - Full URL.
     * @returns {string} Extracted slug.
     */
    static extractSlug(url) {
        // TODO: Implement based on URL structure
        const match = url.match(/\/title\/([^/?]+)/);
        return match ? match[1] : '';
    }

    // ========================================
    // OPTIONAL: Custom Border Application
    // ========================================

    /**
     * Apply colored border to card element.
     * Override if default behavior doesn't work for this platform.
     * 
     * @param {HTMLElement} element - Element to style.
     * @param {string} color - Border color.
     * @param {number} size - Border size in pixels.
     * @param {string} style - Border style (solid, dashed, etc).
     */
    static applyBorder(element, color, size, style) {
        // TODO: Customize if needed
        const target = element.closest('li') || element;
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    }

    /**
     * Get preferred badge position for this platform.
     * @returns {{top?: string, right?: string, bottom?: string, left?: string}}
     */
    static getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    }

    // ========================================
    // OPTIONAL: New Chapter Checking
    // ========================================

    /**
     * Check for new chapters using platform's API (if available).
     * Return empty array if no API access.
     * 
     * @param {Array<Object>} entries - Library entries to check.
     * @returns {Promise<Array<{entry: Object, newChapter: string, source: string}>>}
     */
    static async checkForUpdates(entries) {
        // TODO: Implement if platform has public API
        // Return empty array if not supported
        return [];
    }
}

// ========================================
// AUTO-REGISTRATION
// ========================================
// Uncomment when adapter is complete:
// PlatformRegistry.register(TemplateAdapter);

export default TemplateAdapter;
