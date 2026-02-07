/**
 * @fileoverview Generic Adapter for Custom Sites
 * A data-driven adapter that uses CustomSiteConfig to enhance manga cards
 * on user-defined websites.
 * 
 * @module core/generic-adapter
 */

import { CardEnhancer } from './card-enhancer';
import { OverlayFactory } from './overlay-factory.js';

/**
 * @typedef {Object} CustomSiteConfig
 * @property {string} id - UUID for the site configuration
 * @property {string} hostname - The site hostname
 * @property {string} name - User-friendly display name  
 * @property {Object} selectors - CSS selectors for DOM elements
 */

/**
 * Generic adapter that implements PlatformAdapter interface
 * but uses runtime configuration instead of hardcoded values.
 */
export class GenericAdapter {
    id: string;
    name: string;
    unitName: string;
    PREFIX: string;
    displayName: string;
    hosts: string[];
    selectorGroups: {
        card: string;
        title: string;
    }[];

    private config: any;

    /**
     * Creates a GenericAdapter from a CustomSiteConfig.
     * @param {CustomSiteConfig} config - User-defined site configuration
     */
    constructor(config: any) {
        this.config = config;
        this.id = `custom-${config.id}`;
        this.name = config.name;
        this.unitName = 'chapter';
        this.PREFIX = `custom:${config.hostname}:`;
        this.displayName = config.name;
        this.hosts = [config.hostname];

        // Normalize selectors to groups
        if (Array.isArray(config.selectors)) {
            this.selectorGroups = config.selectors;
        } else {
            // Legacy format support
            this.selectorGroups = [{
                card: config.selectors?.card || '',
                title: config.selectors?.title || ''
            }];
        }
    }

    get selectors() {
        return {
            card: this.selectorGroups.map(g => g.card).filter(Boolean).join(', '),
            cardTitle: '',
            cardLink: '',
            cardCover: ''
        };
    }

    /**
     * Extracts manga data from a card element using configured selectors.
     * Supports optional custom JS extraction function.
     * @param {HTMLElement} cardElement - The manga card DOM element
     * @returns {Object} Extracted card data
     */
    extractCardData(cardElement: HTMLElement) {
        // Try custom extraction function first
        if (this.config.customFunction) {
            try {
                const result = this.executeCustomFunction(cardElement);
                if (result && result.id) {
                    return {
                        id: result.id,
                        title: result.title || '',
                        slug: this.slugify(result.title || ''),
                        url: result.url || ''
                    };
                }
            } catch (err) {
                console.warn(`[GenericAdapter] Custom function error:`, err);
                // Fall through to selector-based extraction
            }
        }

        let title = '';
        let url = '';
        let id = '';

        // Find which selector group matches this card
        const group = this.selectorGroups.find(g => {
            try { return cardElement.matches(g.card); }
            catch { return false; }
        });

        if (group && group.title) {
            try {
                const titleEl = cardElement.querySelector(group.title);
                if (titleEl) {
                    title = titleEl.textContent?.trim() || '';

                    // Try to find URL related to title (closest anchor or anchor inside)
                    const titleLink = titleEl.closest('a') || titleEl.querySelector('a');
                    if (titleLink instanceof HTMLAnchorElement) {
                        url = titleLink.href;
                    }
                }
            } catch (e) {
                console.warn('[GenericAdapter] Title extraction error:', e);
            }
        }

        // If no URL found yet, try finding first link in card
        if (!url) {
            try {
                const linkEl = (cardElement instanceof HTMLAnchorElement ? cardElement : cardElement.querySelector('a'));
                if (linkEl instanceof HTMLAnchorElement) {
                    url = linkEl.href;
                }
            } catch (e) {
                console.warn('[GenericAdapter] URL extraction error:', e);
            }
        }

        // Extract ID from URL
        if (url) {
            id = this.extractIdFromUrl(url);
        }

        // Fallback: use title as ID if no URL found
        if (!id && title) {
            id = this.slugify(title);
        }

        // VISUAL DEBUG: If we matched the card selector but failed to extract title,
        // return a placeholder so the overlay still appears. This confirms to the user
        // that the CARD selector is working, even if the TITLE selector is wrong.
        if (!title) {
            title = "Unknown Title (Check Selectors)";
            id = `unknown-${Math.random().toString(36).substr(2, 9)}`;
        }

        return {
            id,
            title,
            slug: this.slugify(title),
            url
        };
    }

    /**
     * Executes a user-defined custom extraction function.
     * @param {HTMLElement} cardElement - Card element to extract from
     * @returns {Object|null} Extraction result or null
     */
    private executeCustomFunction(cardElement: HTMLElement): { id?: string; title?: string; url?: string } | null {
        if (!this.config.customFunction) return null;

        try {
            // Create a sandboxed function from the stored code
            // The code should return an object with { id, title, url }
            const fn = new Function('card', `
                ${this.config.customFunction}
                return typeof extract === 'function' ? extract(card) : null;
            `);
            return fn(cardElement);
        } catch (err) {
            console.error('[GenericAdapter] Failed to execute custom function:', err);
            return null;
        }
    }

    /**
     * Extracts a manga ID from a URL.
     * Attempts common patterns used by manga sites.
     * @param {string} url - The manga page URL
     * @returns {string} Extracted ID or empty string
     */
    extractIdFromUrl(url: string): string {
        if (!url) return '';

        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;

            // Common patterns:
            // /manga/123, /series/abc-def, /title/uuid, /comic/slug
            const patterns = [
                /\/(manga|series|title|comic|read)\/([^\/]+)/i,
                /\/([a-f0-9-]{36})/i, // UUID
                /\/(\d+)/i // Numeric ID
            ];

            for (const pattern of patterns) {
                const match = path.match(pattern);
                if (match) {
                    return match[2] || match[1];
                }
            }

            // Fallback: last path segment
            const segments = path.split('/').filter(Boolean);
            return segments[segments.length - 1] || '';

        } catch {
            return '';
        }
    }

    /**
     * Creates a URL-friendly slug from a title.
     * @param {string} title - Manga title
     * @returns {string} Slugified string
     */
    slugify(title: string): string {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Applies highlight border to a manga card element.
     * @param {HTMLElement} element - Card element
     * @param {string} color - Border color
     * @param {number} size - Border width in pixels
     * @param {string} style - Border style (solid, dashed, etc.)
     */
    applyBorder(element: HTMLElement, color: string, size: number, style: string) {
        // Try to find a natural container or image wrapper
        const target = (
            element.querySelector('a') ||
            element.querySelector('img')?.parentElement ||
            element
        ) as HTMLElement;

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '8px', 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('position', 'relative', 'important');
    }

    /**
     * Returns badge position configuration.
     * @returns {Object} Position offsets for status badges
     */
    getBadgePosition() {
        return { bottom: '4px', left: '4px' };
    }

    /**
     * Attempts to build a chapter URL. 
     * Returns null as custom sites have unpredictable URL structures.
     */
    buildChapterUrl(entry: any, chapter: number): string | null {
        return null;
    }

    /**
     * Checks if current page is a reader page.
     * Uses common reader URL patterns.
     * @returns {boolean}
     */
    isReaderPage(): boolean {
        const path = window.location.pathname.toLowerCase();
        return path.includes('/read') ||
            path.includes('/chapter') ||
            path.includes('/viewer');
    }

    parseUrl(url: string) {
        return null;
    }

    goToNextChapter() {
        // Try common next chapter button selectors
        const nextBtn = document.querySelector(
            this.config.selectors?.nextBtn ||
            'a[href*="next"], button:contains("Next"), .next-chapter, [class*="next"]'
        ) as HTMLElement;
        if (nextBtn) nextBtn.click();
    }

    goToPrevChapter() {
        const prevBtn = document.querySelector(
            this.config.selectors?.prevBtn ||
            'a[href*="prev"], button:contains("Prev"), .prev-chapter, [class*="prev"]'
        ) as HTMLElement;
        if (prevBtn) prevBtn.click();
    }

    exitReader() {
        window.history.back();
    }
}

/**
 * Initializes enhancement for a custom site using its stored configuration.
 * @param {Object} config - CustomSiteConfig from storage
 * @param {Object} settings - User settings
 */
export async function initCustomSite(config: any, settings: any) {
    console.log(`[BMH-Custom] Initializing adapter for ${config.name || config.hostname}...`);
    console.log('[BMH-Custom] Config:', config);
    console.log('[BMH-Custom] Selectors:', config.selectors);

    // Validate that we have minimum required selectors
    const hasCard = Array.isArray(config.selectors)
        ? config.selectors.some((s: any) => s.card)
        : config.selectors?.card;

    if (!hasCard) {
        console.warn('[BMH-Custom] No card selector configured, skipping enhancement');
        return;
    }

    // Inject overlay styles
    if (!document.getElementById('bmh-custom-styles')) {
        const styles = document.createElement('style');
        styles.id = 'bmh-custom-styles';
        styles.textContent = `@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }`;
        document.head.appendChild(styles);
        OverlayFactory.injectStyles();
    }

    const adapter = new GenericAdapter(config);
    console.log('[BMH-Custom] Adapter created. Combined selector:', adapter.selectors.card);

    const enhancer = new CardEnhancer(adapter, {
        highlighting: true,
        progressBadges: true,
        quickActions: settings.CustomSiteQuickActionsEnabled !== false,
        CustomBorderSize: settings.CustomBorderSizefeatureEnabled ? settings.CustomBorderSize : 4,
        CustomBookmarksfeatureEnabled: settings.CustomBookmarksfeatureEnabled,
        customBookmarks: settings.customBookmarks
    });

    const count = await enhancer.enhanceAll();
    console.log(`[BMH-Custom] Enhanced ${count} cards.`);

    // Watch for dynamic content
    let debounceTimer: any;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => enhancer.enhanceAll(), 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log(`[BMH-Custom] Enhancement complete for ${config.hostname}`);
}
