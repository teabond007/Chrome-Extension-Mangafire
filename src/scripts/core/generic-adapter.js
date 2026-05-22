/**
 * @fileoverview Generic Adapter for Custom Sites + initCustomSite() function
 * A data-driven adapter that uses CustomSiteConfig to enhance manga cards
 * on user-defined websites.
 *
 * @module core/generic-adapter
 */

import { CardEnhancer } from './card-enhancer.js';
import { OverlayFactory } from './overlay-factory.js';
import { TOGGLES, SETTINGS, DATA } from '../../config.js';

/**
 * Generic adapter that implements PlatformAdapter interface
 * but uses runtime configuration instead of hardcoded values.
 */
export class GenericAdapter {
    /**
     * Creates a GenericAdapter from a CustomSiteConfig.
     * @param {Object} config - User-defined site configuration
     */
    constructor(config) {
        /** @type {Object} */
        this.config = config;
        /** @type {string} */
        this.id = `custom-${config.id}`;
        /** @type {string} */
        this.name = config.name;
        /** @type {string} */
        this.unitName = 'chapter';
        /** @type {string} */
        this.PREFIX = `custom:${config.hostname}:`;
        /** @type {string} */
        this.displayName = config.name;
        /** @type {string[]} */
        this.hosts = [config.hostname];

        // Normalize selectors to groups
        if (Array.isArray(config.selectors)) {
            /** @type {{ card: string, title: string }[]} */
            this.selectorGroups = config.selectors;
        } else {
            // Legacy format support
            this.selectorGroups = [{
                card: config.selectors?.card || '',
                title: config.selectors?.title || ''
            }];
        }

        // Reader page selectors for progress tracking
        /** @type {{ readerDetect: string, readerTitle: string, readerChapter: string }} */
        this.readerSelectors = {
            readerDetect: config.readerSelectors?.readerDetect || '',
            readerTitle: config.readerSelectors?.readerTitle || '',
            readerChapter: config.readerSelectors?.readerChapter || ''
        };
    }

    get selectors() {
        var cardSelectors = [];
        for (var i = 0; i < this.selectorGroups.length; i++) {
            var group = this.selectorGroups[i];
            if (group && group.card) {
                cardSelectors.push(group.card);
            }
        }

        return {
            card: cardSelectors.join(', '),
            cardTitle: '',
            cardLink: '',
            cardCover: ''
        };
    }

    /**
     * Extracts manga data from a card element.
     * @param {HTMLElement} cardElement - The manga card DOM element
     * @returns {{ id: string, title: string, slug: string, url: string }}
     */
    extractCardData(cardElement) {
        let title = '';
        let url = '';
        let id = '';

        // Find which selector group matches this card using a simple loop
        var group = null;
        for (var i = 0; i < this.selectorGroups.length; i++) {
            var g = this.selectorGroups[i];
            try {
                if (cardElement.matches(g.card)) {
                    group = g;
                    break;
                }
            } catch (e) {
                // Ignore invalid selectors
            }
        }

        if (group && group.title) {
            try {
                // Check if the card itself matches the title selector, or find it inside
                const titleEl = cardElement.matches(group.title) 
                    ? cardElement 
                    : cardElement.querySelector(group.title);
                
                if (titleEl) {
                    title = titleEl.textContent?.trim() || titleEl.getAttribute('title') || '';

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

        // Robust Fallback: if no title found via selector, try common attributes
        if (!title) {
            title = cardElement.getAttribute('title') || 
                    cardElement.getAttribute('aria-label') || 
                    cardElement.querySelector('img')?.getAttribute('alt') || 
                    cardElement.querySelector('img')?.getAttribute('title') || 
                    '';
            title = title.trim();
        }

        // Extract ID from URL
        if (url) {
            id = this.extractIdFromUrl(url);
        }

        // Fallback: use title as ID if no URL found
        if (!id && title) {
            id = this.slugify(title);
        }

        // VISUAL DEBUG: If we matched the card selector but still no title,
        // return a placeholder so the overlay still appears.
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
    extractIdFromUrl(url) {
        if (url == null || url == "") return "";

        try {
            var urlObj = new URL(url);
            var path = urlObj.pathname;
            
            // Split the path by / and look at the parts
            var parts = path.split("/");
            
            // Try to find parts that usually come before the ID
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i].toLowerCase();
                if (p == "manga" || p == "series" || p == "title" || p == "comic" || p == "read") {
                    if (parts[i + 1]) {
                        return parts[i + 1];
                    }
                }
            }

            // Fallback: just use the last part of the URL
            var lastPart = "";
            for (var j = parts.length - 1; j >= 0; j--) {
                if (parts[j] != "") {
                    lastPart = parts[j];
                    break;
                }
            }
            return lastPart;

        } catch (e) {
            return '';
        }
    }

    /**
     * Creates a URL-friendly slug from a title.
     * @param {string} title - Manga title
     * @returns {string} Slugified string
     */
    slugify(title) {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Checks if current page is a reader page.
     * Uses the user-configured readerDetect selector to find a signature element.
     * @returns {boolean}
     */
    isReaderPage() {
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
            path.includes('/viewer') ||
            /chapter-\d+/i.test(path);
    }

    /**
     * Extracts manga title and chapter number from reader page DOM elements.
     * Uses the user-configured readerTitle and readerChapter selectors.
     * @param {string} _url - Unused; extraction is DOM-based for custom sites
     * @returns {{ id?: string, slug: string, title: string, chapterNo: number } | null}
     */
    parseUrl(_url) {
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

        // Extract ID from current URL if possible
        const id = this.extractIdFromUrl(_url);

        return {
            id,
            slug: this.slugify(title),
            title,
            chapterNo
        };
    }

    /** Navigates back to exit the reader. */
    exitReader() {
        window.history.back();
    }
}

/**
 * starts enhancement for a custom site.
 * @param {Object} config - for custom site (name, hostname, selectors, readerSelectors)
 * @param {Object} settings - User settings
 */
export async function initCustomSite(config, settings) {
    console.log(`[BMH-Custom] Initializing adapter for ${config.name || config.hostname}...`);
    console.log('[BMH-Custom] Config:', config);
    console.log('[BMH-Custom] Selectors:', config.selectors);

    // Validate that we have minimum required selectors
    const hasCard = Array.isArray(config.selectors)
        ? config.selectors.some(s => s.card)
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

    const enhancer = new CardEnhancer(adapter, settings);

    const count = await enhancer.enhanceAll();
    console.log(`[BMH-Custom] Enhanced ${count} cards.`);

    // Use a simple interval to check for new cards every 2 seconds
    setInterval(function() {
        if (chrome.runtime && chrome.runtime.id) {
            enhancer.enhanceAll();
        }
    }, 2000);

    console.log(`[BMH-Custom] Enhancement complete for ${config.hostname}`);
}
