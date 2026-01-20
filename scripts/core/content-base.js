/**
 * @fileoverview Base Content Script - Shared logic for all platform content scripts.
 * Uses the platform adapter system for cross-platform compatibility.
 * 
 * @module core/content-base
 */

import { Config, STATUS_COLORS, BADGE_STYLES } from './config.js';

/**
 * Base class for content script functionality.
 * Provides shared methods for border application, badge creation, and bookmark matching.
 */
export class ContentScriptBase {
    /**
     * @param {typeof import('./platform-registry.js').PlatformAdapter} adapter - Platform adapter class.
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.platformId = adapter.id;
        this.platformName = adapter.name;
        this.unitName = adapter.unitName || 'chapter';
        this.lastUrl = location.href;
        this.observer = null;
        this.urlObserver = null;
    }

    /**
     * Initialize the content script.
     * Call this in window.load event.
     */
    init() {
        if (!this.isExtensionContextValid()) return;

        this.log(`${this.platformName} content script loaded`);

        // Initial pass after DOM settles
        setTimeout(() => this.applyStyles(), 500);

        // Setup mutation observer for dynamic content
        this.setupMutationObserver();

        // Setup URL observer for SPA navigation
        this.setupUrlObserver();

        // Platform-specific initialization
        this.onInit?.();
    }

    /**
     * Check if extension context is still valid.
     * @returns {boolean}
     */
    isExtensionContextValid() {
        return !!chrome.runtime?.id;
    }

    /**
     * Log message to background script for debugging.
     * @param {string|Object} message - Message to log.
     */
    log(message) {
        if (!this.isExtensionContextValid()) return;

        const text = typeof message === 'object' ? JSON.stringify(message) : message;
        chrome.runtime.sendMessage({ 
            type: 'log', 
            text: `[${this.platformName}] ${text}` 
        }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
        });
    }

    /**
     * Setup mutation observer for dynamically loaded content.
     */
    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
            if (hasNewNodes) {
                this.applyStyles();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Setup URL observer for SPA navigation.
     */
    setupUrlObserver() {
        this.urlObserver = new MutationObserver(() => {
            if (!this.isExtensionContextValid()) return;

            if (location.href !== this.lastUrl) {
                this.lastUrl = location.href;
                this.log('URL changed, re-applying styles...');
                
                // Reset processed flags
                this.resetProcessedFlags();
                
                setTimeout(() => this.applyStyles(), 500);
                
                // Platform-specific URL change handling
                this.onUrlChange?.();
            }
        });

        this.urlObserver.observe(document, { subtree: true, childList: true });
    }

    /**
     * Reset all processed element flags.
     */
    resetProcessedFlags() {
        document.querySelectorAll('[data-bmh-processed]').forEach(el => {
            delete el.dataset.bmhProcessed;
        });
    }

    /**
     * Main entry point for applying styles.
     * Override in subclass for custom logic.
     */
    async applyStyles() {
        if (!this.isExtensionContextValid()) return;

        // Check if highlighting is enabled for this platform
        const enabledKey = this.getEnabledSettingKey();
        const data = await this.getStorage([enabledKey]);
        
        if (data[enabledKey] === false) {
            this.log('Highlighting disabled');
            return;
        }

        // Find unprocessed cards
        const cards = this.findCards().filter(card => 
            !card.element.dataset.bmhProcessed
        );

        if (cards.length === 0) return;

        this.log(`Found ${cards.length} unprocessed cards`);

        // Match with bookmarks and apply styling
        const matched = await this.matchWithBookmarks(cards);
        
        if (matched.length > 0) {
            await this.applyBorders(matched);
            this.log(`Applied styling to ${matched.length} cards`);
        }
    }

    /**
     * Get the storage key for the "enabled" setting.
     * @returns {string}
     */
    getEnabledSettingKey() {
        const keys = {
            'mangafire': 'MarkHomePagefeatureEnabled',
            'mangadex': 'MangaDexHighlightEnabled',
            'webtoons': 'WebtoonsHighlightfeatureEnabled'
        };
        return keys[this.platformId] || `${this.platformName}HighlightEnabled`;
    }

    /**
     * Find all cards on the page using adapter selectors.
     * @returns {Array<{element: HTMLElement, data: Object}>}
     */
    findCards() {
        const results = [];
        const selectors = this.adapter.selectors;
        
        // Get card selector(s) from adapter
        const cardSelector = selectors.card;
        if (!cardSelector) return results;

        document.querySelectorAll(cardSelector).forEach(element => {
            try {
                const data = this.adapter.extractCardData(element);
                if (data.title || data.id) {
                    results.push({ element, data });
                }
            } catch (e) {
                // Skip invalid cards
            }
        });

        return results;
    }

    /**
     * Match page cards with saved bookmarks.
     * @param {Array<{element: HTMLElement, data: Object}>} cards - Cards from page.
     * @returns {Promise<Array<Object>>} Matched data.
     */
    async matchWithBookmarks(cards) {
        const storage = await this.getStorage([
            'savedEntriesMerged', 
            'userBookmarks', 
            'savedReadChapters'
        ]);

        const savedEntries = Array.isArray(storage.savedEntriesMerged) ? storage.savedEntriesMerged : [];
        const userBookmarks = Array.isArray(storage.userBookmarks) ? storage.userBookmarks : [];
        const readChapters = storage.savedReadChapters || {};

        // Build lookup maps
        const byTitle = new Map();
        const bySourceId = new Map();

        [...userBookmarks, ...savedEntries].forEach(entry => {
            if (entry?.title) {
                byTitle.set(this.normalizeTitle(entry.title), entry);
            }
            // Index by source-specific ID
            if (entry?.sourceId && entry?.source === this.platformId) {
                bySourceId.set(entry.sourceId, entry);
            }
            // Legacy ID fields
            if (entry?.mangadexId) bySourceId.set(entry.mangadexId, entry);
            if (entry?.mangafireId) bySourceId.set(entry.mangafireId, entry);
        });

        // Match cards
        const matched = [];
        
        for (const card of cards) {
            // Try ID match first
            let bookmark = bySourceId.get(card.data.id);
            
            // Fallback to title match
            if (!bookmark && card.data.title) {
                bookmark = byTitle.get(this.normalizeTitle(card.data.title));
            }

            if (bookmark) {
                // Find reading history
                const historyKey = this.findHistoryKey(
                    bookmark.title, 
                    card.data.slug, 
                    readChapters
                );
                const chapters = historyKey ? readChapters[historyKey] : [];

                matched.push({
                    element: card.element,
                    cardData: card.data,
                    bookmark,
                    readHistory: chapters,
                    totalUnits: bookmark.chapters || bookmark.anilistData?.chapters || null
                });
            }
        }

        return matched;
    }

    /**
     * Find the matching key in reading history.
     * @param {string} title - Entry title.
     * @param {string} slug - Entry slug.
     * @param {Object} readChapters - Saved read chapters object.
     * @returns {string|null}
     */
    findHistoryKey(title, slug, readChapters) {
        if (!readChapters) return null;

        // Platform-namespaced key
        const namespacedKey = `${this.platformId}:${slug}`;
        if (readChapters[namespacedKey]) return namespacedKey;

        // Direct title match
        if (readChapters[title]) return title;

        // Normalized title match
        const normalizedTarget = this.normalizeTitle(title);
        for (const key of Object.keys(readChapters)) {
            if (this.normalizeTitle(key) === normalizedTarget) {
                return key;
            }
        }

        return null;
    }

    /**
     * Normalize title for fuzzy matching.
     * @param {string} title - Title to normalize.
     * @returns {string}
     */
    normalizeTitle(title) {
        if (!title) return '';
        return title.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Apply borders and badges to matched cards.
     * @param {Array<Object>} matchedCards - Array of matched card data.
     */
    async applyBorders(matchedCards) {
        if (!this.isExtensionContextValid()) return;

        const settings = await this.getStorage([
            'CustomBookmarksfeatureEnabled',
            'customBookmarks',
            'CustomBorderSizefeatureEnabled',
            'CustomBorderSize',
            'SyncandMarkReadfeatureEnabled',
            `${this.platformName}ShowProgress`
        ]);

        const borderSize = settings.CustomBorderSizefeatureEnabled
            ? (settings.CustomBorderSize || 4)
            : 4;

        const showProgress = settings[`${this.platformName}ShowProgress`] !== false;

        for (const match of matchedCards) {
            if (!match.bookmark?.status) continue;

            const { color, style } = this.getBorderStyle(match.bookmark.status, settings);
            if (color === 'transparent') continue;

            // Apply border using adapter method
            this.adapter.applyBorder(match.element, color, borderSize, style);

            // Add progress badge if enabled
            if (showProgress && match.readHistory?.length > 0) {
                const highestUnit = this.getHighestUnit(match.readHistory);
                if (highestUnit > 0) {
                    this.applyProgressBadge(match.element, highestUnit, match.totalUnits);
                }
            }

            // Mark as processed
            match.element.dataset.bmhProcessed = 'true';
        }
    }

    /**
     * Get border style based on bookmark status.
     * @param {string} status - Bookmark status.
     * @param {Object} settings - Storage settings.
     * @returns {{color: string, style: string}}
     */
    getBorderStyle(status, settings) {
        const normalizedStatus = status?.trim().toLowerCase() || '';
        let borderColor = 'transparent';
        let borderStyle = 'solid';

        // Standard status matching
        if (normalizedStatus.includes('reading')) {
            borderColor = STATUS_COLORS['Reading'];
        } else if (normalizedStatus.includes('dropped')) {
            borderColor = STATUS_COLORS['Dropped'];
        } else if (normalizedStatus.includes('completed')) {
            borderColor = STATUS_COLORS['Completed'];
        } else if (normalizedStatus.includes('on-hold') || normalizedStatus.includes('hold')) {
            borderColor = STATUS_COLORS['On-Hold'];
        } else if (normalizedStatus.includes('plan to read')) {
            borderColor = STATUS_COLORS['Plan to Read'];
        } else if (normalizedStatus.includes('read') && settings.SyncandMarkReadfeatureEnabled) {
            borderColor = '#9CA3AF';
        }

        // Custom bookmark overrides
        if (settings.CustomBookmarksfeatureEnabled) {
            const customBookmarks = settings.customBookmarks || [];
            customBookmarks.forEach(custom => {
                if (custom.name && normalizedStatus.includes(custom.name.toLowerCase())) {
                    borderColor = custom.color;
                    borderStyle = custom.style || 'solid';
                }
            });
        }

        return { color: borderColor, style: borderStyle };
    }

    /**
     * Get highest chapter/episode number from history array.
     * @param {Array<string>} history - Array of chapter/episode strings.
     * @returns {number}
     */
    getHighestUnit(history) {
        if (!history || history.length === 0) return 0;

        let highest = 0;
        history.forEach(unit => {
            const match = String(unit).match(/^(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > highest) highest = num;
            }
        });

        return highest;
    }

    /**
     * Apply progress badge to element.
     * @param {HTMLElement} element - Target element.
     * @param {number} current - Current chapter/episode.
     * @param {number|null} total - Total chapters/episodes.
     */
    applyProgressBadge(element, current, total) {
        // Remove existing badge
        const existingBadge = element.querySelector('.bmh-progress-badge');
        if (existingBadge) existingBadge.remove();

        const unitLabel = this.unitName === 'episode' ? 'Ep.' : 'Ch.';
        const text = total ? `${unitLabel} ${current}/${total}` : `${unitLabel} ${current}`;

        const badge = document.createElement('div');
        badge.className = 'bmh-progress-badge';
        badge.textContent = text;

        // Apply badge styles
        const position = this.adapter.getBadgePosition?.() || { bottom: '4px', left: '4px' };
        Object.assign(badge.style, {
            position: 'absolute',
            ...position,
            background: BADGE_STYLES.background,
            color: BADGE_STYLES.color,
            fontSize: BADGE_STYLES.fontSize,
            fontWeight: BADGE_STYLES.fontWeight,
            padding: BADGE_STYLES.padding,
            borderRadius: BADGE_STYLES.borderRadius,
            fontFamily: BADGE_STYLES.fontFamily,
            zIndex: '10',
            pointerEvents: 'none'
        });

        // Find best container for badge
        const container = element.querySelector('[style*="position: relative"]') || element;
        if (container.style.position !== 'relative') {
            container.style.position = 'relative';
        }
        container.appendChild(badge);
    }

    /**
     * Get data from chrome.storage.local.
     * @param {Array<string>} keys - Keys to retrieve.
     * @returns {Promise<Object>}
     */
    getStorage(keys) {
        return new Promise((resolve) => {
            if (!this.isExtensionContextValid()) {
                resolve({});
                return;
            }
            chrome.storage.local.get(keys, (data) => {
                if (chrome.runtime.lastError) {
                    resolve({});
                } else {
                    resolve(data);
                }
            });
        });
    }

    /**
     * Set data to chrome.storage.local.
     * @param {Object} data - Data to set.
     * @returns {Promise<void>}
     */
    setStorage(data) {
        return new Promise((resolve) => {
            if (!this.isExtensionContextValid()) {
                resolve();
                return;
            }
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    // ignore
                }
                resolve();
            });
        });
    }

    /**
     * Cleanup observers on unload.
     */
    cleanup() {
        this.observer?.disconnect();
        this.urlObserver?.disconnect();
    }
}

export default ContentScriptBase;
