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
    'Reading': '#4ade80',
    'Completed': '#60a5fa',
    'Plan to Read': '#fbbf24',
    'On-Hold': '#f97316',
    'On Hold': '#f97316', // Alias
    'Dropped': '#ef4444',
    'Re-reading': '#a855f7',
    'HasHistory': '#9ca3af'
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
 * Default badge styling configuration.
 * @type {Object}
 */
export const BADGE_STYLES = {
    background: 'rgba(0, 0, 0, 0.85)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 6px',
    borderRadius: '4px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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

/**
 * Main configuration object that merges defaults with user settings.
 */
export class Config {
    static #instance = null;
    static #loaded = false;

    /** @type {Object<string, string>} */
    statusColors = { ...STATUS_COLORS };

    /** @type {{size: number, style: string, radius: string}} */
    border = { ...BORDER_DEFAULTS };

    /** @type {Object<string, boolean>} */
    features = { ...FEATURE_DEFAULTS };

    /** @type {Object<string, string>} */
    keybinds = { ...DEFAULT_KEYBINDS };

    /** @type {Object} */
    notification = { ...NOTIFICATION_CONFIG };

    /** @type {Object<string, Object>} Platform-specific settings */
    platforms = {};

    /**
     * Get singleton instance.
     * @returns {Config}
     */
    static getInstance() {
        if (!this.#instance) {
            this.#instance = new Config();
        }
        return this.#instance;
    }

    /**
     * Load configuration from storage, merging with defaults.
     * @returns {Promise<Config>}
     */
    static async load() {
        const instance = this.getInstance();
        
        if (this.#loaded) return instance;

        const data = await chrome.storage.local.get([
            'statusColors',
            'BorderStyle',
            'CustomBorderSize',
            'features',
            'keybinds',
            'platformSettings'
        ]);

        // Merge status colors
        if (data.statusColors) {
            instance.statusColors = { ...STATUS_COLORS, ...data.statusColors };
        }

        // Merge border settings
        if (data.BorderStyle) instance.border.style = data.BorderStyle;
        if (data.CustomBorderSize) instance.border.size = data.CustomBorderSize;

        // Merge features
        if (data.features) {
            instance.features = { ...FEATURE_DEFAULTS, ...data.features };
        }

        // Merge keybinds
        if (data.keybinds) {
            instance.keybinds = { ...DEFAULT_KEYBINDS, ...data.keybinds };
        }

        // Platform-specific overrides
        if (data.platformSettings) {
            instance.platforms = data.platformSettings;
        }

        this.#loaded = true;
        console.log('[Config] ✓ Loaded configuration');
        return instance;
    }

    /**
     * Get color for a given status.
     * @param {string} status - The status name.
     * @returns {string} - The color hex code.
     */
    getStatusColor(status) {
        return this.statusColors[status] || 'transparent';
    }

    /**
     * Check if a feature is enabled.
     * @param {string} featureName - The feature name.
     * @returns {boolean}
     */
    isFeatureEnabled(featureName) {
        return this.features[featureName] ?? false;
    }

    /**
     * Get platform-specific setting or default.
     * @param {string} platformId - Platform ID.
     * @param {string} key - Setting key.
     * @param {*} defaultValue - Default if not found.
     * @returns {*}
     */
    getPlatformSetting(platformId, key, defaultValue = null) {
        return this.platforms[platformId]?.[key] ?? defaultValue;
    }

    /**
     * Save current configuration to storage.
     * @returns {Promise<void>}
     */
    async save() {
        await chrome.storage.local.set({
            statusColors: this.statusColors,
            BorderStyle: this.border.style,
            CustomBorderSize: this.border.size,
            features: this.features,
            keybinds: this.keybinds,
            platformSettings: this.platforms
        });
        console.log('[Config] ✓ Saved configuration');
    }
}
