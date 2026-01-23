import { fetchMangaFromAnilist, type AniListManga } from './anilist-api';
import { fetchMangaFromMangadex, wipeMangadexCache } from './mangadex-api.js';

/**
 * @fileoverview Library Data Manager
 * Handles background data synchronization and library-wide operations.
 * UI rendering is handled by Vue components.
 */

interface LibraryEntry {
    title: string;
    readChapters?: string | number;
    anilistData?: AniListManga;
    lastChecked?: number; // Timestamp of last metadata fetch attempt
    [key: string]: any;
}

interface StorageChanges {
    [key: string]: {
        oldValue?: any;
        newValue?: any;
    };
}

let savedEntriesMerged: LibraryEntry[] = [];
let fetchInProgress = false;

declare global {
    interface Window {
        cleanLibraryDuplicates: () => void;
        refreshLibraryData?: () => void;
        forceSyncLibrary?: () => void;
    }
}

/**
 * Validates a newly added entry (Partial type) into a full LibraryEntry
 */
function validateEntry(entry: Partial<LibraryEntry>): LibraryEntry {
    return {
        title: entry.title || 'Unknown',
        readChapters: entry.readChapters || 0,
        anilistData: entry.anilistData,
        ...entry
    };
}

/**
 * Initializes library data management.
 * Loads entries and starts background cleanup/fetch tasks.
 */
export function initLibrary(): void {
    chrome.storage.local.get(["savedEntriesMerged"], (data) => {
        savedEntriesMerged = (Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : []).map(validateEntry);

        if (!fetchInProgress) fetchMissingData();
    });

    // Listen for storage changes to keep local cache in sync (used for background tasks)
    chrome.storage.onChanged.addListener((changes: StorageChanges, area: string) => {
        if (area === 'local' && changes.savedEntriesMerged) {
            savedEntriesMerged = (changes.savedEntriesMerged.newValue || []).map(validateEntry);
        }
    });

    // Global API for UI components
    window.cleanLibraryDuplicates = cleanLibraryDuplicates;
    window.forceSyncLibrary = forceSyncLibrary;
}

/**
 * Removes duplicate manga entries based on title.
 * Keeps the entry with the most data (read chapters, anilist info).
 */
export function cleanLibraryDuplicates(): void {
    const unique = new Map<string, LibraryEntry>();
    let removedCount = 0;

    savedEntriesMerged.forEach(entry => {
        const title = entry.title.toLowerCase().trim();
        const existing = unique.get(title);

        if (!existing) {
            unique.set(title, entry);
        } else {
            // Keep the one with more progress or anilist data
            const existingProgress = parseInt(String(existing.readChapters || 0));
            const currentProgress = parseInt(String(entry.readChapters || 0));

            if (currentProgress > existingProgress || (!existing.anilistData && entry.anilistData)) {
                unique.set(title, entry);
            }
            removedCount++;
        }
    });

    if (removedCount > 0) {
        const cleaned = Array.from(unique.values());
        chrome.storage.local.set({ savedEntriesMerged: cleaned }, () => {
            console.log(`Library cleaned: removed ${removedCount} duplicates.`);
            if (window.refreshLibraryData) window.refreshLibraryData();
        });
    }
}

/**
 * Background task to fill in missing metadata for library entries.
 */
async function fetchMissingData(): Promise<void> {
    // Filter entries that have NO anilistData AND haven't been checked recently (e.g., in this session/hour)
    // Or entries that have partial data
    // ForceSync clears lastChecked, so they will all appear missing
    const missing = savedEntriesMerged.filter(e =>
        (!e.anilistData || (e.anilistData.id && !e.anilistData.chapters)) &&
        (!e.lastChecked || (Date.now() - e.lastChecked > 3600000)) // Retry if older than 1 hour or never checked
    );
    if (missing.length === 0) return;

    fetchInProgress = true;
    console.log(`Starting background fetch for ${missing.length} entries...`);
    window.dispatchEvent(new CustomEvent('library-sync-start', { detail: { total: missing.length } }));

    try {
        for (let i = 0; i < missing.length; i++) {
            const staleEntry = missing[i];

            // Re-find the entry in the current live array
            const liveEntry = savedEntriesMerged.find(e => e.title === staleEntry.title);
            if (!liveEntry) continue;

            dispatchProgress(i + 1, missing.length, liveEntry.title);

            // Avoid overloading APIs
            let data = await fetchMangaFromAnilist(liveEntry.title);

            // If AniList failed OR returned incomplete data, try MangaDex
            const isAniListIncomplete = data && (!data.bannerImage || !data.description || !data.coverImage?.large || data.genres?.length === 0);

            if (!data || isAniListIncomplete) {
                // Fetch MangaDex as fallback or supplement
                const mdData = await fetchMangaFromMangadex(liveEntry.title) as any;

                if (mdData) {
                    if (!data) {
                        // AniList failed completely, use MangaDex
                        data = mdData;
                    } else {
                        // Merge missing fields from MangaDex into AniList data
                        if (!data.bannerImage && mdData.bannerImage) data.bannerImage = mdData.bannerImage;
                        if (!data.description && mdData.description) data.description = mdData.description;
                        if ((!data.coverImage?.large || data.coverImage.large.includes('default')) && mdData.coverImage?.large) {
                            data.coverImage = mdData.coverImage;
                        }
                        if ((!data.genres || data.genres.length === 0) && mdData.genres?.length > 0) {
                            data.genres = mdData.genres;
                        }
                    }
                }
            }

            if (data) {
                liveEntry.anilistData = data;
            } else {
                // Mark as checked so we don't retry immediately
            }
            liveEntry.lastChecked = Date.now();

            // Save after every attempt (successful or not) to update progress
            await chrome.storage.local.set({ savedEntriesMerged });

            // Small delay between requests
            await new Promise(r => setTimeout(r, 500));
        }
    } catch (error) {
        console.error("Error in background metadata fetch:", error);
    } finally {
        fetchInProgress = false;
        console.log("Background fetch completed.");
        window.dispatchEvent(new CustomEvent('library-sync-complete'));
    }
}

function dispatchProgress(current: number, total: number, title: string) {
    window.dispatchEvent(new CustomEvent('library-sync-progress', {
        detail: { current, total, title }
    }));
}

/**
 * Forces a re-fetch of metadata for ALL entries in the library.
 * Clears existing AniList match data to force a fresh lookup.
 */
export async function forceSyncLibrary(): Promise<void> {
    if (fetchInProgress) {
        if (!confirm("A sync is already in progress. Do you want to restart it? This will effectively stop the current one and start over.")) {
            return;
        }
        fetchInProgress = false; // Reset flag to allow restart logic (though parallel loop might still run, this at least unlocks the UI command)
    }

    fetchInProgress = true;
    console.log("Starting forced library sync...");

    // Clear metadata for all entries to force re-fetch
    savedEntriesMerged.forEach(e => {
        e.anilistData = undefined;
        e.lastChecked = undefined; // Clear checked timestamp to force retry
    });

    // Clear caches
    await wipeMangadexCache();
    console.log("Cleared MangaDex cache.");

    // Trigger missing data fetch which will now see all entries as "missing"
    try {
        await fetchMissingData();
        alert("Library sync completed!");
    } catch (e) {
        console.error("Force sync failed:", e);
        alert("Sync failed. Check console constraints.");
    } finally {
        fetchInProgress = false;
    }
}

