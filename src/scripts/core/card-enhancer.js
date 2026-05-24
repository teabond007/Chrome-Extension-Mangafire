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
    constructor(adapter, settings) {
        console.log("[CardEnhancer] constructor called!");
        if (settings == null) settings = {};
        this.adapter = adapter;

        var borderSize = settings[SETTINGS.HIGHLIGHT_THICKNESS];
        if (borderSize == undefined) borderSize = 4;

        this.settings = {
            border: {
                size: borderSize,
                style: settings[SETTINGS.BORDER_STYLE] || 'solid',
                radius: '8px'
            }
        };

        this.settings.highlighting = settings[TOGGLES.LIBRARY_BORDERS] !== false;
        this.settings.quickActions = settings[TOGGLES.QUICK_ACTIONS] !== false;
        this.settings.showRibbons = settings[TOGGLES.LIBRARY_SHOW_RIBBONS] !== false;
        
        var customStatuses = settings[DATA.CUSTOM_STATUSES];
        if (Array.isArray(customStatuses) == false) {
            customStatuses = [];
        }
        this.settings.customStatuses = customStatuses;
        this.settings.customStatusesEnabled = settings[TOGGLES.CUSTOM_STATUS_ENABLED] !== false;
        console.log("[CardEnhancer] constructor finished setting up settings!");
    }

    /**
     * Enhance all cards found on the current page.
     * @returns {Promise<number>} Number of cards enhanced
     */
    async enhanceAll() {
        console.log("[CardEnhancer] Starting the enhanceAll function now!");
        if (!chrome.runtime?.id) {
            console.log('[CardEnhancer] Context is bad, we cannot enhance.');
            return 0;
        }

        try {
            console.log("[CardEnhancer] Finding all the cards on the page...");
            var cards = this.findCards();
            console.log("[CardEnhancer] We found " + cards.length + " cards on this page.");
            
            console.log("[CardEnhancer] Getting library entries and read chapters from storage...");
            var storageData = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES, DATA.READING_HISTORY]);
            
            var library = [];
            if (Array.isArray(storageData[DATA.LIBRARY_ENTRIES])) {
                library = storageData[DATA.LIBRARY_ENTRIES];
            } else {
                console.log("[CardEnhancer] Library entries in storage was not an array, using empty list.");
            }

            var readChapters = storageData[DATA.READING_HISTORY] || {};

            console.log("[CardEnhancer] Processing history for each library entry...");
            for (var k = 0; k < library.length; k++) {
                var entry = library[k];
                if (entry && entry.title) {
                    var historyKey = this.findHistoryKey(entry.title, entry.slug, readChapters);
                    var chaptersForEntry = [];
                    if (historyKey) {
                        chaptersForEntry = readChapters[historyKey] || [];
                    }
                    entry.readChapters = chaptersForEntry;
                    entry.lastReadChapter = this.getHighestChapter(chaptersForEntry);
                }
            }

            var enhancedCount = 0;

            console.log("[CardEnhancer] Looping through all the cards to enhance them...");
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];

                try {
                    if (card.element.dataset.bmhEnhanced) {
                        console.log("[CardEnhancer] Card is already enhanced, skipping: " + card.data.title);
                        continue;
                    }

                    console.log("[CardEnhancer] Looking for match for card: " + card.data.title);
                    var match = this.findMatch(card, library);

                    if (match) {
                        console.log("[CardEnhancer] Card matched an entry in library! Applying enhancements.");
                        this.applyEnhancements(card, match);
                    } else if (this.settings.quickActions) {
                        console.log("[CardEnhancer] Card is new! Creating a skeleton entry for: " + card.data.title);
                        var skeletonEntry = {
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
                    enhancedCount = enhancedCount + 1;
                } catch (cardError) {
                    console.log('[CardEnhancer] Single card error occurred: ' + cardError);
                }
            }

            console.log("[CardEnhancer] Done enhancing cards! Total enhanced in this run: " + enhancedCount);
            return enhancedCount;
        } catch (err) {
            console.log('[CardEnhancer] Oh no! Global enhancement error: ' + err);
            return 0;
        }
    }

    /**
     * Find all manga card elements on page.
     * @returns {Array<{ element: HTMLElement, data: Object }>}
     */
    findCards() {
        var selector = this.adapter.selectors.card;
        if (!selector) return [];

        var elements = document.querySelectorAll(selector);
        var cards = [];

        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var data = this.adapter.extractCardData(el);

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
    // We don't need a separate loadLibrary function anymore as it is simpler to just call it in enhanceAll

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
            var namespacedKey = (this.adapter.PREFIX || '') + slug;
            if (readChapters[namespacedKey]) return namespacedKey;

            // Try bare slug
            if (readChapters[slug]) return slug;

            // Try slug without trailing ID (e.g. "slug.123" → "slug")
            if (slug.includes('.')) {
                var baseSlug = slug.substring(0, slug.lastIndexOf('.'));
                if (readChapters[baseSlug]) return baseSlug;
            }
        }

        // Try direct title match
        if (readChapters[title]) return title;

        // Try normalized title match against all keys
        var normalized = this.normalizeTitle(title);
        var keys = Object.keys(readChapters);
        for (var i = 0; i < keys.length; i++) {
            if (this.normalizeTitle(keys[i]) === normalized) {
                return keys[i];
            }
        }

        return null;
    }

    /**
     * if title both in library and on card, return object.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Array} library
     * @returns {Object|undefined}
     */
    findMatch(card, library) {
        console.log("[CardEnhancer] Starting findMatch for: " + card.data.title);
        try {
            var normalizedCardTitle = this.normalizeTitle(card.data.title);
            console.log("[CardEnhancer] Card title normalized is: " + normalizedCardTitle);
            
            // Loop through all entries to see if we find a title that matches
            for (var i = 0; i < library.length; i++) {
                var entry = library[i];
                var entryTitle = entry.title;
                var normalizedEntryTitle = this.normalizeTitle(entryTitle);
                
                if (normalizedEntryTitle === normalizedCardTitle) {
                    console.log("[CardEnhancer] Wow, we found a match in the library! Title is: " + entry.title);
                    return entry;
                }
            }
            console.log("[CardEnhancer] We did not find any match for: " + card.data.title);
        } catch (e) {
            console.log("[CardEnhancer] Oh no! Something went wrong in findMatch: " + e);
        }
        return undefined;
    }

    /**
     * Apply all enabled enhancements to a matched card.
     * applyRibbon, applyQuickActions, applyBorder
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyEnhancements(card, entry) {
        console.log("[CardEnhancer] applyEnhancements called for: " + entry.title);
        try {
            if (this.settings.highlighting) {
                console.log("[CardEnhancer] Library borders enabled, calling applyBorder");
                this.applyBorder(card, entry);
            }

            if (this.settings.quickActions) {
                console.log("[CardEnhancer] Quick actions enabled, calling applyQuickActions");
                this.applyQuickActions(card, entry);
            }

            if (this.settings.showRibbons) {
                console.log("[CardEnhancer] Show ribbons enabled, calling applyRibbon");
                this.applyRibbon(card, entry);
            }
        } catch (err) {
            console.log("[CardEnhancer] Error applying enhancements: " + err);
        }
    }

    /**
     * Resolve the border color for a given status string.
     * Checks built-in STATUS_COLORS first, then custom statuses.
     * @param {string} status - Lowercased status string
     * @returns {{ color: string, style: string }}
     */
    resolveStatusColor(status) {
        var color = '';
        var style = this.settings.border.style;

        // Check built-in status colors
        var colorKeys = Object.keys(STATUS_COLORS);
        for (var i = 0; i < colorKeys.length; i++) {
            var key = colorKeys[i];
            if (status === key.toLowerCase() || status.includes(key.toLowerCase())) {
                color = STATUS_COLORS[key];
                break;
            }
        }

        // Custom status overrides (highest priority)
        if (this.settings.customStatusesEnabled && this.settings.customStatuses) {
            for (var i = 0; i < this.settings.customStatuses.length; i++) {
                var custom = this.settings.customStatuses[i];
                if (custom.name && status.includes(custom.name.toLowerCase())) {
                    color = custom.color;
                    style = custom.style || 'solid';
                }
            }
        }

        return { color, style };
    }

    /**
     * Apply a colored border to a card based on its library status.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyBorder(card, entry) {
        var status = (entry.status || '').trim().toLowerCase();
        if (!status || status === 'add to library') return;

        var { color, style } = this.resolveStatusColor(status);
        if (!color) return;

        // Use adapter's custom border method if provided
        if (this.adapter.applyBorder) {
            this.adapter.applyBorder(card.element, color, this.settings.border.size, style);
            return;
        }

        // Default: apply directly to the card's li wrapper (or the card itself)
        var target = card.element.closest('li') || card.element;

        // Ensure target is at least inline-block so border wraps content correctly
        var display = window.getComputedStyle(target).display;
        if (display === 'inline') {
            target.style.setProperty('display', 'inline-block', 'important');
        }
       
        target.style.setProperty('border', `${this.settings.border.size}px ${style} ${color}`, 'important');
        target.style.setProperty('box-shadow', 'none', 'important');
        target.style.setProperty('border-radius', this.settings.border.radius, 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        
        // Ensure content is visible and wraps correctly
        target.style.setProperty('overflow', 'visible', 'important');
        
        // If target has no height (collapsed), force a minimum height based on font size or content
        if (target.offsetHeight === 0) {
            target.style.setProperty('min-height', '20px', 'important');
            target.style.setProperty('display', 'inline-block', 'important');
        }
    }

    /**
     * Apply a corner status ribbon to a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyRibbon(card, entry) {
        if (!entry.status || entry.status === 'Add to Library') return;

        var status = (entry.status || '').trim().toLowerCase();
        var { color } = this.resolveStatusColor(status);

        // Fall back to a default accent color if none found
        var finalColor = color || '#6366f1';

        OverlayFactory.mountStatusRibbon(card.element, entry.status, finalColor);
    }


    /**
     * Apply a "NEW" badge for cards with unread chapters.
     * @param {{ element: HTMLElement, data: Object }} card
     */
    // applyNewBadge has been removed because it is never an option in the program.

    /**
     * Apply the quick-actions tooltip overlay to a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyQuickActions(card, entry) {
        var callbacks = {
            continue: (e) => this.handleContinueReading(e, card),
            status: (e, target) => this.handleStatusChange(e, target || null, card),
            details: (e) => this.handleViewDetails(e, card)
        };

        OverlayFactory.mountQuickActions(card.element, entry, this.adapter, callbacks);
        
        // Ensure element can host absolute children
        var display = window.getComputedStyle(card.element).display;
        if (display === 'inline') {
            card.element.style.setProperty('display', 'inline-block', 'important');
        }
        card.element.style.setProperty('position', 'relative', 'important');
        card.element.style.setProperty('overflow', 'visible', 'important');
    }

    /**
     * Handle "Continue Reading" — navigates to the next chapter URL.
     * Tries adapter URL builder, then smart URL increment, then fallbacks.
     * @param {Object} entry - Library entry
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleContinueReading(entry, card) {
        var nextChapter = OverlayFactory.calculateNextChapter(entry);

        // 1. Try adapter's own chapter URL builder
        var url = null;
        if (this.adapter.buildChapterUrl) {
            url = this.adapter.buildChapterUrl(entry, nextChapter);
        }

        // 2. If adapter didn't provide a URL, try to increment the last known reader URL
        if (url == null && entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL]) {
            var lastUrl = entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL];
            var lastChapter = parseFloat(entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER]) || 0;

            // Use simple string replacement to increment the chapter in the URL
            var searchStr1 = "/" + lastChapter;
            var searchStr2 = "-" + lastChapter;

            if (lastUrl.indexOf(searchStr1) != -1) {
                url = lastUrl.replace(searchStr1, "/" + nextChapter);
                console.log('[CardEnhancer] URL updated (type 1): ' + url);
            } else if (lastUrl.indexOf(searchStr2) != -1) {
                url = lastUrl.replace(searchStr2, "-" + nextChapter);
                console.log('[CardEnhancer] URL updated (type 2): ' + url);
            } else {
                // Can't find the chapter in URL — just go back to the last read page
                url = lastUrl;
                console.log('[CardEnhancer] Could not find chapter in URL, using last read URL');
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
            var data = await new Promise(resolve => {
                chrome.storage.local.get([DATA.LIBRARY_ENTRIES], resolve);
            });

            var entries = data[DATA.LIBRARY_ENTRIES] || [];

            // Find existing entry by normalized title
            var foundIdx = -1;
            for (var i = 0; i < entries.length; i++) {
                if (this.normalizeTitle(entries[i].title) === this.normalizeTitle(entry.title)) {
                    foundIdx = i;
                    break;
                }
            }

            if (foundIdx !== -1) {
                // Entry already exists — just update its status in place
                entries[foundIdx].status = newStatus;
                entries[foundIdx].lastUpdated = Date.now();
                console.log('[CardEnhancer] Updated existing entry status: ' + entry.title + ' → ' + newStatus);
            } else {
                // Entry is new — build it and try to fetch metadata before saving
                var newEntry = {
                    title: entry.title,
                    slug: entry.slug,
                    status: newStatus,
                    source: entry.source,
                    sourceId: entry.sourceId,
                    sourceUrl: entry.sourceUrl,
                    lastUpdated: Date.now()
                };

                try {
                    var metadata = await getMergedMetadata(entry.title);
                    if (metadata) {
                        newEntry.anilistData = metadata;
                    }
                } catch (e) {
                    console.warn('[CardEnhancer] Failed to fetch metadata for quick action', e);
                }

                entries.push(newEntry);
                console.log('[CardEnhancer] Added new entry to library: ' + entry.title);
            }

            // Sanitize before saving — strips Vue proxies and ensures plain array
            var finalEntries = Array.isArray(entries) ? entries : [];
            await new Promise(resolve => {
                chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalEntries)) }, resolve);
            });

            console.log('[CardEnhancer] Status saved: ' + entry.title + ' → ' + newStatus);

            // Re-run enhancements after a short delay so storage can settle
            setTimeout(() => {
                var enhanced = document.querySelectorAll('[data-bmh-enhanced]');
                for (var i = 0; i < enhanced.length; i++) {
                    var el = enhanced[i];
                    el.removeAttribute('data-bmh-enhanced');

                    var overlays = el.querySelectorAll('.bmh-vue-container, .bmh-vue-badge-container');
                    for (var j = 0; j < overlays.length; j++) {
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

        var highest = 0;
        for (var i = 0; i < chapters.length; i++) {
            var match = String(chapters[i]).match(/^(\d+\.?\d*)/);
            if (match) {
                var num = parseFloat(match[1]);
                if (num > highest) {
                    highest = num;
                }
            }
        }

        return highest;
    }
}

export default CardEnhancer;
