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

interface PlatformAdapter {
    id: string;
    // Prefix for namespaced storage keys
    PREFIX?: string;
    // CSS selectors for cards
    selectors: {
        card: string;
        title?: string;
        url?: string;
        image?: string;
    };
    unitName?: string;
    // Methods
    extractCardData(element: HTMLElement): CardData;
    validatePage?(): boolean;
    getBadgePosition?(): { bottom?: string; left?: string; top?: string; right?: string };
    buildChapterUrl?(entry: LibraryEntry, chapter: number): string | null;
    applyBorder?(element: HTMLElement, color: string, size: number, style: string): void;
    handleViewDetails?(entry: LibraryEntry, card: CardObject): void;
}

interface CardData {
    id?: string;
    title: string;
    url?: string;
    image?: string;
    chapter?: string;
    date?: string;
}

interface LibraryEntry {
    title: string;
    slug?: string;
    source?: string;
    sourceId?: string;
    status: string;
    chapters?: number;
    readChapters?: (string | number)[];
    lastReadChapter?: number;
    lastRead?: number;
    lastUpdated?: number;
    anilistData?: {
        id?: number;
        chapters?: number;
    };
    hasNewChapters?: boolean;
    mangafireUrl?: string;
    sourceUrl?: string;
    personalData?: {
        rating?: number;
    };
    customMarker?: string;
}

interface EnhancerSettings {
    highlighting: boolean;
    progressBadges: boolean;
    quickActions: boolean;
    newChapterBadges: boolean;
    border: {
        size: number;
        style: string;
        radius: string;
    };
    customBookmarks: CustomBookmark[];
    customBookmarksEnabled: boolean;
}

interface CustomBookmark {
    name: string;
    color: string;
    style?: string;
}

interface CardObject {
    element: HTMLElement;
    data: CardData;
}

/**
 * Universal card enhancement for any platform.
 * Applies borders, badges, overlays using platform adapter.
 */
export class CardEnhancer {
    adapter: PlatformAdapter;
    settings: EnhancerSettings;

    /**
     * @param {PlatformAdapter} adapter - Platform-specific adapter
     * @param {Object} settings - User settings from storage
     */
    constructor(adapter: PlatformAdapter, settings: any = {}) {
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
    async enhanceAll(): Promise<number> {
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
    findCards(): CardObject[] {
        const selector = this.adapter.selectors.card;
        if (!selector) return [];

        return Array.from(document.querySelectorAll(selector))
            .map(el => ({
                element: el as HTMLElement,
                data: this.adapter.extractCardData(el as HTMLElement)
            }))
            .filter(card => card.data.title || card.data.id);
    }

    /**
     * Load library entries from storage.
     * @returns {Promise<Array>}
     */
    async loadLibrary(): Promise<LibraryEntry[]> {
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
                const merged = new Map<string, LibraryEntry>();
                [...userBookmarks, ...savedEntries].forEach((entry: LibraryEntry) => {
                    if (entry?.title) {
                        // Attach read chapters
                        const historyKey = this.findHistoryKey(entry.title, entry.slug, readChapters);
                        const chaptersForEntry = historyKey ? (readChapters as Record<string, (string | number)[]>)[historyKey] : [];
                        entry.readChapters = chaptersForEntry;
                        entry.lastReadChapter = this.getHighestChapter(chaptersForEntry);

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
    findHistoryKey(title: string, slug: string | undefined, readChapters: Record<string, any>): string | null {
        if (!readChapters) return null;

        // Try namespaced key with adapter prefix
        if (slug) {
            const namespacedKey = `${this.adapter.PREFIX || ''}${slug}`;
            if (readChapters[namespacedKey]) return namespacedKey;

            // Try direct slug match
            if (readChapters[slug]) return slug;

            // Try stripping ID from slug (common pattern like 'slug.id')
            if (slug.includes('.')) {
                const baseSlug = slug.substring(0, slug.lastIndexOf('.'));
                if (readChapters[baseSlug]) return baseSlug;
            }
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
    findMatch(card: CardObject, library: LibraryEntry[]): LibraryEntry | undefined {
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
    applyEnhancements(card: CardObject, entry: LibraryEntry) {
        if (this.settings.highlighting) {
            this.applyBorder(card, entry);
        }

        if (this.settings.progressBadges && (entry.readChapters?.length || 0) > 0) {
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
    applyBorder(card: CardObject, entry: LibraryEntry) {
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
            const target = (card.element.closest('li') || card.element) as HTMLElement;
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
    applyProgressBadge(card: CardObject, entry: LibraryEntry) {
        const unitName = this.adapter.unitName === 'episode' ? 'Ep.' : 'Ch.';
        const totalChapters = entry.chapters || entry.anilistData?.chapters;

        // Show "Ch. X/Y" if total known, otherwise "Ch. X+" to indicate ongoing
        const text = totalChapters
            ? `${unitName} ${entry.lastReadChapter}/${totalChapters}`
            : `${unitName} ${entry.lastReadChapter}+`;

        const position = this.adapter.getBadgePosition?.() || { bottom: '4px', left: '4px' };
        OverlayFactory.mountStatusBadge(card.element, text, 'progress', position);
    }

    /**
     * Apply "NEW" badge for unread chapters.
     * @param {Object} card - Card object
     */
    applyNewBadge(card: CardObject) {
        OverlayFactory.mountStatusBadge(card.element, 'NEW', 'new');
    }
    /**
     * Apply quick actions tooltip.
     * @param {Object} card - Card object
     * @param {Object} entry - Library entry
     */
    applyQuickActions(card: CardObject, entry: LibraryEntry) {
        // Define callbacks for tooltip actions
        const callbacks = {
            continue: (e: any) => this.handleContinueReading(e, card),
            status: (e: any, target?: any) => this.handleStatusChange(e, target || null as any, card),
            rating: (e: any, target?: any) => this.handleRatingChange(e, target || null as any, card),
            details: (e: any) => this.handleViewDetails(e, card)
        };

        OverlayFactory.mountQuickActions(card.element, entry, this.adapter, callbacks);
        card.element.style.position = 'relative';
    }

    /**
     * Handle "Continue Reading" action - navigates to next chapter.
     * @param {Object} entry - Library entry
     * @param {Object} card - Card object
     */
    handleContinueReading(entry: LibraryEntry, card: CardObject) {
        const nextChapter = OverlayFactory.calculateNextChapter(entry);
        const url = this.adapter.buildChapterUrl?.(entry, nextChapter);

        if (url) {
            window.location.href = url;
        } else if (entry.mangafireUrl || entry.sourceUrl) {
            window.location.href = entry.mangafireUrl || entry.sourceUrl || '';
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
    handleStatusChange(entry: LibraryEntry, btn: HTMLElement, card: CardObject) {
        OverlayFactory.mountStatusPicker(
            btn,
            entry,
            this.settings.customBookmarks,
            (newStatus: string, entry: LibraryEntry) => this.saveStatusChange(entry, newStatus)
        );
    }

    /**
     * Handle rating change action - shows rating picker.
     * @param {Object} entry - Library entry
     * @param {HTMLElement} btn - Clicked element
     * @param {Object} card - Card object
     */
    handleRatingChange(entry: LibraryEntry, btn: HTMLElement, card: CardObject) {
        OverlayFactory.mountRatingPicker(
            btn,
            entry,
            (rating: number, entry: LibraryEntry) => this.saveRatingChange(entry, rating)
        );
    }

    /**
     * Handle view details action - opens options page with manga detail modal.
     * Uses the same showMangaDetails modal as the library page.
     * @param {Object} entry - Library entry
     * @param {Object} card - Card object
     */
    handleViewDetails(entry: LibraryEntry, card: CardObject) {
        // Allow adapter to override details handling
        if (this.adapter.handleViewDetails) {
            this.adapter.handleViewDetails(entry, card);
            return;
        }

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
    async saveStatusChange(entry: LibraryEntry, newStatus: string) {
        try {
            const data: any = await new Promise(resolve => {
                chrome.storage.local.get(['savedEntriesMerged', 'userBookmarks'], resolve);
            });

            const entries = data.savedEntriesMerged || [];
            const bookmarks = data.userBookmarks || [];

            // Update in savedEntriesMerged
            const idx = entries.findIndex((e: LibraryEntry) =>
                this.normalizeTitle(e.title) === this.normalizeTitle(entry.title)
            );
            if (idx !== -1) {
                entries[idx].status = newStatus;
            }

            // Update in userBookmarks
            const bidx = bookmarks.findIndex((b: LibraryEntry) =>
                this.normalizeTitle(b.title) === this.normalizeTitle(entry.title)
            );
            if (bidx !== -1) {
                bookmarks[bidx].status = newStatus;
            }

            await new Promise(resolve => {
                chrome.storage.local.set({ savedEntriesMerged: entries, userBookmarks: bookmarks }, resolve as () => void);
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
    async saveRatingChange(entry: LibraryEntry, rating: number) {
        try {
            const data: any = await new Promise(resolve => {
                chrome.storage.local.get(['savedEntriesMerged'], resolve);
            });

            const entries = data.savedEntriesMerged || [];
            const idx = entries.findIndex((e: LibraryEntry) =>
                this.normalizeTitle(e.title) === this.normalizeTitle(entry.title)
            );

            if (idx !== -1) {
                if (!entries[idx].personalData) {
                    entries[idx].personalData = {};
                }
                entries[idx].personalData.rating = rating;

                await new Promise(resolve => {
                    chrome.storage.local.set({ savedEntriesMerged: entries }, resolve as () => void);
                });

                console.log(`[CardEnhancer] Rating updated: ${entry.title} → ${rating}`);
            }
        } catch (e) {
            console.error('[CardEnhancer] Failed to save rating:', e);
        }
    }

    /**
     * Normalize title for matching.
     * @param {string} title - Title to normalize
     * @returns {string}
     */
    normalizeTitle(title: string): string {
        if (!title) return '';
        // Strict alphanumeric normalization to avoid mismatch on special chars
        return title.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    /**
     * Get highest chapter number from array.
     * @param {Array} chapters - Array of chapter strings/numbers
     * @returns {number}
     */
    getHighestChapter(chapters: (string | number)[]): number {
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
