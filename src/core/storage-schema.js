/**
 * @fileoverview Storage Schema - Documents and validates the unified storage structure
 * supporting all platforms with proper namespacing.
 * 
 * This module is framework-agnostic and can be used by both Vue components
 * and vanilla JS content scripts.
 * 
 * @module core/storage-schema
 */

/**
 * Storage key constants to avoid magic strings.
 * @type {Object<string, string>}
 */
export const STORAGE_KEYS = {
    // Main library data
    LIBRARY: 'savedEntriesMerged',
    BOOKMARKS: 'userBookmarks',
    READ_CHAPTERS: 'savedReadChapters',
    
    // Chapter tracking for notifications
    CHAPTER_COUNTS: 'chapterCounts',
    
    // Custom markers
    CUSTOM_MARKERS: 'customBookmarks',
    
    // Feature toggles (individual keys for backward compat)
    AUTO_SYNC: 'AutoSyncfeatureEnabled',
    CUSTOM_BOOKMARKS: 'CustomBookmarksfeatureEnabled',
    CUSTOM_BORDER: 'CustomBorderSizefeatureEnabled',
    MARK_HOMEPAGE: 'MarkHomePagefeatureEnabled',
    SYNC_READ: 'SyncandMarkReadfeatureEnabled',
    NEW_TAB_DASHBOARD: 'NewTabDashboardfeatureEnabled',
    WEBTOONS_HIGHLIGHT: 'WebtoonsHighlightfeatureEnabled',
    FAMILY_FRIENDLY: 'FamilyFriendlyfeatureEnabled',
    
    // Sync timestamps
    LAST_SYNC: 'SyncLastDate',
    
    // Cache keys
    ANILIST_CACHE: 'anilistCache',
    MANGADEX_CACHE: 'mangadexCache',
    
    // User settings
    THEME: 'currentTheme',
    BORDER_STYLE: 'BorderStyle',
    BORDER_SIZE: 'CustomBorderSize',
    
    // Status colors
    STATUS_COLORS: 'statusColors',
    
    // Notification state
    NEW_CHAPTERS: 'newChaptersAvailable',
    LAST_CHECK: 'lastNotificationCheck',
    
    // Recent history
    HISTORY: 'userbookmarkshistory',
    
    // Quick access sites
    QUICK_ACCESS: 'quickAccessSites'
};

/**
 * Valid reading statuses
 * @type {string[]}
 */
export const VALID_STATUSES = [
    'Reading',
    'Completed',
    'Plan to Read',
    'On-Hold',
    'Dropped',
    'Re-reading'
];

/**
 * Platform identifiers
 * @type {string[]}
 */
export const PLATFORMS = [
    'mangafire',
    'mangadex',
    'webtoons',
    'asurascans',
    'mangaplus',
    'manganato'
];

/**
 * Library entry schema with all fields documented.
 * @typedef {Object} LibraryEntry
 * @property {string} id - Unique identifier (generated UUID or from source)
 * @property {string} title - Display title
 * @property {string} slug - URL-friendly slug
 * @property {string} status - Reading status (Reading, Completed, etc.)
 * @property {number} dateAdded - Timestamp when entry was added
 * @property {string} source - Platform ID (mangafire, mangadex, webtoons)
 * @property {string} sourceId - Platform-specific ID
 * @property {string} sourceUrl - Direct link to source
 * @property {string|null} lastReadChapter - Last chapter read
 * @property {number|null} lastReadDate - Timestamp of last read
 * @property {number} readChapters - Count of chapters read
 * @property {number|null} totalChapters - Total chapters available
 * @property {Object|null} anilistData - Metadata from AniList
 * @property {PersonalData|null} personalData - User's personal data
 * @property {string|null} customMarker - Custom marker name
 * @property {number} lastUpdated - Last modification timestamp
 */

/**
 * Personal data schema for user notes, ratings, and tags.
 * @typedef {Object} PersonalData
 * @property {number|null} rating - User rating 1-10
 * @property {string[]} tags - User-defined tags
 * @property {string|null} notes - User notes
 */

/**
 * Bookmark entry (lightweight for content scripts)
 * @typedef {Object} BookmarkEntry
 * @property {string} title - Normalized slug-like title
 * @property {string} status - Current status
 * @property {string|null} customMarker - Optional custom category
 * @property {string} mangafireId - MangaFire internal ID (legacy)
 */

/**
 * Helper to generate namespaced storage keys.
 * @param {string} source - Platform ID
 * @param {string} slug - Manga/webtoon slug
 * @returns {string} Namespaced key
 */
export function getNamespacedKey(source, slug) {
    return `${source}:${slug}`;
}

/**
 * Parse a namespaced key back to components.
 * @param {string} key - Namespaced key
 * @returns {{source: string, slug: string}|null}
 */
export function parseNamespacedKey(key) {
    const [source, ...slugParts] = key.split(':');
    if (!source || slugParts.length === 0) return null;
    return { source, slug: slugParts.join(':') };
}

/**
 * Create a new library entry with required defaults.
 * @param {Partial<LibraryEntry>} data - Entry data
 * @returns {LibraryEntry}
 */
export function createLibraryEntry(data) {
    const now = Date.now();
    return {
        id: data.id || crypto.randomUUID(),
        title: data.title || 'Unknown Title',
        slug: data.slug || '',
        status: data.status || 'Plan to Read',
        dateAdded: data.dateAdded || now,
        source: data.source || 'unknown',
        sourceId: data.sourceId || '',
        sourceUrl: data.sourceUrl || '',
        lastReadChapter: data.lastReadChapter || null,
        lastReadDate: data.lastReadDate || null,
        readChapters: data.readChapters || 0,
        totalChapters: data.totalChapters || null,
        anilistData: data.anilistData || null,
        personalData: data.personalData || null,
        customMarker: data.customMarker || null,
        lastUpdated: now,
        // Legacy MangaFire fields for backward compatibility
        mangafireUrl: data.mangafireUrl || data.sourceUrl || '',
        mangafireId: data.mangafireId || data.sourceId || ''
    };
}

/**
 * Validate a library entry has required fields.
 * @param {Object} entry - Entry to validate
 * @returns {boolean}
 */
export function validateLibraryEntry(entry) {
    return !!(
        entry &&
        typeof entry.title === 'string' &&
        typeof entry.status === 'string'
    );
}

/**
 * Normalize a title to a URL-friendly slug.
 * @param {string} title - Raw title
 * @returns {string} Normalized slug
 */
export function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Match a title against library entries using various slug formats.
 * @param {string} title - Title to match
 * @param {Object<string, string[]>} readChapters - Read chapters map
 * @returns {string[]|null} Matched chapters or null
 */
export function matchReadChapters(title, readChapters) {
    if (!title || !readChapters) return null;
    
    const variations = [
        title,
        slugify(title),
        title.toLowerCase().replace(/[^a-z0-9]/g, '-')
    ];
    
    for (const variant of variations) {
        if (readChapters[variant]) {
            return readChapters[variant];
        }
    }
    
    return null;
}

/**
 * Migrate old storage format to new namespaced format.
 * Call once during extension update.
 * @returns {Promise<{migrated: number, errors: number}>}
 */
export async function migrateStorage() {
    const stats = { migrated: 0, errors: 0 };
    
    try {
        const data = await chrome.storage.local.get([
            STORAGE_KEYS.LIBRARY,
            STORAGE_KEYS.READ_CHAPTERS
        ]);

        const library = data[STORAGE_KEYS.LIBRARY] || [];
        const readChapters = data[STORAGE_KEYS.READ_CHAPTERS] || {};

        // Add source field to entries missing it
        let libraryUpdated = false;
        library.forEach(entry => {
            if (!entry.source) {
                // Infer source from URL or default to mangafire
                if (entry.mangafireUrl || entry.mangafireId) {
                    entry.source = 'mangafire';
                    entry.sourceId = entry.mangafireId || '';
                    entry.sourceUrl = entry.mangafireUrl || '';
                } else if (entry.mangadexId) {
                    entry.source = 'mangadex';
                    entry.sourceId = entry.mangadexId;
                } else {
                    entry.source = 'mangafire';
                }
                libraryUpdated = true;
                stats.migrated++;
            }
        });

        // Namespace read chapters if not already
        const newReadChapters = {};
        let chaptersUpdated = false;
        
        for (const [key, chapters] of Object.entries(readChapters)) {
            if (key.includes(':')) {
                newReadChapters[key] = chapters;
            } else {
                const newKey = getNamespacedKey('mangafire', key);
                newReadChapters[newKey] = chapters;
                chaptersUpdated = true;
                stats.migrated++;
            }
        }

        // Save if changes were made
        if (libraryUpdated || chaptersUpdated) {
            await chrome.storage.local.set({
                [STORAGE_KEYS.LIBRARY]: library,
                [STORAGE_KEYS.READ_CHAPTERS]: newReadChapters
            });
            console.log(`[Storage] ✓ Migrated ${stats.migrated} entries`);
        }

    } catch (error) {
        console.error('[Storage] Migration error:', error);
        stats.errors++;
    }

    return stats;
}
