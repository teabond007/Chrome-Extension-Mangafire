/**
 * @fileoverview Universal Card Enhancer
 * Applies visual enhancements (borders, badges, overlays) to manga cards
 * across all supported platforms using their respective adapters.
 *
 * @module core/card-enhancer
 */

import { STATUS_COLORS, TOGGLES, SETTINGS, DATA, LIBRARY_ENTRY_KEYS } from '../../config.js';
import { OverlayFactory } from './overlay-factory.js';
import { getMergedMetadata } from './api/metadata-service';

/**
 * Universal card enhancement for any platform.
 * Applies borders, badges, overlays using a platform adapter.
 */
export class CardEnhancer {
    /**
     * @param {Object} adapter - Platform-specific adapter
     * @param {Object} settings - User settings from Chrome storage
     */
    constructor(adapter, settings = {}) {
        this.adapter = adapter;

        // Resolve border size — zero if custom border toggle is off
        let borderSize = 0;
        if (settings[TOGGLES.CUSTOM_BORDER_SIZE_ENABLED] !== false) {
            borderSize = settings[SETTINGS.HIGHLIGHT_THICKNESS] || 4;
        }

        this.settings = {
            highlighting: settings[TOGGLES.CUSTOM_SITE_HIGHLIGHT] !== false,
            progressBadges: settings.progressBadges !== false || settings[TOGGLES.SHOW_READING_BADGES] !== false,
            quickActions: settings[TOGGLES.CUSTOM_SITE_QUICK_ACTIONS] !== false,
            newChapterBadges: settings.newChapterBadges !== false,
            showRibbons: settings[TOGGLES.CUSTOM_SITE_SHOW_RIBBONS] !== false,
            useGlow: !!settings[TOGGLES.CUSTOM_SITE_GLOW_EFFECT],
            border: {
                size: borderSize,
                style: settings[SETTINGS.BORDER_STYLE] || 'solid',
                radius: '8px'
            },
            customStatuses: Array.isArray(settings[DATA.CUSTOM_STATUSES]) ? settings[DATA.CUSTOM_STATUSES] : [],
            customStatusesEnabled: settings[TOGGLES.CUSTOM_STATUS_ENABLED] !== false
        };
    }

    /**
     * Enhance all cards found on the current page.
     * @returns {Promise<number>} Number of cards enhanced
     */
    async enhanceAll() {
        if (!chrome.runtime?.id) {
            console.log('[CardEnhancer] Extension context invalidated, skipping enhancement.');
            return 0;
        }

        try {
            const cards = this.findCards();
            const library = await this.loadLibrary();

            let enhanced = 0;

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];

                try {
                    // Skip cards already processed
                    if (card.element.dataset.bmhEnhanced) {
                        continue;
                    }

                    const match = this.findMatch(card, library);

                    if (match) {
                        this.applyEnhancements(card, match);
                    } else if (this.settings.quickActions) {
                        // No library match — show an "Add to Library" skeleton
                        const skeletonEntry = {
                            title: card.data.title,
                            slug: card.data.id,
                            status: 'Add to Library',
                            source: this.adapter.id,
                            sourceId: card.data.id,
                            sourceUrl: card.data.url
                        };
                        this.applyQuickActions(card, skeletonEntry);
                    }

                    card.element.dataset.bmhEnhanced = 'true';
                    enhanced++;
                } catch (cardError) {
                    console.error('[CardEnhancer] Error enhancing card:', cardError, card);
                }
            }

            return enhanced;
        } catch (err) {
            console.error('[CardEnhancer] Global enhancement error:', err);
            return 0;
        }
    }

    /**
     * Find all manga card elements on the page using adapter selectors.
     * @returns {Array<{ element: HTMLElement, data: Object }>}
     */
    findCards() {
        const selector = this.adapter.selectors.card;
        if (!selector) return [];

        const elements = document.querySelectorAll(selector);
        const cards = [];

        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const data = this.adapter.extractCardData(el);

            // Only include cards that have at least a title or id
            if (data.title || data.id) {
                cards.push({ element: el, data: data });
            }
        }

        return cards;
    }

    /**
     * Load library entries and reading history from Chrome storage.
     * Attaches read chapter data to each entry before returning.
     * @returns {Promise<Array>}
     */
    loadLibrary() {
        return new Promise((resolve) => {
            chrome.storage.local.get([DATA.LIBRARY_ENTRIES, DATA.READING_HISTORY], (data) => {
                if (chrome.runtime.lastError) {
                    resolve([]);
                    return;
                }

                let entries = [];
                if (Array.isArray(data[DATA.LIBRARY_ENTRIES])) {
                    entries = data[DATA.LIBRARY_ENTRIES];
                }

                const readChapters = data[DATA.READING_HISTORY] || {};

                // Attach read chapter history to each entry
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (entry && entry.title) {
                        const historyKey = this.findHistoryKey(entry.title, entry.slug, readChapters);
                        let chaptersForEntry = [];
                        if (historyKey) {
                            chaptersForEntry = readChapters[historyKey] || [];
                        }
                        entry.readChapters = chaptersForEntry;
                        entry.lastReadChapter = this.getHighestChapter(chaptersForEntry);
                    }
                }

                resolve(entries);
            });
        });
    }

    /**
     * Find the reading history key for an entry by trying slug, prefix, and title.
     * @param {string} title - Entry title
     * @param {string|undefined} slug - Entry slug
     * @param {Object} readChapters - Reading history map
     * @returns {string|null}
     */
    findHistoryKey(title, slug, readChapters) {
        if (!readChapters) return null;

        if (slug) {
            // Try slug prefixed with adapter namespace
            const namespacedKey = (this.adapter.PREFIX || '') + slug;
            if (readChapters[namespacedKey]) return namespacedKey;

            // Try bare slug
            if (readChapters[slug]) return slug;

            // Try slug without trailing ID (e.g. "slug.123" → "slug")
            if (slug.includes('.')) {
                const baseSlug = slug.substring(0, slug.lastIndexOf('.'));
                if (readChapters[baseSlug]) return baseSlug;
            }
        }

        // Try direct title match
        if (readChapters[title]) return title;

        // Try normalized title match against all keys
        const normalized = this.normalizeTitle(title);
        const keys = Object.keys(readChapters);
        for (let i = 0; i < keys.length; i++) {
            if (this.normalizeTitle(keys[i]) === normalized) {
                return keys[i];
            }
        }

        return null;
    }

    /**
     * Match a card to a library entry by source ID or normalized title.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Array} library
     * @returns {Object|undefined}
     */
    findMatch(card, library) {
        // First pass: exact source + sourceId match
        for (let i = 0; i < library.length; i++) {
            const entry = library[i];
            if (entry.source === this.adapter.id && entry.sourceId === card.data.id) {
                return entry;
            }
        }

        // Second pass: normalized title match
        const normalizedCardTitle = this.normalizeTitle(card.data.title);
        for (let i = 0; i < library.length; i++) {
            const entry = library[i];
            if (this.normalizeTitle(entry.title) === normalizedCardTitle) {
                return entry;
            }
        }

        return undefined;
    }

    /**
     * Apply all enabled enhancements to a matched card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyEnhancements(card, entry) {
        if (this.settings.highlighting) {
            this.applyBorder(card, entry);
        }

        if (this.settings.progressBadges) {
            const readCount = entry.readChapters ? entry.readChapters.length : 0;
            if (readCount > 0) {
                this.applyProgressBadge(card, entry);
            }
        }

        if (this.settings.newChapterBadges && entry.hasNewChapters) {
            this.applyNewBadge(card);
        }

        if (this.settings.quickActions) {
            this.applyQuickActions(card, entry);
        }

        if (this.settings.showRibbons) {
            this.applyRibbon(card, entry);
        }
    }

    /**
     * Resolve the border color for a given status string.
     * Checks built-in STATUS_COLORS first, then custom statuses.
     * @param {string} status - Lowercased status string
     * @returns {{ color: string, style: string }}
     */
    resolveStatusColor(status) {
        let color = '';
        let style = this.settings.border.style;

        // Check built-in status colors
        const colorKeys = Object.keys(STATUS_COLORS);
        for (let i = 0; i < colorKeys.length; i++) {
            const key = colorKeys[i];
            if (status === key.toLowerCase() || status.includes(key.toLowerCase())) {
                color = STATUS_COLORS[key];
                break;
            }
        }

        // Custom status overrides (highest priority)
        if (this.settings.customStatusesEnabled && this.settings.customStatuses) {
            for (let i = 0; i < this.settings.customStatuses.length; i++) {
                const custom = this.settings.customStatuses[i];
                if (custom.name && status.includes(custom.name.toLowerCase())) {
                    color = custom.color;
                    style = custom.style || 'solid';
                }
            }
        }

        return { color, style };
    }

    /**
     * Apply a colored border or glow effect to a card based on its library status.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyBorder(card, entry) {
        const status = (entry.status || '').trim().toLowerCase();
        if (!status || status === 'add to library') return;

        const { color, style } = this.resolveStatusColor(status);
        if (!color) return;

        // Use adapter's custom border method if provided
        if (this.adapter.applyBorder) {
            this.adapter.applyBorder(card.element, color, this.settings.border.size, style);
            return;
        }

        // Default: apply directly to the card's li wrapper (or the card itself)
        const target = card.element.closest('li') || card.element;

        if (this.settings.useGlow) {
            const t = this.settings.border.size;
            target.style.setProperty('border', 'none', 'important');
            target.style.setProperty('--glow-color', color + '80');
            target.style.setProperty('box-shadow', `
                0 0 ${t * 2.5}px var(--glow-color),
                0 0 ${t * 5}px var(--glow-color),
                0 0 ${t * 8}px var(--glow-color),
                inset 0 0 15px rgba(255, 255, 255, 0.05)
            `, 'important');
        } else {
            target.style.setProperty('border', `${this.settings.border.size}px ${style} ${color}`, 'important');
            target.style.setProperty('box-shadow', 'none', 'important');
        }

        target.style.setProperty('border-radius', this.settings.border.radius, 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
    }

    /**
     * Apply a corner status ribbon to a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyRibbon(card, entry) {
        if (!entry.status || entry.status === 'Add to Library') return;

        const status = (entry.status || '').trim().toLowerCase();
        const { color } = this.resolveStatusColor(status);

        // Fall back to a default accent color if none found
        const finalColor = color || '#6366f1';

        OverlayFactory.mountStatusRibbon(card.element, entry.status, finalColor);
    }

    /**
     * Apply a progress badge showing current/total chapters.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyProgressBadge(card, entry) {
        const unitName = this.adapter.unitName === 'episode' ? 'Ep.' : 'Ch.';

        // Prefer explicit chapter count, fall back to anilist data
        let totalChapters = entry.chapters || 0;
        if (!totalChapters && entry.anilistData) {
            totalChapters = entry.anilistData.chapters || 0;
        }

        let text = '';
        if (totalChapters) {
            text = unitName + ' ' + entry.lastReadChapter + '/' + totalChapters;
        } else {
            text = unitName + ' ' + entry.lastReadChapter + '+';
        }

        let position = { bottom: '4px', left: '4px' };
        if (this.adapter.getBadgePosition) {
            position = this.adapter.getBadgePosition();
        }

        OverlayFactory.mountStatusBadge(card.element, text, 'progress', position);
    }

    /**
     * Apply a "NEW" badge for cards with unread chapters.
     * @param {{ element: HTMLElement, data: Object }} card
     */
    applyNewBadge(card) {
        OverlayFactory.mountStatusBadge(card.element, 'NEW', 'new');
    }

    /**
     * Apply the quick-actions tooltip overlay to a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyQuickActions(card, entry) {
        const callbacks = {
            continue: (e) => this.handleContinueReading(e, card),
            status: (e, target) => this.handleStatusChange(e, target || null, card),
            rating: (e, target) => this.handleRatingChange(e, target || null, card),
            details: (e) => this.handleViewDetails(e, card)
        };

        OverlayFactory.mountQuickActions(card.element, entry, this.adapter, callbacks);
        card.element.style.position = 'relative';
    }

    /**
     * Handle "Continue Reading" — navigates to the next chapter URL.
     * Tries adapter URL builder, then smart URL increment, then fallbacks.
     * @param {Object} entry - Library entry
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleContinueReading(entry, card) {
        const nextChapter = OverlayFactory.calculateNextChapter(entry);

        // 1. Try adapter's own chapter URL builder
        let url = null;
        if (this.adapter.buildChapterUrl) {
            url = this.adapter.buildChapterUrl(entry, nextChapter);
        }

        // 2. If adapter didn't provide a URL, try to increment the last known reader URL
        if (!url && entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL]) {
            const lastUrl = entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL];
            const lastChapter = parseFloat(entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER]) || 0;

            // Matches chapter numbers in URL paths like ".../chapter-42" or ".../42/"
            const chapterRegex = new RegExp('([/-])' + lastChapter + '(\\b|/|\\.|$)');

            if (chapterRegex.test(lastUrl)) {
                url = lastUrl.replace(chapterRegex, '$1' + nextChapter + '$2');
                console.log('[CardEnhancer] Smart incremented URL: ' + lastUrl + ' -> ' + url);
            } else {
                // Can't find the chapter in URL — just go back to the last read page
                url = lastUrl;
                console.log('[CardEnhancer] Using last read URL fallback: ' + url);
            }
        }

        // 3. Navigate, with progressively weaker fallbacks
        if (url) {
            window.location.href = url;
        } else if (entry.sourceUrl) {
            window.location.href = entry.sourceUrl;
        } else if (card.data.url) {
            window.location.href = card.data.url;
        } else {
            console.log('[CardEnhancer] No URL available for continue reading:', entry);
        }
    }

    /**
     * Handle status change — opens the status picker popup.
     * @param {Object} entry - Library entry
     * @param {HTMLElement} btn - Button element that was clicked
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleStatusChange(entry, btn, card) {
        OverlayFactory.mountStatusPicker(
            btn,
            entry,
            this.settings.customStatuses,
            (newStatus, entry) => this.saveStatusChange(entry, newStatus)
        );
    }

    /**
     * Handle rating change — opens the rating picker popup.
     * @param {Object} entry - Library entry
     * @param {HTMLElement} btn - Button element that was clicked
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleRatingChange(entry, btn, card) {
        OverlayFactory.mountRatingPicker(
            btn,
            entry,
            (rating, entry) => this.saveRatingChange(entry, rating)
        );
    }

    /**
     * Handle view details — sends a message to open the options page detail modal.
     * Adapter can override this behaviour.
     * @param {Object} entry - Library entry
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleViewDetails(entry, card) {
        if (this.adapter.handleViewDetails) {
            this.adapter.handleViewDetails(entry, card);
            return;
        }

        chrome.runtime.sendMessage({ type: 'showMangaDetails', title: entry.title }, () => {
            if (chrome.runtime.lastError) {
                console.log('[CardEnhancer] Error opening details:', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Save a new status for an entry to Chrome storage.
     * Creates a new library entry if the manga is not already saved.
     * @param {Object} entry - Library entry
     * @param {string} newStatus - New status string
     */
    async saveStatusChange(entry, newStatus) {
        try {
            const data = await new Promise(resolve => {
                chrome.storage.local.get([DATA.LIBRARY_ENTRIES], resolve);
            });

            let entries = data[DATA.LIBRARY_ENTRIES] || [];

            // Find existing entry by normalized title
            let foundIdx = -1;
            for (let i = 0; i < entries.length; i++) {
                if (this.normalizeTitle(entries[i].title) === this.normalizeTitle(entry.title)) {
                    foundIdx = i;
                    break;
                }
            }

            if (foundIdx !== -1) {
                // Update existing
                entries[foundIdx].status = newStatus;
            } else {
                // Add new entry and try to fetch metadata
                const newEntry = Object.assign({}, entry, {
                    status: newStatus,
                    lastUpdated: Date.now()
                });

                try {
                    const metadata = await getMergedMetadata(entry.title);
                    if (metadata) {
                        newEntry.anilistData = metadata;
                    }
                } catch (e) {
                    console.warn('[CardEnhancer] Failed to fetch metadata for quick action', e);
                }

                entries.push(newEntry);
                console.log('[CardEnhancer] Added new entry to library: ' + entry.title);
            }

            // Sanitize before saving — strips Vue proxies
            const finalEntries = Array.isArray(entries) ? entries : [];
            await new Promise(resolve => {
                chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalEntries)) }, resolve);
            });

            console.log('[CardEnhancer] Status updated: ' + entry.title + ' → ' + newStatus);

            // Re-run enhancements after a short delay so storage can settle
            setTimeout(() => {
                const enhanced = document.querySelectorAll('[data-bmh-enhanced]');
                for (let i = 0; i < enhanced.length; i++) {
                    const el = enhanced[i];
                    el.removeAttribute('data-bmh-enhanced');

                    const overlays = el.querySelectorAll('.bmh-vue-container, .bmh-vue-badge-container');
                    for (let j = 0; j < overlays.length; j++) {
                        overlays[j].remove();
                    }
                }
                this.enhanceAll();
            }, 100);
        } catch (e) {
            console.error('[CardEnhancer] Failed to save status:', e);
        }
    }

    /**
     * Save a new rating for an entry to Chrome storage.
     * @param {Object} entry - Library entry
     * @param {number} rating - Rating value (0-10)
     */
    async saveRatingChange(entry, rating) {
        try {
            const data = await new Promise(resolve => {
                chrome.storage.local.get([DATA.LIBRARY_ENTRIES], resolve);
            });

            const entries = data[DATA.LIBRARY_ENTRIES] || [];

            // Find existing entry by normalized title
            let foundIdx = -1;
            for (let i = 0; i < entries.length; i++) {
                if (this.normalizeTitle(entries[i].title) === this.normalizeTitle(entry.title)) {
                    foundIdx = i;
                    break;
                }
            }

            if (foundIdx !== -1) {
                if (!entries[foundIdx].personalData) {
                    entries[foundIdx].personalData = {};
                }
                entries[foundIdx].personalData.rating = rating;

                const finalEntries = Array.isArray(entries) ? entries : [];
                await new Promise(resolve => {
                    chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalEntries)) }, resolve);
                });

                console.log('[CardEnhancer] Rating updated: ' + entry.title + ' → ' + rating);
            }
        } catch (e) {
            console.error('[CardEnhancer] Failed to save rating:', e);
        }
    }

    /**
     * Normalize a title to lowercase alphanumeric only for fuzzy matching.
     * @param {string} title
     * @returns {string}
     */
    normalizeTitle(title) {
        if (!title) return '';
        return title.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    /**
     * Get the highest chapter number from an array of chapter strings/numbers.
     * @param {Array<string|number>} chapters
     * @returns {number}
     */
    getHighestChapter(chapters) {
        if (!chapters || chapters.length === 0) return 0;

        let highest = 0;
        for (let i = 0; i < chapters.length; i++) {
            const match = String(chapters[i]).match(/^(\d+\.?\d*)/);
            if (match) {
                const num = parseFloat(match[1]);
                if (num > highest) {
                    highest = num;
                }
            }
        }

        return highest;
    }
}

export default CardEnhancer;
