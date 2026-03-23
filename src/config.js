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
 * Toggles: Boolean feature flags and operational switches (true/false)
 * @type {Object<string, string>}
 */
export const TOGGLES = {
    // Cloud Sync
    AUTO_SYNC: 'profileAutoSync',
    SYNC_LIBRARY: 'profileSyncLibrary',
    SYNC_HISTORY_CLOUD: 'profileSyncHistory',
    SYNC_PERSONAL: 'profileSyncPersonal',
    SYNC_SETTINGS: 'profileSyncSettings',
    SYNC_CACHE: 'profileSyncCache',

    // Core Features
    NOTIFICATIONS: 'NotificationsfeatureEnabled',
    FAMILY_FRIENDLY: 'FamilyFriendlyfeatureEnabled',
    HISTORY_TRACKING: 'SyncandMarkReadfeatureEnabled',
    PROGRESS_TRACKING: 'progressTrackingEnabled',
    AUTO_SCROLL: 'autoScrollEnabled',
    KEYBINDS_ENABLED: 'keybindsEnabled',

    // Custom Sites
    CUSTOM_SITE_HIGHLIGHT: 'CustomSiteHighlightEnabled',
    CUSTOM_SITE_QUICK_ACTIONS: 'CustomSiteQuickActionsEnabled',
    CUSTOM_BORDER_SIZE_ENABLED: 'CustomBorderSizefeatureEnabled',
    CUSTOM_STATUS_ENABLED: 'CustomBookmarksfeatureEnabled',

    // UI Enhancements
    LIBRARY_BORDERS: 'LibraryCardBordersEnabled',
    LIBRARY_GLOW_EFFECT: 'LibraryGlowEffect',
    LIBRARY_ANIMATED_BORDERS: 'LibraryAnimatedBorders',
    LIBRARY_STATUS_ICONS: 'LibraryStatusIcons',
    LIBRARY_PROGRESS_BARS: 'LibraryProgressBars',
    LIBRARY_HIDE_NO_HISTORY: 'libraryHideNoHistory',
    QUICK_ACTIONS: 'quickActions',
    SHOW_READING_BADGES: 'showReadingBadges',
    LIBRARY_SHOW_RIBBONS: 'libraryShowStatusRibbon',
    CUSTOM_SITE_SHOW_RIBBONS: 'customSiteStatusRibbon',
    CUSTOM_SITE_GLOW_EFFECT: 'customSiteGlowEffect',
    IS_CUSTOM_THEME: 'isCustomTheme',
    AUTO_READ_STALE: 'autoReadStaleReading'
};

/**
 * Settings: Configurable values, preferences and metadata strings
 * @type {Object<string, string>}
 */
export const SETTINGS = {
    THEME: 'theme',
    CUSTOM_THEME_DATA: 'customThemeData',
    HIGHLIGHT_THICKNESS: 'CustomBorderSize',
    LIBRARY_THICKNESS: 'LibraryBorderSize',
    BORDER_STYLE: 'GlobalBorderStyle',
    VIEW_MODE: 'cardViewSize', // Unified from cardViewSize/libraryViewMode
    SYNC_INTERVAL: 'profileSyncInterval'
};

/**
 * Data: Complex objects, collections, caches and timestamps
 * @type {Object<string, string>}
 */
export const DATA = {
    LIBRARY_ENTRIES: 'savedEntriesMerged',
    READING_HISTORY: 'savedReadChapters',
    PERSONAL_DATA: 'libraryPersonalData',
    FILTER_PRESETS: 'libraryFilterPresets',
    CUSTOM_SITES: 'customSites',
    CUSTOM_STATUSES: 'customBookmarks',
    ANILIST_CACHE: 'anilistCache',
    MANGADEX_CACHE: 'mangadexCache',
    KEYBINDS_CONFIG: 'keybinds',
    
    // Timestamps
    LAST_BACKUP: 'LastBackupDate',
    LAST_SYNC_CLOUD: 'profileLastSync',
    LAST_SYNC_TIME: 'lastSyncTime'
};


/**
 * Configuration for remote API integrations.
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

/**
 * Sync intervals
 */
export const SYNC_CONFIG = {
    INTERVAL_DEFAULT: 24 * 60 * 60 * 1000, // 24 hours
    RETRY_DELAY: 5 * 60 * 1000             // 5 minutes
};

/**
 * Progress Tracking constants
 */
export const PROGRESS_CONFIG = {
    SAVE_DELAY: 5000,                  // 5 seconds
    SCROLL_THRESHOLD: 0.1              // 10% scroll
};

/**
 * Library Defaults
 */
export const DEFAULT_STATUS = 'Reading';
