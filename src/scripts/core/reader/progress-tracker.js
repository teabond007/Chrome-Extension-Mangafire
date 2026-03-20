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
        
        console.log('[ProgressTracker] parseCurrentUrl result:', urlData);

        if (!urlData || (!urlData.chapterNo && !urlData.title && !urlData.slug)) {
            console.log('[ProgressTracker] Not a chapter page, skipping');
            return;
        }

        this.currentEntry = {
            source: this.adapter.id || this.adapter.PREFIX,
            slug: urlData.slug,
            title: urlData.title || '',
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

        // Rely entirely on adapter parsing for custom sites
        return null;

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
                    entry.lastChapterRead = chapter;
                    entry.lastReaderUrl = url;
                }
                
                entry.lastReadDate = Date.now();
                entry.lastRead = Date.now();
                entry.readChapters = history[storageKey].length;
                
                console.log('[ProgressTracker] Updated library entry:', entry.title || slug);
            } else {
                // No existing entry — create a new one so it appears in the library
                const title = this.currentEntry.title || slug;
                const newEntry = {
                    title: title,
                    slug: storageKey,
                    source: source,
                    sourceId: id || storageKey,
                    sourceUrl: url,
                    status: 'Reading',
                    lastReadChapter: chapter,
                    lastChapterRead: chapter,
                    lastReaderUrl: url,
                    lastReadDate: Date.now(),
                    lastRead: Date.now(),
                    readChapters: history[storageKey].length,
                    lastUpdated: Date.now()
                };
                library.push(newEntry);
                console.log('[ProgressTracker] Created new library entry:', title);
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

            // Auto-fetch AniList metadata for newly created entries
            if (!entry && (this.currentEntry.title || slug)) {
                this.fetchMetadataForEntry(this.currentEntry.title || slug, storageKey);
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
    /**
     * Requests metadata fetch from the background script for a new library entry.
     * Background handles AniList/MangaDex API calls to avoid CORS issues on custom sites.
     * @param {string} title - Manga title to search for
     * @param {string} storageKey - Storage key to identify the entry
     */
    async fetchMetadataForEntry(title, storageKey) {
        try {
            console.log('[ProgressTracker] Requesting metadata fetch for:', title);
            chrome.runtime.sendMessage({
                type: 'fetchMetadata',
                title: title,
                storageKey: storageKey
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[ProgressTracker] Metadata fetch message failed:', chrome.runtime.lastError);
                    return;
                }
                if (response?.success) {
                    console.log('[ProgressTracker] ✓ Metadata fetched for:', title);
                }
            });
        } catch (e) {
            console.warn('[ProgressTracker] Metadata request failed (non-critical):', e);
        }
    }
}

export default ProgressTracker;
