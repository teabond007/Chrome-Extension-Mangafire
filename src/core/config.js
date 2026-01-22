/**
 * @fileoverview Centralized configuration for all platforms and features.
 * User-configurable settings merged with defaults.
 * 
 * This module is framework-agnostic and can be used by both Vue components
 * and vanilla JS content scripts.
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
    'On Hold': '#f97316',
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
 * Border style options
 * @type {string[]}
 */
export const BORDER_STYLES = [
    'solid',
    'dashed',
    'dotted',
    'double',
    'groove',
    'ridge'
];

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
    newChapterBadge: true,
    autoSync: false,
    customBookmarks: false,
    markHomePage: false,
    syncAndMarkRead: false,
    newTabDashboard: false,
    webtoonsHighlight: true,
    familyFriendly: false,
    smartAutoComplete: false,
    smartInactivityDim: false,
    smartResume: false,
    readerEnhancements: true,
    readerWidthFix: false,
    readerNextChapter: true,
    mangadexHighlight: true,
    mangaPlusHighlight: false
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
    maxBatchSize: 50,
    rateLimitMs: 500
};

/**
 * Theme configuration
 * @type {Object<string, Object>}
 */
export const THEMES = {
    'cloudy-dark': {
        name: 'Cloudy Dark',
        bgBody: '#0a0e14',
        bgSidebar: '#151a21',
        bgSurface: '#1a1f27',
        bgElevated: '#242a33',
        accentPrimary: '#ff6b6b',
        accentSecondary: '#4ecdc4',
        textPrimary: '#ffffff',
        textSecondary: '#9ca3af',
        textMuted: '#6b7280',
        border: '#2d3748'
    },
    'midnight-blue': {
        name: 'Midnight Blue',
        bgBody: '#0f172a',
        bgSidebar: '#1e293b',
        bgSurface: '#1e293b',
        bgElevated: '#334155',
        accentPrimary: '#60a5fa',
        accentSecondary: '#a855f7',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        border: '#475569'
    },
    'forest': {
        name: 'Forest',
        bgBody: '#0d1f0d',
        bgSidebar: '#1a2f1a',
        bgSurface: '#1a2f1a',
        bgElevated: '#2d4a2d',
        accentPrimary: '#4ade80',
        accentSecondary: '#86efac',
        textPrimary: '#f0fdf4',
        textSecondary: '#86efac',
        textMuted: '#6b9b6b',
        border: '#365936'
    }
};

/**
 * Card size presets
 * @type {Object<string, {width: string, height: string}>}
 */
export const CARD_SIZES = {
    small: { width: '150px', height: '225px' },
    medium: { width: '180px', height: '270px' },
    large: { width: '220px', height: '330px' }
};

/**
 * Main configuration singleton class.
 * Merges defaults with user settings from chrome.storage.
 */
class ConfigManager {
    /** @type {ConfigManager|null} */
    static #instance = null;
    
    /** @type {boolean} */
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

    /** @type {string} */
    theme = 'cloudy-dark';

    /** @type {string} */
    cardSize = 'medium';

    /** @type {Object<string, Object>} Platform-specific settings */
    platforms = {};

    /**
     * Get singleton instance.
     * @returns {ConfigManager}
     */
    static getInstance() {
        if (!this.#instance) {
            this.#instance = new ConfigManager();
        }
        return this.#instance;
    }

    /**
     * Load configuration from storage, merging with defaults.
     * @returns {Promise<ConfigManager>}
     */
    static async load() {
        const instance = this.getInstance();
        
        if (this.#loaded) return instance;

        try {
            const data = await chrome.storage.local.get([
                'statusColors',
                'BorderStyle',
                'CustomBorderSize',
                'features',
                'keybinds',
                'platformSettings',
                'currentTheme',
                'cardSize'
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

            // Theme
            if (data.currentTheme) {
                instance.theme = data.currentTheme;
            }

            // Card size
            if (data.cardSize) {
                instance.cardSize = data.cardSize;
            }

            // Platform-specific overrides
            if (data.platformSettings) {
                instance.platforms = data.platformSettings;
            }

            this.#loaded = true;
            console.log('[Config] ✓ Loaded configuration');
        } catch (error) {
            console.error('[Config] Failed to load:', error);
        }

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
     * Get current theme configuration.
     * @returns {Object}
     */
    getTheme() {
        return THEMES[this.theme] || THEMES['cloudy-dark'];
    }

    /**
     * Get current card size.
     * @returns {{width: string, height: string}}
     */
    getCardSize() {
        return CARD_SIZES[this.cardSize] || CARD_SIZES.medium;
    }

    /**
     * Save current configuration to storage.
     * @returns {Promise<void>}
     */
    async save() {
        try {
            await chrome.storage.local.set({
                statusColors: this.statusColors,
                BorderStyle: this.border.style,
                CustomBorderSize: this.border.size,
                features: this.features,
                keybinds: this.keybinds,
                platformSettings: this.platforms,
                currentTheme: this.theme,
                cardSize: this.cardSize
            });
            console.log('[Config] ✓ Saved configuration');
        } catch (error) {
            console.error('[Config] Failed to save:', error);
        }
    }

    /**
     * Update a specific setting.
     * @param {string} key - Setting key
     * @param {*} value - New value
     * @param {boolean} persist - Whether to save immediately
     */
    async set(key, value, persist = true) {
        if (key in this) {
            this[key] = value;
        }
        if (persist) {
            await this.save();
        }
    }

    /**
     * Reset to defaults.
     * @param {boolean} persist - Whether to save immediately
     */
    async reset(persist = true) {
        this.statusColors = { ...STATUS_COLORS };
        this.border = { ...BORDER_DEFAULTS };
        this.features = { ...FEATURE_DEFAULTS };
        this.keybinds = { ...DEFAULT_KEYBINDS };
        this.notification = { ...NOTIFICATION_CONFIG };
        this.theme = 'cloudy-dark';
        this.cardSize = 'medium';
        this.platforms = {};
        
        if (persist) {
            await this.save();
        }
    }
}

// Export singleton getter for convenience
export const Config = ConfigManager;

// Export a function to get and load config
export async function getConfig() {
    return ConfigManager.load();
}
