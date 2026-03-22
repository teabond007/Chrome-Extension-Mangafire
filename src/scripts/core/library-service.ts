/**
 * @fileoverview Centralized Library Service
 * Handles data persistence and logic for library entries, tags, ratings, and notes.
 * Shared between background scripts, content scripts, and options UI.
 */

import { DATA, DEFAULT_STATUS } from '../../config.js';

export interface MangaQuery {
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
    if (entry.slug) return `slug:${entry.slug}`;
    if (entry.mangaSlug) return `slug:${entry.mangaSlug.split('.')[0]}`;
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
            lastUpdated: now
        };
        library[existingIdx] = updatedEntry;
    } else {
        updatedEntry = {
            status: DEFAULT_STATUS,
            ...entryData,
            lastRead: now,
            lastUpdated: now
        };
        library.push(updatedEntry);
    }

    await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: library });
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
            lastReadChapter: progress.chapter,
            lastReaderUrl: progress.url,
            lastRead: Date.now()
        });
    }

    // Only update if chapter is newer or same
    const current = parseFloat(entry.lastReadChapter) || 0;
    const incoming = parseFloat(progress.chapter) || 0;

    if (incoming >= current) {
        entry.lastReadChapter = progress.chapter;
        entry.lastReaderUrl = progress.url;
        entry.lastRead = Date.now();
        entry.lastUpdated = Date.now();
        
        await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: library });
    }

    return entry;
}

/**
 * Tracks a read chapter in the history.
 */
export async function trackReadChapter(mangaQuery: MangaQuery, chapter: string): Promise<string[]> {
    const data = await chrome.storage.local.get([DATA.READING_HISTORY]);
    const history = (data[DATA.READING_HISTORY] || {}) as Record<string, string[]>;
    
    // Use slug as the primary key for history if available, else standard ID
    const key = mangaQuery.slug || mangaQuery.mangaSlug?.split('.')[0] || getMangaId(mangaQuery);
    
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
        if (entry.status === 'Reading' && entry.lastRead) {
            const diff = now - entry.lastRead;
            if (diff > STALE_THRESHOLD) {
                changedCount++;
                return {
                    ...entry,
                    status: 'Read',
                    lastUpdated: now
                };
            }
        }
        return entry;
    });

    return { updatedLibrary, changedCount };
}
