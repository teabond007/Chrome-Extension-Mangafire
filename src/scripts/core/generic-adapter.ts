/**
 * @fileoverview Generic Adapter for Custom Sites + initCustomSite() function
 * A data-driven adapter that uses CustomSiteConfig to enhance manga cards
 * on user-defined websites.
 * 
 * @module core/generic-adapter
 */

import { CardEnhancer } from './card-enhancer';
import { OverlayFactory } from './overlay-factory.js';
import { TOGGLES, SETTINGS, DATA } from '../../config.js';

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
    readerSelectors: {
        readerDetect: string;
        readerTitle: string;
        readerChapter: string;
    };

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

        // Reader page selectors for progress tracking
        this.readerSelectors = {
            readerDetect: config.readerSelectors?.readerDetect || '',
            readerTitle: config.readerSelectors?.readerTitle || '',
            readerChapter: config.readerSelectors?.readerChapter || ''
        };
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
     * @param {HTMLElement} cardElement - The manga card DOM element
     * @returns {Object} Extracted card data
     */
    extractCardData(cardElement: HTMLElement) {
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
     * Applies directly to the card rather than inner elements for reliability.

     /**
     * Attempts to build a chapter URL. 
     * Returns null by default as custom sites have unpredictable URL structures.
     */

    /**
     * Checks if current page is a reader page.
     * Uses the user-configured readerDetect selector to find a signature element.
     * @returns {boolean}
     */
    isReaderPage(): boolean {
        if (this.readerSelectors.readerDetect) {
            try {
                return !!document.querySelector(this.readerSelectors.readerDetect);
            } catch {
                return false;
            }
        }

        // Fallback: common reader URL patterns
        const path = window.location.pathname.toLowerCase();
        return path.includes('/read') ||
            path.includes('/chapter') ||
            path.includes('/viewer');
    }

    /**
     * Extracts manga title and chapter number from reader page DOM elements.
     * Uses the user-configured readerTitle and readerChapter selectors.
     * @param {string} _url - Unused, extraction is DOM-based for custom sites
     * @returns {{ slug: string, title: string, chapterNo: number } | null}
     */
    parseUrl(_url: string): { slug: string; title: string; chapterNo: number } | null {
        if (!this.readerSelectors.readerTitle && !this.readerSelectors.readerChapter) {
            return null;
        }

        let title = '';
        let chapterNo = 0;

        // Check if title and chapter selectors point to the same element
        const sameElement = this.readerSelectors.readerTitle &&
            this.readerSelectors.readerTitle === this.readerSelectors.readerChapter;

        if (sameElement) {
            // Both selectors are identical — extract chapter from the combined text
            try {
                const el = document.querySelector(this.readerSelectors.readerTitle);
                const fullText = el?.textContent?.trim() || '';
                // Match trailing chapter patterns: "Title Chapter 42", "Title Ch. 12.5", "Title #7", "Title - 103"
                const chapterMatch = fullText.match(/[\s\-–—]+(?:chapter|ch\.?|#|episode|ep\.?)?\s*(\d+(?:\.\d+)?)\s*$/i);
                if (chapterMatch) {
                    chapterNo = parseFloat(chapterMatch[1]);
                    title = fullText.slice(0, chapterMatch.index).trim();
                } else {
                    // No trailing chapter found, use full text as title
                    title = fullText;
                }
            } catch (e) {
                console.warn('[GenericAdapter] Combined title/chapter extraction error:', e);
            }
        } else {
            // Extract title from configured element
            if (this.readerSelectors.readerTitle) {
                try {
                    const titleEl = document.querySelector(this.readerSelectors.readerTitle);
                    title = titleEl?.textContent?.trim() || '';
                } catch (e) {
                    console.warn('[GenericAdapter] Reader title extraction error:', e);
                }
            }

            // Extract chapter number from configured element
            if (this.readerSelectors.readerChapter) {
                try {
                    const chapterEl = document.querySelector(this.readerSelectors.readerChapter);
                    const chapterText = chapterEl?.textContent?.trim() || '';
                    // Extract numeric chapter from text like "Chapter 42", "Ch. 12.5", "#7"
                    const match = chapterText.match(/(\d+(?:\.\d+)?)/);
                    if (match) {
                        chapterNo = parseFloat(match[1]);
                    }
                } catch (e) {
                    console.warn('[GenericAdapter] Reader chapter extraction error:', e);
                }
            }
        }

        if (!title && !chapterNo) return null;

        return {
            slug: this.slugify(title),
            title,
            chapterNo
        };
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
        quickActions: settings[TOGGLES.CUSTOM_SITE_QUICK_ACTIONS] !== false,
        CustomBorderSize: settings[TOGGLES.CUSTOM_BORDER_SIZE_ENABLED] ? settings[SETTINGS.HIGHLIGHT_THICKNESS] : 4,
        CustomBookmarksfeatureEnabled: settings[TOGGLES.CUSTOM_STATUS_ENABLED],
        customBookmarks: settings[DATA.CUSTOM_STATUSES]
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
