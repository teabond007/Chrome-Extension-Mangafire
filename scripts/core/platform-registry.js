/**
 * @fileoverview Platform Registry - Central hub for all supported platforms.
 * New platforms register here and are automatically available for highlighting,
 * progress tracking, and notifications across the extension.
 * 
 * @module core/platform-registry
 */

/**
 * Abstract base class that all platform adapters must extend.
 * Provides the interface contract that core modules rely on.
 */
export class PlatformAdapter {
    // Required: Platform identification
    static id = 'base';
    static name = 'Base Platform';
    static icon = '📖';
    static color = '#666666';
    static urlPatterns = [];
    static unitName = 'chapter'; // 'chapter' or 'episode'

    // Required: DOM selectors (site-specific, override in subclass)
    static selectors = {
        cardContainer: null,
        card: null,
        cardTitle: null,
        cardLink: null,
        cardCover: null,
        readerContainer: null,
        readerImage: null
    };

    /**
     * Extract data from a card DOM element.
     * @param {HTMLElement} cardElement - The card element to extract data from.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        throw new Error('extractCardData must be implemented by adapter');
    }

    /**
     * Parse a URL to extract type, ID, slug, and chapter number.
     * @param {string} url - The URL to parse.
     * @returns {{type: string, id: string, slug: string, chapterNo: string|null}}
     */
    static parseUrl(url) {
        throw new Error('parseUrl must be implemented by adapter');
    }

    /**
     * Optional: Custom border application logic.
     * @param {HTMLElement} element - The element to apply border to.
     * @param {string} color - Border color.
     * @param {number} size - Border size in pixels.
     * @param {string} style - Border style (solid, dashed, etc).
     */
    static applyBorder(element, color, size, style) {
        // Default implementation - override for custom behavior
        const target = element.closest('li') || element;
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    }

    /**
     * Optional: Get badge positioning for this platform.
     * @returns {{top?: string, right?: string, bottom?: string, left?: string}}
     */
    static getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    }

    /**
     * Optional: Check for new chapters (for notifications).
     * @param {Array<Object>} entries - Library entries to check.
     * @returns {Promise<Array<{entry: Object, newChapter: string, source: string}>>}
     */
    static async checkForUpdates(entries) {
        return []; // Override for platforms with API access
    }
}

/**
 * Central registry for all supported platforms.
 * Platforms self-register when their adapter is loaded.
 */
export class PlatformRegistry {
    /** @type {Map<string, typeof PlatformAdapter>} */
    static platforms = new Map();

    /**
     * Register a platform adapter.
     * @param {typeof PlatformAdapter} adapter - The adapter class to register.
     */
    static register(adapter) {
        if (!adapter.id || adapter.id === 'base') {
            console.error('[Registry] Cannot register adapter without unique ID');
            return;
        }
        this.platforms.set(adapter.id, adapter);
        console.log(`[Registry] ✓ Registered: ${adapter.name} (${adapter.id})`);
    }

    /**
     * Get adapter matching the given URL.
     * @param {string} url - URL to match against platform patterns.
     * @returns {typeof PlatformAdapter|null}
     */
    static getByUrl(url) {
        for (const [id, adapter] of this.platforms) {
            if (adapter.urlPatterns.some(pattern => pattern.test(url))) {
                return adapter;
            }
        }
        return null;
    }

    /**
     * Get adapter by its ID.
     * @param {string} id - Platform ID.
     * @returns {typeof PlatformAdapter|null}
     */
    static getById(id) {
        return this.platforms.get(id) || null;
    }

    /**
     * Get all registered adapters.
     * @returns {Array<typeof PlatformAdapter>}
     */
    static getAll() {
        return Array.from(this.platforms.values());
    }

    /**
     * Check if a platform is registered.
     * @param {string} id - Platform ID.
     * @returns {boolean}
     */
    static has(id) {
        return this.platforms.has(id);
    }

    /**
     * Get platform info for UI display.
     * @returns {Array<{id: string, name: string, icon: string, color: string}>}
     */
    static getDisplayInfo() {
        return this.getAll().map(adapter => ({
            id: adapter.id,
            name: adapter.name,
            icon: adapter.icon,
            color: adapter.color
        }));
    }
}
