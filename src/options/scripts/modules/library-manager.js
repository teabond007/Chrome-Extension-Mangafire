import { fetchMangaFromAnilist } from '../core/anilist-api.js';
import { fetchMangaFromMangadex } from '../core/mangadex-api.js';

/**
 * @fileoverview Library Data Manager
 * Handles background data synchronization and library-wide operations.
 * UI rendering is handled by Vue components.
 */

let savedEntriesMerged = [];
let fetchInProgress = false;

/**
 * Initializes library data management.
 * Loads entries and starts background cleanup/fetch tasks.
 */
export function initLibrary() {
    chrome.storage.local.get(["savedEntriesMerged"], (data) => {
        savedEntriesMerged = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
        
        if (!fetchInProgress) fetchMissingData();
    });

    // Listen for storage changes to keep local cache in sync (used for background tasks)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.savedEntriesMerged) {
            savedEntriesMerged = changes.savedEntriesMerged.newValue || [];
        }
    });

    // Handle legacy global calls from components if necessary
    window.cleanLibraryDuplicates = cleanLibraryDuplicates;
}

/**
 * Removes duplicate manga entries based on title.
 * Keeps the entry with the most data (read chapters, anilist info).
 */
export function cleanLibraryDuplicates() {
    const unique = new Map();
    let removedCount = 0;

    savedEntriesMerged.forEach(entry => {
        const title = entry.title.toLowerCase().trim();
        const existing = unique.get(title);

        if (!existing) {
            unique.set(title, entry);
        } else {
            // Keep the one with more progress or anilist data
            const existingProgress = parseInt(existing.readChapters) || 0;
            const currentProgress = parseInt(entry.readChapters) || 0;
            
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
async function fetchMissingData() {
    const missing = savedEntriesMerged.filter(e => !e.anilistData || (e.anilistData.id && !e.anilistData.chapters));
    if (missing.length === 0) return;
    
    fetchInProgress = true;
    console.log(`Starting background fetch for ${missing.length} entries...`);

    try {
        for (let i = 0; i < missing.length; i++) {
            const entry = missing[i];
            
            // Avoid overloading APIs
            let data = await fetchMangaFromAnilist(entry.title);
            if (!data) data = await fetchMangaFromMangadex(entry.title);
            
            if (data) {
                entry.anilistData = data;
                // Periodic save to avoid data loss on crash/close
                if ((i + 1) % 5 === 0) {
                    await chrome.storage.local.set({ savedEntriesMerged });
                }
            }
            
            // Small delay between requests
            await new Promise(r => setTimeout(r, 500));
        }
        await chrome.storage.local.set({ savedEntriesMerged });
    } catch (error) {
        console.error("Error in background metadata fetch:", error);
    } finally {
        fetchInProgress = false;
        console.log("Background fetch completed.");
    }
}
