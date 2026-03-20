/**
 * @fileoverview Centralized configuration for all platforms and features.
 * User-configurable settings merged with defaults.
 * 
 * @module core/config
 */

/**
 * Default status colors shared across all platforms.
 * @type {Object<string, string>}
 */
export const STATUS_COLORS = {
    // Display names (used by StatusPicker, overlay tooltips)
    'Reading': '#4ade80',
    'Completed': '#60a5fa',
    'Plan to Read': '#fbbf24',
    'On-Hold': '#f97316',
    'On Hold': '#f97316',
    'Dropped': '#ef4444',
    'Re-reading': '#a855f7',
    'HasHistory': '#9ca3af',

    // Internal lowercase keys (used by library card factory, SCSS-driven status classes)
    'reading': '#4ade80',
    'read': '#9f9f9f',
    'completed': '#60a5fa',
    'dropped': '#ef4444',
    'onhold': '#f97316',
    'planning': '#fbbf24',
    'default': '#8B95A5'
};

/**
 * Default border styling configuration.
 * @type {{size: number, style: string, radius: string}}
 */
export const BORDER_DEFAULTS = {
    size: 4,
    style: 'solid',
    radius: '8px'
};


/**
 * Feature flags with defaults.
 * Users can toggle these in settings.
 * @type {Object<string, boolean>}
 */
export const FEATURE_DEFAULTS = {
    highlighting: true,
    progressBadges: true,
    quickActions: true,
    notifications: true,
    autoScroll: true,
    keyboardShortcuts: true,
    newChapterBadge: true
};

/**
 * Default keyboard shortcuts for reader mode.
 * @type {Object<string, string>}
 */
export const DEFAULT_KEYBINDS = {
    'ArrowRight': 'nextPage',
    'ArrowLeft': 'prevPage',
    'ArrowDown': 'scrollDown',
    'ArrowUp': 'scrollUp',
    'Space': 'toggleAutoScroll',
    'Escape': 'exitReader',
    'f': 'toggleFullscreen',
    'b': 'toggleBookmark',
    's': 'toggleSubscribe',
    'n': 'nextChapter',
    'p': 'prevChapter'
};

/**
 * Notification engine configuration.
 * @type {Object}
 */
export const NOTIFICATION_CONFIG = {
    checkIntervalMinutes: 30,
    maxBatchSize: 50, // Max entries to check per cycle
    rateLimitMs: 500  // Delay between API calls
};

// Config class removed as it was unused and superseded by Pinia stores and direct storage access.
// Status colors and defaults are preserved as constants below for direct import.

/**
 * Standardized storage keys for chrome.storage.local
 * Prevents typos and centralizes data definitions across the extension.
 * @type {Object<string, string>}
 */
export const STORAGE_KEYS = {
    // Library
    LIBRARY_ENTRIES: 'savedEntriesMerged',
    READING_HISTORY: 'savedReadChapters',
    
    // Personal Data
    PERSONAL_DATA: 'libraryPersonalData',
    USER_TAGS: 'libraryUserTags',
    FILTER_PRESETS: 'libraryFilterPresets',
    
    // Custom Sites
    CUSTOM_SITES: 'customSites',
    
    // API Caches
    ANILIST_CACHE: 'anilistCache',
    MANGADEX_CACHE: 'mangadexCache',
    
    // Settings & Features
    SETTINGS_PROFILE_SYNC: 'profileAutoSync',
    SETTINGS_AUTO_SCROLL: 'autoScrollEnabled',
    SETTINGS_KEYBINDS: 'keybindsEnabled',
    SETTINGS_PROGRESS: 'progressTrackingEnabled',
    SETTINGS_CARD_SIZE: 'cardViewSize',
    SETTINGS_HIGHLIGHT_THICKNESS: 'highlightThickness',
    SETTINGS_QUICK_ACTIONS: 'quickActions',
    SETTINGS_SHOW_BADGES: 'showReadingBadges',
    
    // Appearance
    THEME: 'theme',
    BORDERS_ENABLED: 'LibraryCardBordersEnabled',
    BORDER_THICKNESS: 'LibraryCardBorderThickness',
    GLOW_EFFECT: 'LibraryGlowEffect',
    ANIMATED_BORDERS: 'LibraryAnimatedBorders',
    STATUS_ICONS: 'LibraryStatusIcons',
    PROGRESS_BARS: 'LibraryProgressBars',
    
    // Custom State
    CUSTOM_BOOKMARKS: 'customBookmarks',
    
    // Sync Metadata
    LAST_BACKUP: 'LastBackupDate',
    
    // Keybindings Customization
    KEYBINDS_CONFIG: 'keybinds'
};

/**
 * Configuration for remote API integrations.
 * @type {Object}
 */
export const API_CONFIG = {
    MANGADEX: {
        BASE_URL: 'https://api.mangadex.org',
        CACHE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
        MIN_REQUEST_INTERVAL: 600
    },
    ANILIST: {
        BASE_URL: 'https://graphql.anilist.co',
        MIN_REQUEST_INTERVAL: 2000
    }
};
