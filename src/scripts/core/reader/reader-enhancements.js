/**
 * @fileoverview Unified reader enhancements module.
 * Combines auto-scroll, keyboard shortcuts, and progress tracking for reader pages.
 */

import AutoScrollController from './auto-scroll.js';
import KeybindManager from './keybinds.js';
import ProgressTracker from './progress-tracker.js';
import { TOGGLES, SETTINGS } from '../../../config.js';

/**
 * ReaderEnhancements bundles all reading enhancement features.
 * Should be initialized on reader/chapter pages.
 */
class ReaderEnhancements {
    /**
     * Creates a new ReaderEnhancements instance.
     * @param {Object} adapter - Platform adapter with navigation and parsing methods
     * @param {Object} options - Configuration options
     * @param {boolean} [options.autoScroll=true] - Enable auto-scroll feature
     * @param {boolean} [options.keybinds=true] - Enable keyboard shortcuts
     * @param {boolean} [options.progressTracking=true] - Enable progress tracking
     */
    constructor(adapter, options = {}) {
        this.adapter = adapter;
        this.options = {
            autoScroll: options.autoScroll !== false,
            keybinds: options.keybinds !== false,
            progressTracking: options.progressTracking !== false
        };

        this.autoScroll = null;
        this.keybinds = null;
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

        // Initialize auto-scroll
        if (this.options.autoScroll && settings[TOGGLES.AUTO_SCROLL] !== false) {
            this.autoScroll = new AutoScrollController({
                speed: settings[SETTINGS.AUTO_SCROLL_SPEED] || 50,
                showPanel: true,
                adapter: this.adapter
            });
            this.autoScroll.init();
        }

        // Initialize keyboard shortcuts
        if (this.options.keybinds && settings[TOGGLES.KEYBINDS] !== false) {
            this.keybinds = new KeybindManager(this.adapter);
            await this.keybinds.init();
        }

        // Initialize progress tracking
        if (this.options.progressTracking && settings[TOGGLES.READER_PROGRESS] !== false) {
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
                TOGGLES.AUTO_SCROLL,
                SETTINGS.AUTO_SCROLL_SPEED,
                TOGGLES.KEYBINDS,
                TOGGLES.READER_PROGRESS
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
        this.autoScroll?.destroy();
        this.keybinds?.destroy();
        this.progressTracker?.destroy();
        
        this.autoScroll = null;
        this.keybinds = null;
        this.progressTracker = null;
        this.isInitialized = false;
    }
}

export default ReaderEnhancements;
export { AutoScrollController, KeybindManager, ProgressTracker };
