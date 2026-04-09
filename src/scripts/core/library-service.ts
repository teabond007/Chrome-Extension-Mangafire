/**
 * @fileoverview Centralized Library Service
 * Handles data persistence and logic for library entries, tags, ratings, and notes.
 * Shared between background scripts, content scripts, and options UI.
 */

import { DATA, DEFAULT_STATUS, LIBRARY_ENTRY_KEYS, TOGGLES } from '../../config.js';
import { syncQueue, SyncPlatform } from './api/sync-queue';
import { syncAnilistProgress } from './api/anilist-sync';
import { syncMalProgress, searchMangaOnMal } from './api/mal-sync';

export interface MangaQuery {
    [key: string]: any;
    title: string;
    slug?: string;
    source?: string;
    sourceId?: string;
    mangaSlug?: string;
}

export interface ProgressUpdate {
    chapter: string;
    url: string;
}

export interface PersonalDataEntry {
    notes: string;
    rating: number;
    lastModified?: number;
}

/**
 * Gets a unique ID for a manga.
 */
export function getMangaId(entry: any): string {
    if (entry.anilistData?.id) return `anilist:${entry.anilistData.id}`;
    if (entry.mangadexId) return `mangadex:${entry.mangadexId}`;
    if (entry[LIBRARY_ENTRY_KEYS.MANGA_SLUG]) return `slug:${entry[LIBRARY_ENTRY_KEYS.MANGA_SLUG]}`;
    if (entry.slug) return `slug:${entry.slug}`;
    return `title:${slugify(entry.title)}`;
}

/**
 * Slugifies a title for search/ID purposes.
 */
function slugify(title: string): string {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds a matching entry in the library.
 */
export function findEntry(library: any[], query: MangaQuery): any | undefined {
    const { title, slug, source, sourceId } = query;
    const normalizedTitle = slugify(title);

    return library.find(e => {
        if (source && sourceId && e.source === source && e.sourceId === sourceId) return true;
        if (slug && (e.slug === slug || slug === e.mangaSlug?.split('.')[0])) return true;
        if (title && slugify(e.title) === normalizedTitle) return true;
        return false;
    });
}

/**
 * Performs a fuzzy match for search.
 */
export function fuzzyMatch(needle: string, haystack: string): boolean {
    if (!needle || !haystack) return false;
    const n = needle.toLowerCase();
    const h = haystack.toLowerCase();
    if (h.includes(n)) return true;

    let ni = 0;
    for (let hi = 0; hi < h.length && ni < n.length; hi++) {
        if (h[hi] === n[ni]) ni++;
    }
    return ni === n.length;
}

/**
 * Scores a fuzzy match.
 */
export function fuzzyScore(needle: string, haystack: string): number {
    if (!needle || !haystack) return 0;
    const n = needle.toLowerCase();
    const h = haystack.toLowerCase();
    if (h === n) return 1000;
    if (h.startsWith(n)) return 500;
    if (h.includes(n)) return 100;

    let score = 0;
    let ni = 0;
    let lastMatch = -1;
    for (let hi = 0; hi < h.length && ni < n.length; hi++) {
        if (h[hi] === n[ni]) {
            score += 10;
            if (lastMatch === hi - 1) score += 5;
            lastMatch = hi;
            ni++;
        }
    }
    return ni === n.length ? score : 0;
}

// ============ PERSISTENCE ============

/**
 * Loads library entries.
 */
export async function loadLibrary(): Promise<any[]> {
    const data = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES]);
    const list = data[DATA.LIBRARY_ENTRIES];
    return Array.isArray(list) ? list : [];
}

/**
 * Upserts an entry into the library.
 */
export async function upsertEntry(entryData: any): Promise<any> {
    const library = await loadLibrary();
    const id2 = getMangaId(entryData);

    const existingIdx = library.findIndex(e => {
        const id1 = getMangaId(e);
        return id1 === id2 || (e.title && e.title === entryData.title);
    });

    const now = Date.now();
    let updatedEntry: any;

    if (existingIdx !== -1) {
        updatedEntry = {
            ...library[existingIdx],
            ...entryData,
            [LIBRARY_ENTRY_KEYS.LAST_UPDATED]: now
        };
        library[existingIdx] = updatedEntry;
    } else {
        updatedEntry = {
            [LIBRARY_ENTRY_KEYS.STATUS]: DEFAULT_STATUS,
            ...entryData,
            [LIBRARY_ENTRY_KEYS.LAST_READ]: now,
            [LIBRARY_ENTRY_KEYS.LAST_UPDATED]: now
        };
        library.push(updatedEntry);
    }

    // Ensure array integrity
    const finalLibrary = Array.isArray(library) ? library : [];
    await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalLibrary)) });
    return updatedEntry;
}

/**
 * Updates reading progress for an entry.
 */
export async function updateProgress(query: MangaQuery, progress: ProgressUpdate): Promise<any> {
    const library = await loadLibrary();
    const entry = findEntry(library, query);

    if (!entry) {
        // Create new entry if not found
        return await upsertEntry({
            ...query,
            [LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER]: progress.chapter,
            [LIBRARY_ENTRY_KEYS.LAST_READER_URL]: progress.url,
            [LIBRARY_ENTRY_KEYS.LAST_READ]: Date.now()
        });
    }

    // Only update if chapter is newer or same
    const current = parseFloat(entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER]) || 0;
    const incoming = parseFloat(progress.chapter) || 0;

    if (incoming >= current) {
        entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER] = progress.chapter;
        entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL] = progress.url;
        entry[LIBRARY_ENTRY_KEYS.LAST_READ] = Date.now();
        entry[LIBRARY_ENTRY_KEYS.LAST_UPDATED] = Date.now();

        // Ensure array integrity
        const finalLibrary = Array.isArray(library) ? library : [];
        await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalLibrary)) });

        // Trigger External Sync
        triggerExternalSync(entry, incoming);
    }

    return entry;
}

/**
 * Dispatches sync tasks to external trackers based on user settings.
 */
async function triggerExternalSync(entry: any, chapter: number) {
    const data = await chrome.storage.local.get([
        TOGGLES.SYNC_ANILIST_ENABLED,
        TOGGLES.SYNC_MAL_ENABLED
    ]) as any;

    // AniList Sync
    if (data[TOGGLES.SYNC_ANILIST_ENABLED] && entry.anilistData?.id) {
        syncQueue.enqueue(
            SyncPlatform.ANILIST,
            () => syncAnilistProgress(entry.anilistData.id, chapter),
            `anilist-${entry.anilistData.id}-${chapter}`
        );
    }

    // MyAnimeList Sync
    if (data[TOGGLES.SYNC_MAL_ENABLED]) {
        let malId = entry.malId;

        // Try to resolve MAL ID if missing
        if (!malId) {
            malId = await searchMangaOnMal(entry.title);
            if (malId) {
                entry.malId = malId;
                // Save resolved ID back to library
                const library = await loadLibrary();
                const idx = library.findIndex(e => getMangaId(e) === getMangaId(entry));
                if (idx !== -1) {
                    library[idx].malId = malId;
                    await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(library)) });
                }
            }
        }

        if (malId) {
            syncQueue.enqueue(
                SyncPlatform.MAL,
                () => syncMalProgress(malId, chapter),
                `mal-${malId}-${chapter}`
            );
        }
    }
}

/**
 * Tracks a read chapter in the history.
 */
export async function trackReadChapter(mangaQuery: MangaQuery, chapter: string): Promise<string[]> {
    const data = await chrome.storage.local.get([DATA.READING_HISTORY]);
    const history = (data[DATA.READING_HISTORY] || {}) as Record<string, string[]>;

    // Use slug as the primary key for history if available, else standard ID
    const key = mangaQuery.slug || mangaQuery[LIBRARY_ENTRY_KEYS.MANGA_SLUG] || getMangaId(mangaQuery);

    if (!history[key]) history[key] = [];
    if (!history[key].includes(chapter)) {
        history[key].push(chapter);
        history[key].sort((a: string, b: string) => parseFloat(a) - parseFloat(b));
        await chrome.storage.local.set({ [DATA.READING_HISTORY]: history });
    }
    return history[key];
}

// ============ PERSONAL DATA ============

/**
 * Loads personal data map.
 */
export async function loadPersonalData(): Promise<Record<string, PersonalDataEntry>> {
    const data = await chrome.storage.local.get([DATA.PERSONAL_DATA]);
    return (data[DATA.PERSONAL_DATA] || {}) as Record<string, PersonalDataEntry>;
}

/**
 * Saves personal data for an entry.
 */
export async function savePersonalData(entry: any, updates: Partial<PersonalDataEntry>): Promise<PersonalDataEntry> {
    const allData = await loadPersonalData();
    const id = getMangaId(entry);

    allData[id] = {
        ...(allData[id] || { notes: '', rating: 0 }),
        ...updates,
        lastModified: Date.now()
    } as PersonalDataEntry;

    await chrome.storage.local.set({ [DATA.PERSONAL_DATA]: allData });
    return allData[id];
}

/**
 * Notes / Ratings shortcuts
 */
export async function saveRating(entry: any, rating: number): Promise<PersonalDataEntry> {
    return await savePersonalData(entry, { rating: Math.max(0, Math.min(10, rating)) });
}

export async function saveNotes(entry: any, notes: string): Promise<PersonalDataEntry> {
    return await savePersonalData(entry, { notes: notes.trim() });
}

// ============ FILTER PRESETS ============

/**
 * Loads filter presets.
 */
export async function loadFilterPresets(): Promise<any[]> {
    const data = await chrome.storage.local.get([DATA.FILTER_PRESETS]);
    const presets = data[DATA.FILTER_PRESETS];
    return Array.isArray(presets) ? presets : [];
}

/**
 * Saves a filter preset.
 */
export async function saveFilterPreset(name: string, filters: any): Promise<any[]> {
    const presets = await loadFilterPresets();
    const idx = presets.findIndex(p => p.name === name);
    if (idx >= 0) {
        presets[idx] = { name, filters, updatedAt: Date.now() };
    } else {
        presets.push({ name, filters, createdAt: Date.now() });
    }
    await chrome.storage.local.set({ [DATA.FILTER_PRESETS]: presets });
    return presets;
}

/**
 * Deletes a filter preset.
 */
export async function deleteFilterPreset(name: string): Promise<any[]> {
    let presets = await loadFilterPresets();
    presets = presets.filter(p => p.name !== name);
    await chrome.storage.local.set({ [DATA.FILTER_PRESETS]: presets });
    return presets;
}

/**
 * Maintenance: Converts 'Reading' entries to 'Read' if inactive for >30 days.
 * @param {Array} library - Loaded library entries
 * @returns {Object} { updatedLibrary: Array, changedCount: number }
 */
export function autoReadStaleEntries(library: any[]): { updatedLibrary: any[], changedCount: number } {
    const STALE_THRESHOLD = 30 * 24 * 60 * 60 * 1000; // 30 days
    const now = Date.now();
    let changedCount = 0;

    const updatedLibrary = library.map(entry => {
        if (entry[LIBRARY_ENTRY_KEYS.STATUS] === 'Reading' && entry[LIBRARY_ENTRY_KEYS.LAST_READ]) {
            const diff = now - entry[LIBRARY_ENTRY_KEYS.LAST_READ];
            if (diff > STALE_THRESHOLD) {
                changedCount++;
                return {
                    ...entry,
                    [LIBRARY_ENTRY_KEYS.STATUS]: 'Read',
                    [LIBRARY_ENTRY_KEYS.LAST_UPDATED]: now
                };
            }
        }
        return entry;
    });

    return { updatedLibrary, changedCount };
}
