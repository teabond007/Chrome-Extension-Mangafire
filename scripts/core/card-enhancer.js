/**
 * @fileoverview Universal Card Enhancer
 * Applies visual enhancements (borders, badges, overlays) to manga cards
 * across all supported platforms using their respective adapters.
 * 
 * Part of Phase 2: Universal Card Enhancement
 * @module core/card-enhancer
 * @version 3.8.0
 */

import { Config, STATUS_COLORS } from './config.js';
import { OverlayFactory } from './overlay-factory.js';

/**
 * Universal card enhancement for any platform.
 * Applies borders, badges, overlays using platform adapter.
 */
export class CardEnhancer {
    /**
     * @param {PlatformAdapter} adapter - Platform-specific adapter
     * @param {Object} settings - User settings from storage
     */
    constructor(adapter, settings = {}) {
        this.adapter = adapter;
        this.settings = {
            highlighting: settings.highlighting !== false,
            progressBadges: settings.progressBadges !== false,
            quickActions: settings.quickActions === true,
            newChapterBadges: settings.newChapterBadges === true,
            border: {
                size: settings.CustomBorderSize || 4,
                style: settings.borderStyle || 'solid',
                radius: '8px'
            },
            customBookmarks: settings.customBookmarks || [],
            customBookmarksEnabled: settings.CustomBookmarksfeatureEnabled || false
        };
    }

    /**
     * Enhance all cards on current page.
     * @returns {Promise<number>} Number of cards enhanced
     */
    async enhanceAll() {
        const cards = this.findCards();
        const library = await this.loadLibrary();

        let enhanced = 0;
        for (const card of cards) {
            if (card.element.dataset.bmhEnhanced) continue;

            const match = this.findMatch(card, library);
            if (match) {
                this.applyEnhancements(card, match);
                enhanced++;
            }
            card.element.dataset.bmhEnhanced = 'true';
        }

        return enhanced;
    }

    /**
     * Find all cards using adapter selectors.
     * @returns {Array<{element: HTMLElement, data: Object}>}
     */
    findCards() {
        const selector = this.adapter.selectors.card;
        if (!selector) return [];

        return Array.from(document.querySelectorAll(selector))
            .map(el => ({
                element: el,
                data: this.adapter.extractCardData(el)
            }))
            .filter(card => card.data.title || card.data.id);
    }

    /**
     * Load library entries from storage.
     * @returns {Promise<Array>}
     */
    async loadLibrary() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['savedEntriesMerged', 'userBookmarks', 'savedReadChapters'], (data) => {
                if (chrome.runtime.lastError) {
                    resolve([]);
                    return;
                }

                const savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
                const userBookmarks = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
                const readChapters = data.savedReadChapters || {};

                // Merge and deduplicate
                const merged = new Map();
                [...userBookmarks, ...savedEntries].forEach(entry => {
                    if (entry?.title) {
                        // Attach read chapters
                        const historyKey = this.findHistoryKey(entry.title, entry.slug, readChapters);
                        entry.readChapters = historyKey ? readChapters[historyKey] : [];
                        entry.lastReadChapter = this.getHighestChapter(entry.readChapters);
                        
                        merged.set(entry.title, entry);
                    }
                });

                resolve(Array.from(merged.values()));
            });
        });
    }

    /**
     * Find matching history key for an entry.
     * @param {string} title - Entry title
     * @param {string} slug - Entry slug
     * @param {Object} readChapters - Read chapters map
     * @returns {string|null}
     */
    findHistoryKey(title, slug, readChapters) {
        if (!readChapters) return null;

        // Try namespaced key with adapter prefix
        if (slug) {
            const namespacedKey = `${this.adapter.PREFIX || ''}${slug}`;
            if (readChapters[namespacedKey]) return namespacedKey;
        }

        // Try direct title match
        if (readChapters[title]) return title;

        // Try normalized match
        const normalized = this.normalizeTitle(title);
        for (const key of Object.keys(readChapters)) {
            if (this.normalizeTitle(key) === normalized) return key;
        }

        return null;
    }

    /**
     * Match card with library entry.
     * @param {Object} card - Card object
     * @param {Array} library - Library entries
     * @returns {Object|null}
     */
    findMatch(card, library) {
        // Try exact source+ID match first
        const exactMatch = library.find(e =>
            e.source === this.adapter.id &&
            e.sourceId === card.data.id
        );
        if (exactMatch) return exactMatch;

        // Fallback to normalized title match
        const normalizedTitle = this.normalizeTitle(card.data.title);
        return library.find(e =>
            this.normalizeTitle(e.title) === normalizedTitle
        );
    }

    /**
     * Apply all enhancements to a matched card.
     * @param {Object} card - Card object
     * @param {Object} entry - Library entry
     */
    applyEnhancements(card, entry) {
        if (this.settings.highlighting) {
            this.applyBorder(card, entry);
        }

        if (this.settings.progressBadges && entry.readChapters?.length > 0) {
            this.applyProgressBadge(card, entry);
        }

        if (this.settings.newChapterBadges && entry.hasNewChapters) {
            this.applyNewBadge(card);
        }

        if (this.settings.quickActions) {
            this.applyQuickActions(card, entry);
        }
    }

    /**
     * Apply colored border based on status.
     * @param {Object} card - Card object
     * @param {Object} entry - Library entry
     */
    applyBorder(card, entry) {
        const status = entry.status?.trim().toLowerCase() || '';
        let color = 'transparent';
        let style = this.settings.border.style;

        // Get color from config
        for (const [key, value] of Object.entries(STATUS_COLORS)) {
            if (status.includes(key.toLowerCase())) {
                color = value;
                break;
            }
        }

        // Custom bookmark overrides
        if (this.settings.customBookmarksEnabled) {
            this.settings.customBookmarks.forEach(custom => {
                if (custom.name && status.includes(custom.name.toLowerCase())) {
                    color = custom.color;
                    style = custom.style || 'solid';
                }
            });
        }

        if (color === 'transparent') return;

        // Use adapter's custom method if available
        if (this.adapter.applyBorder) {
            this.adapter.applyBorder(card.element, color, this.settings.border.size, style);
        } else {
            // Default border application
            const target = card.element.closest('li') || card.element;
            target.style.setProperty('border', `${this.settings.border.size}px ${style} ${color}`, 'important');
            target.style.setProperty('border-radius', this.settings.border.radius, 'important');
            target.style.setProperty('box-sizing', 'border-box', 'important');
        }
    }

    /**
     * Apply progress badge (Ch. X/Y or Ep. X/Y).
     * @param {Object} card - Card object
     * @param {Object} entry - Library entry
     */
    applyProgressBadge(card, entry) {
        const unitName = this.adapter.unitName === 'episode' ? 'Ep.' : 'Ch.';
        const totalChapters = entry.chapters || entry.anilistData?.chapters;
        
        const text = totalChapters
            ? `${unitName} ${entry.lastReadChapter}/${totalChapters}`
            : `${unitName} ${entry.lastReadChapter}`;

        const badge = this.createBadge(text, 'progress');
        
        // Get position from adapter or use default
        const position = this.adapter.getBadgePosition?.() || { bottom: '4px', left: '4px' };
        Object.assign(badge.style, position);

        this.insertBadge(card.element, badge);
    }

    /**
     * Apply "NEW" badge for unread chapters.
     * @param {Object} card - Card object
     */
    applyNewBadge(card) {
        const badge = this.createBadge('NEW', 'new');
        badge.style.cssText += 'top: 4px; right: 4px;';
        this.insertBadge(card.element, badge);
    }
    /**
     * Apply quick actions tooltip.
     * @param {Object} card - Card object
     * @param {Object} entry - Library entry
     */
    applyQuickActions(card, entry) {
        // Inject styles once
        OverlayFactory.injectStyles();
        
        // Define callbacks for tooltip actions
        const callbacks = {
            continue: (entry, btn, e) => this.handleContinueReading(entry, card),
            status: (entry, btn, e) => this.handleStatusChange(entry, btn, card),
            rating: (entry, btn, e) => this.handleRatingChange(entry, btn, card),
            details: (entry, btn, e) => this.handleViewDetails(entry, card)
        };
        
        const tooltip = OverlayFactory.create(entry, this.adapter, callbacks);
        card.element.style.position = 'relative';
        card.element.appendChild(tooltip);
    }

    /**
     * Handle "Continue Reading" action - navigates to next chapter.
     * @param {Object} entry - Library entry
     * @param {Object} card - Card object
     */
    handleContinueReading(entry, card) {
        const nextChapter = OverlayFactory.calculateNextChapter(entry);
        const url = this.adapter.buildChapterUrl?.(entry, nextChapter);
        
        if (url) {
            window.location.href = url;
        } else if (entry.mangafireUrl || entry.sourceUrl) {
            window.location.href = entry.mangafireUrl || entry.sourceUrl;
        } else if (card.data.url) {
            window.location.href = card.data.url;
        } else {
            console.log('[CardEnhancer] No URL available for continue reading:', entry);
        }
    }

    /**
     * Handle status change action - shows status picker.
     * @param {Object} entry - Library entry
     * @param {HTMLElement} btn - Clicked button
     * @param {Object} card - Card object
     */
    handleStatusChange(entry, btn, card) {
        // Remove existing picker if any
        document.querySelectorAll('.bmh-status-picker').forEach(p => p.remove());
        
        const picker = OverlayFactory.createStatusPicker(
            entry,
            (newStatus, entry) => this.saveStatusChange(entry, newStatus),
            this.settings.customBookmarks
        );
        
        // Position picker at button location (fixed position)
        const rect = btn.getBoundingClientRect();
        picker.style.left = `${rect.left}px`;
        picker.style.top = `${rect.bottom + 8}px`;
        
        document.body.appendChild(picker);
    }

    /**
     * Handle rating change action - shows rating picker.
     * @param {Object} entry - Library entry
     * @param {HTMLElement} btn - Clicked element
     * @param {Object} card - Card object
     */
    handleRatingChange(entry, btn, card) {
        // Remove existing picker if any
        document.querySelectorAll('.bmh-rating-picker').forEach(p => p.remove());
        
        const picker = OverlayFactory.createRatingPicker(
            entry,
            (rating, entry) => this.saveRatingChange(entry, rating)
        );
        
        // Position picker at button location (fixed position)
        const rect = btn.getBoundingClientRect();
        picker.style.left = `${rect.left}px`;
        picker.style.top = `${rect.bottom + 8}px`;
        
        document.body.appendChild(picker);
    }

    /**
     * Handle view details action - opens options page with manga detail modal.
     * Uses the same showMangaDetails modal as the library page.
     * @param {Object} entry - Library entry
     * @param {Object} card - Card object
     */
    handleViewDetails(entry, card) {
        // Send message to background to open options page with details modal
        chrome.runtime.sendMessage({
            type: 'showMangaDetails',
            title: entry.title
        }, () => {
            if (chrome.runtime.lastError) {
                console.log('[CardEnhancer] Error opening details:', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Save status change to storage.
     * @param {Object} entry - Library entry
     * @param {string} newStatus - New status value
     */
    async saveStatusChange(entry, newStatus) {
        try {
            const data = await new Promise(resolve => {
                chrome.storage.local.get(['savedEntriesMerged', 'userBookmarks'], resolve);
            });
            
            const entries = data.savedEntriesMerged || [];
            const bookmarks = data.userBookmarks || [];
            
            // Update in savedEntriesMerged
            const idx = entries.findIndex(e => 
                this.normalizeTitle(e.title) === this.normalizeTitle(entry.title)
            );
            if (idx !== -1) {
                entries[idx].status = newStatus;
            }
            
            // Update in userBookmarks
            const bidx = bookmarks.findIndex(b => 
                this.normalizeTitle(b.title) === this.normalizeTitle(entry.title)
            );
            if (bidx !== -1) {
                bookmarks[bidx].status = newStatus;
            }
            
            await new Promise(resolve => {
                chrome.storage.local.set({ savedEntriesMerged: entries, userBookmarks: bookmarks }, resolve);
            });
            
            console.log(`[CardEnhancer] Status updated: ${entry.title} → ${newStatus}`);
            
            // Re-enhance to reflect change
            this.enhanceAll();
        } catch (e) {
            console.error('[CardEnhancer] Failed to save status:', e);
        }
    }

    /**
     * Save rating change to storage.
     * @param {Object} entry - Library entry
     * @param {number} rating - New rating value (0-10)
     */
    async saveRatingChange(entry, rating) {
        try {
            const data = await new Promise(resolve => {
                chrome.storage.local.get(['savedEntriesMerged'], resolve);
            });
            
            const entries = data.savedEntriesMerged || [];
            const idx = entries.findIndex(e => 
                this.normalizeTitle(e.title) === this.normalizeTitle(entry.title)
            );
            
            if (idx !== -1) {
                if (!entries[idx].personalData) {
                    entries[idx].personalData = {};
                }
                entries[idx].personalData.rating = rating;
                
                await new Promise(resolve => {
                    chrome.storage.local.set({ savedEntriesMerged: entries }, resolve);
                });
                
                console.log(`[CardEnhancer] Rating updated: ${entry.title} → ${rating}`);
            }
        } catch (e) {
            console.error('[CardEnhancer] Failed to save rating:', e);
        }
    }

    /**
     * Create a badge element.
     * @param {string} text - Badge text
     * @param {string} type - Badge type (progress, new, etc.)
     * @returns {HTMLElement}
     */
    createBadge(text, type) {
        const badge = document.createElement('div');
        badge.className = `bmh-badge bmh-badge-${type}`;
        badge.textContent = text;
        badge.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            z-index: 20;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        `;

        if (type === 'new') {
            badge.style.background = '#ef4444';
            badge.style.animation = 'bmh-pulse 2s infinite';
        }

        return badge;
    }

    /**
     * Insert badge into card element.
     * @param {HTMLElement} element - Card element
     * @param {HTMLElement} badge - Badge element
     */
    insertBadge(element, badge) {
        // Remove existing badge of same type
        const existingBadge = element.querySelector(`.bmh-badge-${badge.classList[1]?.replace('bmh-badge-', '')}`);
        if (existingBadge) existingBadge.remove();

        // Find best container (usually an image wrapper)
        const imgContainer = element.querySelector('div[class*="cover"], div[class*="thumb"], [class*="img"]')?.parentElement || element;
        imgContainer.style.position = 'relative';
        imgContainer.appendChild(badge);
    }


    /**
     * Normalize title for matching.
     * @param {string} title - Title to normalize
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
     * Get highest chapter number from array.
     * @param {Array} chapters - Array of chapter strings/numbers
     * @returns {number}
     */
    getHighestChapter(chapters) {
        if (!chapters || chapters.length === 0) return 0;
        let highest = 0;
        chapters.forEach(ch => {
            const match = String(ch).match(/^(\d+\.?\d*)/);
            if (match) {
                const num = parseFloat(match[1]);
                if (num > highest) highest = num;
            }
        });
        return highest;
    }
}

export default CardEnhancer;
