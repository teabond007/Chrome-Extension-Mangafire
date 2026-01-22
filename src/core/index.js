/**
 * Core Module Index
 * 
 * Central export point for all core functionality.
 * These modules are framework-agnostic and can be used by both
 * Vue components and vanilla JS content scripts.
 * 
 * @module core
 */

// Storage schema and helpers
export {
    STORAGE_KEYS,
    VALID_STATUSES,
    PLATFORMS,
    getNamespacedKey,
    parseNamespacedKey,
    createLibraryEntry,
    validateLibraryEntry,
    slugify,
    matchReadChapters,
    migrateStorage
} from './storage-schema.js';

// Configuration
export {
    STATUS_COLORS,
    BORDER_DEFAULTS,
    BORDER_STYLES,
    BADGE_STYLES,
    FEATURE_DEFAULTS,
    DEFAULT_KEYBINDS,
    NOTIFICATION_CONFIG,
    THEMES,
    CARD_SIZES,
    Config,
    getConfig
} from './config.js';

// AniList API
export {
    cleanTitle,
    fetchMangaFromAnilist,
    getFormatName,
    formatAnilistDate,
    stripHtml
} from './anilist-api.js';
