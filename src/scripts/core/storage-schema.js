/**
 * @fileoverview Storage Schema - Documents and validates the unified storage structure
 * supporting all platforms with proper namespacing.
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
    
    // Feature toggles
    FEATURES: 'features',
    
    // Sync timestamps
    LAST_SYNC: 'SyncLastDate',
    
    // Cache keys
    ANILIST_CACHE: 'anilistCache',
    MANGADEX_CACHE: 'mangadexCache',
    
    // User settings
    THEME: 'currentTheme',
    BORDER_STYLE: 'BorderStyle',
    BORDER_SIZE: 'CustomBorderSize',
    
    // Notification state
    NEW_CHAPTERS: 'newChaptersAvailable',
    LAST_CHECK: 'lastNotificationCheck'
};

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
 * Chapter count tracking for notifications.
 * @typedef {Object} ChapterCountEntry
 * @property {number} lastKnown - Last known chapter count
 * @property {number} lastCheck - Timestamp of last check
 * @property {string|null} latestChapter - Latest chapter identifier
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
        lastUpdated: now
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
        typeof entry.source === 'string' &&
        typeof entry.status === 'string'
    );
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
                    entry.source = 'mangafire'; // Default
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
                // Already namespaced
                newReadChapters[key] = chapters;
            } else {
                // Assume mangafire for old entries
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
