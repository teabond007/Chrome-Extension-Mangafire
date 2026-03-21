/**
 * @fileoverview Reading progress tracker for manga reader pages.
 * Automatically saves chapter progress after user engagement threshold.
 */

import { PROGRESS_CONFIG } from '../../../config.js';
import * as LibraryService from '../library-service.ts';

/**
 * ProgressTracker monitors reading activity and saves progress.
 * Uses a time-based threshold to confirm user is actually reading.
 */
class ProgressTracker {
    /**
     * Creates a new ProgressTracker instance.
     * @param {Object} adapter - Platform adapter with URL parsing
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.currentQuery = null;
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

        this.currentQuery = {
            source: this.adapter.id || this.adapter.PREFIX,
            slug: urlData.slug,
            title: urlData.title || '',
            sourceId: urlData.id,
            mangaSlug: urlData.slug
        };

        this.currentProgress = {
            chapter: String(urlData.chapterNo),
            url: window.location.href
        };

        console.log('[ProgressTracker] Tracking:', this.currentQuery);

        // Schedule save after engagement threshold
        this.saveTimeout = setTimeout(() => this.saveProgress(), PROGRESS_CONFIG.SAVE_DELAY);

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
        return null;
    }

    /**
     * Sets up scroll-based engagement tracking.
     */
    setupScrollTracking() {
        let scrollSaved = false;
        
        const checkScroll = () => {
            if (scrollSaved || this.isSaved) return;
            
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            if (scrollPercent > PROGRESS_CONFIG.SCROLL_THRESHOLD) {
                scrollSaved = true;
                this.saveProgress();
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });
    }

    /**
     * Saves the current reading progress using LibraryService.
     */
    async saveProgress() {
        if (this.isSaved || !this.currentQuery) return;
        this.isSaved = true;

        try {
            // 1. Track read chapter in history
            const history = await LibraryService.trackReadChapter(this.currentQuery, this.currentProgress.chapter);

            // 2. Update library entry
            const entry = await LibraryService.updateProgress(this.currentQuery, this.currentProgress);

            // 3. Update entry with read chapters count from history
            if (entry) {
                entry.readChapters = history.length;
                // Note: LibraryService.updateProgress already saved the main progress, 
                // but we might want to update the full list if we want it synced immediately.
                // However, updateProgress is intended for basic progress tracking.
                // For now, let's just ensure it's logged.
            }

            console.log(`[ProgressTracker] ✓ Saved progress: ${this.currentQuery.title || this.currentQuery.slug} ch.${this.currentProgress.chapter}`);
            
            // 4. Notify background script (for badge updates, etc.)
            this.notifyProgress(entry);

            // 5. Auto-fetch AniList metadata for new entries
            // If the entry was newly created (no anilistData), request metadata
            if (entry && !entry.anilistData) {
                this.fetchMetadataForEntry(entry.title, LibraryService.getMangaId(entry));
            }

        } catch (error) {
            console.error('[ProgressTracker] Failed to save progress:', error);
            this.isSaved = false; // Allow retry
        }
    }

    /**
     * Notifies the background script about saved progress.
     */
    notifyProgress(entry) {
        try {
            chrome.runtime.sendMessage({
                action: 'progressSaved',
                data: { 
                    source: this.currentQuery.source, 
                    slug: this.currentQuery.slug, 
                    chapter: this.currentProgress.chapter,
                    entry: entry
                }
            });
        } catch (e) {
            // Background script might not be listening
        }
    }

    /**
     * Requests metadata fetch from the background script.
     */
    async fetchMetadataForEntry(title, mangaId) {
        try {
            chrome.runtime.sendMessage({
                type: 'fetchMetadata',
                title: title,
                storageKey: mangaId // Backward compatibility for background script
            });
        } catch (e) {
             console.warn('[ProgressTracker] Metadata request failed:', e);
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
