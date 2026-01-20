/**
 * @fileoverview Reading progress tracker for manga reader pages.
 * Automatically saves chapter progress after user engagement threshold.
 */

/**
 * ProgressTracker monitors reading activity and saves progress.
 * Uses a time-based threshold to confirm user is actually reading.
 */
class ProgressTracker {
    /**
     * Time in milliseconds before confirming chapter is being read.
     * Prevents accidental saves when quickly browsing.
     * @type {number}
     */
    static SAVE_DELAY = 5000;

    /**
     * Creates a new ProgressTracker instance.
     * @param {Object} adapter - Platform adapter with URL parsing
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.currentEntry = null;
        this.saveTimeout = null;
        this.isSaved = false;
    }

    /**
     * Initializes tracking on a reader page.
     * Parses the current URL and schedules a progress save.
     */
    async init() {
        const urlData = this.parseCurrentUrl();
        
        if (!urlData || !urlData.chapterNo) {
            console.log('[ProgressTracker] Not a chapter page, skipping');
            return;
        }

        this.currentEntry = {
            source: this.adapter.id || this.adapter.PREFIX,
            slug: urlData.slug,
            id: urlData.id,
            chapter: String(urlData.chapterNo),
            url: window.location.href
        };

        console.log('[ProgressTracker] Tracking:', this.currentEntry);

        // Schedule save after engagement threshold
        this.saveTimeout = setTimeout(() => this.saveProgress(), ProgressTracker.SAVE_DELAY);

        // Also save when user scrolls significantly (engagement signal)
        this.setupScrollTracking();
    }

    /**
     * Parses the current URL using the adapter.
     * @returns {Object|null} Parsed URL data or null if not a reader page
     */
    parseCurrentUrl() {
        if (this.adapter.parseUrl) {
            return this.adapter.parseUrl(window.location.href);
        }

        // Fallback: try to extract from common URL patterns
        const url = window.location.href;
        
        // MangaFire: /read/manga-slug.id/en/chapter-X
        const mangafireMatch = url.match(/\/read\/([^/]+)\.(\d+)\/\w+\/chapter-(\d+(?:\.\d+)?)/);
        if (mangafireMatch) {
            return {
                slug: mangafireMatch[1],
                id: mangafireMatch[2],
                chapterNo: parseFloat(mangafireMatch[3])
            };
        }

        // MangaDex: /chapter/uuid
        const mangadexMatch = url.match(/mangadex\.org\/chapter\/([a-f0-9-]+)/i);
        if (mangadexMatch) {
            // MangaDex requires API call to get chapter number
            return { chapterId: mangadexMatch[1], chapterNo: null };
        }

        // Webtoons: /viewer?episode_no=X
        const webtoonsMatch = url.match(/webtoons\.com.*episode_no=(\d+)/i);
        if (webtoonsMatch) {
            const titleMatch = url.match(/\/([^/]+)\/list\?/);
            return {
                slug: titleMatch?.[1] || 'unknown',
                chapterNo: parseInt(webtoonsMatch[1])
            };
        }

        return null;
    }

    /**
     * Sets up scroll-based engagement tracking.
     * Saves progress when user scrolls past 25% of the page.
     */
    setupScrollTracking() {
        let scrollSaved = false;
        
        const checkScroll = () => {
            if (scrollSaved || this.isSaved) return;
            
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            if (scrollPercent > 0.25) {
                scrollSaved = true;
                this.saveProgress();
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });
    }

    /**
     * Saves the current reading progress to chrome.storage.
     * Updates both reading history and library entry.
     */
    async saveProgress() {
        if (this.isSaved || !this.currentEntry) return;
        this.isSaved = true;

        const { source, slug, chapter, url, id } = this.currentEntry;
        
        try {
            // Build storage key (matches existing format)
            const storageKey = slug || `${source}:${id}`;
            
            const data = await chrome.storage.local.get(['savedReadChapters', 'savedEntriesMerged']);
            const history = data.savedReadChapters || {};
            const library = data.savedEntriesMerged || [];

            // Update reading history
            if (!history[storageKey]) {
                history[storageKey] = [];
            }
            
            if (!history[storageKey].includes(chapter)) {
                history[storageKey].push(chapter);
                history[storageKey].sort((a, b) => parseFloat(a) - parseFloat(b));
            }

            // Find and update library entry
            const entry = library.find(e => {
                if (e.source === source && e.sourceId === id) return true;
                if (e.slug === slug || e.slug === storageKey) return true;
                // Fuzzy match on title/slug
                const normalizedSlug = slug?.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normalizedEntry = (e.slug || e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return normalizedSlug && normalizedSlug === normalizedEntry;
            });

            if (entry) {
                const chapterNum = parseFloat(chapter);
                const currentLast = parseFloat(entry.lastReadChapter) || 0;
                
                // Only update if this is a newer chapter
                if (chapterNum > currentLast) {
                    entry.lastReadChapter = chapter;
                    entry.lastMangafireUrl = url;
                }
                
                entry.lastReadDate = Date.now();
                entry.readChapters = history[storageKey].length;
                
                console.log('[ProgressTracker] Updated library entry:', entry.title || slug);
            }

            // Save everything
            await chrome.storage.local.set({
                savedReadChapters: history,
                savedEntriesMerged: library
            });

            console.log(`[ProgressTracker] ✓ Saved progress: ${slug} ch.${chapter}`);
            
            // Notify background script (for badge updates, etc.)
            try {
                chrome.runtime.sendMessage({
                    action: 'progressSaved',
                    data: { source, slug, chapter }
                });
            } catch (e) {
                // Background script might not be listening
            }

        } catch (error) {
            console.error('[ProgressTracker] Failed to save progress:', error);
            this.isSaved = false; // Allow retry
        }
    }

    /**
     * Cleans up the tracker.
     */
    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }
}

export default ProgressTracker;
