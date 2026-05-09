/**
 * @fileoverview Unified reader enhancements module.
 * Focuses on progress tracking for reader pages.
 */

import ProgressTracker from './progress-tracker.js';
import { TOGGLES } from '../../../config.js';

/**
 * ReaderEnhancements bundles all reading enhancement features.
 * Should be initialized on reader/chapter pages.
 */
class ReaderEnhancements {
    /**
     * Creates a new ReaderEnhancements instance.
     * @param {Object} adapter - Platform adapter with navigation and parsing methods
     * @param {Object} options - Configuration options
     * @param {boolean} [options.progressTracking=true] - Enable progress tracking
     */
    constructor(adapter, options = {}) {
        this.adapter = adapter;
        this.options = {
            progressTracking: options.progressTracking !== false
        };

        this.progressTracker = null;
        this.isInitialized = false;
    }

    /**
     * Checks if current page is a reader/chapter page.
     * @returns {boolean} True if on a reader page
     */
    isReaderPage() {
        if (this.adapter.isReaderPage) {
            return this.adapter.isReaderPage();
        }

        // Fallback detection based on common reader URL patterns
        const path = window.location.pathname.toLowerCase();
        return path.includes('/read') || 
               path.includes('/chapter') || 
               path.includes('/viewer') ||
               /chapter-\d+/i.test(path);
    }

    /**
     * Initializes all enabled reader enhancements.
     */
    async init() {
        // Only run on reader pages
        if (!this.isReaderPage()) {
            console.log('[ReaderEnhancements] Not a reader page, skipping init');
            return;
        }

        console.log('[ReaderEnhancements] Initializing on reader page...');

        // Check user preferences
        const settings = await this.loadSettings();

        // Initialize progress tracking
        if (this.options.progressTracking && settings[TOGGLES.PROGRESS_TRACKING] !== false) {
            this.progressTracker = new ProgressTracker(this.adapter);
            await this.progressTracker.init();
        }

        this.isInitialized = true;
        console.log('[ReaderEnhancements] Initialized successfully');
    }

    /**
     * Loads user settings for reader enhancements.
     * @returns {Promise<Object>} Settings object
     */
    async loadSettings() {
        try {
            const data = await chrome.storage.local.get([
                TOGGLES.PROGRESS_TRACKING
            ]);
            return data;
        } catch (e) {
            console.warn('[ReaderEnhancements] Failed to load settings:', e);
            return {};
        }
    }

    /**
     * Cleans up all enhancements.
     */
    destroy() {
        this.progressTracker?.destroy();
        this.progressTracker = null;
        this.isInitialized = false;
    }
}

export default ReaderEnhancements;
export { ProgressTracker };
