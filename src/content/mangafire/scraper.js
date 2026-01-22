/**
 * @fileoverview MangaFire Bookmark and Reading History Scraper Module
 * Handles scraping user bookmarks and reading history from MangaFire website.
 * Part of the Bookmarks Marker/Highlighter Chrome Extension.
 * 
 * This is the Vue-migrated version that works with the new src structure.
 */

import { fetchMangaFromAnilist } from '../../core/anilist-api.js';

/**
 * Sends log messages safely, suppressing errors when receiving end doesn't exist.
 * @param {Object} message - Message object to send.
 */
function safeSendMessage(message) {
  try {
    if (chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, () => {
        const err = chrome.runtime.lastError;
        // Silently ignore connection errors
      });
    }
  } catch (e) {
    // Ignore context invalidated errors
  }
}

/**
 * Logs messages via the extension's messaging system.
 * @param {string|Object} txt - The message to log.
 */
function Log(txt) {
  const text = typeof txt === "object" ? JSON.stringify(txt) : txt;
  console.log('[Scraper]', text);
  safeSendMessage({ type: "log", text: text });
}

/**
 * Opens MangaFire user bookmarks page and scrapes manga titles and statuses.
 * Each page holds ~30 manga. Recursively continues to next page until empty.
 * @param {number} pageIdentifier - Page number to scrape (1-indexed).
 */
export function scrapeBookmarksFromUnopenedTab(pageIdentifier) {
  Log("scrapeBookmarksFromUnopenedTab() called");
  const pageurl = `https://mangafire.to/user/bookmark?page=${pageIdentifier}`;
  Log(`Page URL: ${pageurl}`);
  
  chrome.tabs.create({ url: pageurl, active: false }, (tab) => {
    Log(`New tab created with ID: ${tab.id}`);

    // Wait for page to load before executing script
    const executeWhenReady = () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [pageIdentifier],
        func: (pageIdentifier) => {
          // Helper function for safe messaging within injected script
          const safeSendMessage = (msg) => {
            try {
              chrome.runtime.sendMessage(msg, () => chrome.runtime.lastError);
            } catch (e) { /* ignore */ }
          };

          safeSendMessage({ type: "log", text: "executing script" });
          const bookmarks = [];
          const container = document.querySelector(".original.card-xs");

          if (!container) {
            safeSendMessage({
              type: "log",
              text: "!!!Container not found. Are you logged In Mangafire?",
            });
            // Signal end of scraping
            safeSendMessage({ type: "scrapeBookmarks", value: 0 });
            return;
          }

          const mangaDivs = container.querySelectorAll(":scope > div");
          
          // Empty page signals end of pagination
          if (mangaDivs.length === 0) {
            safeSendMessage({ type: "bookmarksExtracted" });
            safeSendMessage({ type: "scrapeBookmarks", value: 0 });
            return;
          }

          mangaDivs.forEach((item) => {
            const inner = item.querySelector(".inner");
            if (inner) {
              const title = inner.querySelector(".info a");
              const statusBtn = inner.querySelector(
                ".info .dropdown.width-limit.favourite button"
              );

              if (title && statusBtn) {
                bookmarks.push({
                  title: title.textContent.trim(),
                  status: statusBtn.textContent.trim(),
                });
                safeSendMessage({
                  type: "log",
                  text: `Scraped: ${title.textContent.trim()} - ${statusBtn.textContent.trim()}`,
                });
              }
            }
          });

          safeSendMessage({ type: "log", text: `Total scraped this page: ${bookmarks.length}` });
          
          // Merge with existing bookmarks
          chrome.storage.local.get("userBookmarks", (data) => {
            const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
            const combined = existing.concat(bookmarks);
            chrome.storage.local.set({ userBookmarks: combined }, () => {
              safeSendMessage({
                type: "log",
                text: `Bookmarks saved. Total: ${combined.length}`,
              });
              safeSendMessage({ type: "bookmarksExtracted" });
              const pagevalue = pageIdentifier + 1;
              safeSendMessage({
                type: "scrapeBookmarks",
                value: pagevalue,
              });
            });
          });
        },
      });
    };

    // Give the page time to load
    setTimeout(executeWhenReady, 2000);
  });
}

/**
 * Opens MangaFire user reading history page and scrapes manga titles.
 * Assigns "Read" status to all scraped entries.
 * Each page holds ~30 manga. Recursively continues to next page until empty.
 * @param {number} pageIdentifier - Page number to scrape (1-indexed).
 */
export function scrapeReadMangasFromUnopenedTab(pageIdentifier) {
  Log("scrapeReadMangasFromUnopenedTab() called");
  const pageurl = `https://mangafire.to/user/reading?page=${pageIdentifier}`;
  Log(`Page URL: ${pageurl}`);
  
  chrome.tabs.create({ url: pageurl, active: false }, (tab) => {
    Log(`New tab created with ID: ${tab.id}`);

    const executeWhenReady = () => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [pageIdentifier],
        func: (pageIdentifier) => {
          const safeSendMessage = (msg) => {
            try {
              chrome.runtime.sendMessage(msg, () => chrome.runtime.lastError);
            } catch (e) { /* ignore */ }
          };

          const ReadMangas = [];
          const container = document.body;
          const mangaDivs = container.querySelectorAll(".inner .info");
          
          // Empty page signals end of pagination
          if (mangaDivs.length === 0) {
            safeSendMessage({ type: "bookmarksExtracted" });
            safeSendMessage({ type: "scrapeReadMangas", value: 0 });
            return;
          }

          mangaDivs.forEach((item) => {
            const titleEl = item.querySelector("a");
            if (titleEl) {
              const title = titleEl.textContent.trim();
              if (title) {
                ReadMangas.push({
                  title: title,
                  status: "Read",
                });
              }
            }
          });

          safeSendMessage({ type: "log", text: `Read mangas scraped: ${ReadMangas.length}` });
          
          // Merge with bookmarks, giving priority to existing bookmark statuses
          chrome.storage.local.get("userBookmarks", (data) => {
            const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];

            // Create map from read mangas (lower priority)
            const map = new Map(
              ReadMangas.map((item) => [item.title.toLowerCase(), item])
            );

            // Overwrite with existing bookmarks (higher priority)
            existing.forEach((item) => map.set(item.title.toLowerCase(), item));

            const merged = Array.from(map.values());

            chrome.storage.local.set({ userBookmarks: merged }, () => {
              safeSendMessage({
                type: "log",
                text: `Read Mangas merged. Total: ${merged.length}`,
              });
              safeSendMessage({ type: "bookmarksExtracted" });
              const pagevalue = pageIdentifier + 1;
              safeSendMessage({
                type: "scrapeReadMangas",
                value: pagevalue,
              });
            });
          });
        },
      });
    };

    setTimeout(executeWhenReady, 2000);
  });
}

/**
 * Handles auto-sync of a manga entry when user reads a chapter.
 * Updates existing entries or creates new ones with AniList metadata.
 * @param {string} title - Manga title from the reader URL.
 * @param {string} chapter - Current chapter number/identifier.
 * @param {string} slugWithId - MangaFire slug with ID (e.g., "one-piece.12345").
 * @param {number} readChaptersCount - Number of chapters read for this manga.
 */
export async function handleAutoSyncEntry(title, chapter, slugWithId, readChaptersCount) {
  Log(`handleAutoSyncEntry called for: ${title} (Ch. ${chapter})`);
  
  chrome.storage.local.get(["savedEntriesMerged", "savedReadChapters", "SmartAutoCompletefeatureEnabled"], async (data) => {
    let savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
    let history = data.savedReadChapters || {};
    const smartCompleteEnabled = data.SmartAutoCompletefeatureEnabled || false;
    
    // Helper: Convert string to URL-friendly slug
    const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const currentSlug = slugWithId ? slugWithId.split('.')[0] : slugify(title);

    // Helper: Get chapter count from reading history
    const getHistoryCount = (t, slug) => {
        if (readChaptersCount) return readChaptersCount;
        
        const tLower = t.toLowerCase();
        const tSlug = slugify(t);
        const explicitSlug = slug ? slug.split('.')[0] : null;

        const key = Object.keys(history).find(k => {
            const kLower = k.toLowerCase();
            const kSlug = slugify(k);
            return kLower === tLower || 
                   kSlug === tSlug || 
                   (explicitSlug && (kSlug === explicitSlug || kLower === explicitSlug));
        });
        
        return key ? history[key].length : 0;
    };

    // Search for existing entry by title or slug
    let entryIndex = savedEntries.findIndex(e => {
        const entryTitle = e.title.toLowerCase();
        const entrySlug = e.mangaSlug ? e.mangaSlug.split('.')[0] : slugify(e.title);
        return entryTitle === title.toLowerCase() || entrySlug === currentSlug;
    });
    
    if (entryIndex !== -1) {
      let entry = savedEntries[entryIndex];
      Log(`Updating existing entry: ${entry.title}`);
      
      entry.lastRead = Date.now();
      entry.lastChapterRead = chapter;
      entry.readChapters = getHistoryCount(entry.title, entry.mangaSlug);
      if (slugWithId) entry.mangaSlug = slugWithId;
      entry.lastUpdated = Date.now();
      
      // Save last read URL for quick resume
      if (slugWithId && chapter) {
        entry.lastMangafireUrl = `https://mangafire.to/read/${slugWithId}/en/chapter-${chapter}`;
      }

      // Smart Auto-Complete: Mark as Completed if reached final chapter
      if (smartCompleteEnabled && entry.anilistData && entry.anilistData.chapters) {
          const currentCh = parseFloat(String(chapter).replace(/[^\d.]/g, '')) || 0;
          const isFinished = entry.anilistData.status === 'FINISHED';

          if (isFinished && currentCh >= entry.anilistData.chapters && entry.anilistData.chapters > 0) {
              if (entry.status !== "Completed") {
                  entry.status = "Completed";
                  Log(`Smart Auto-Complete: Marked ${entry.title} as Completed`);
              }
          }
      }
      
      chrome.storage.local.set({ savedEntriesMerged: savedEntries });
      return;
    }

    // Not found - fetch from AniList
    Log(`No match for ${title}, fetching metadata...`);
    try {
      let aniData = await fetchMangaFromAnilist(title);
      
      // Create placeholder if API returns nothing
      if (!aniData) {
          Log(`No data found for ${title} on AniList`);
          aniData = {
              status: 'NOT_FOUND',
              lastChecked: Date.now(),
              title: { english: title },
              format: 'Unknown'
          };
      }
      
      // Check if we already have this AniList ID under different name
      if (aniData && aniData.id) {
          let aniIdMatchIndex = savedEntries.findIndex(e => e.anilistData && e.anilistData.id === aniData.id);
          
          if (aniIdMatchIndex !== -1) {
              let entry = savedEntries[aniIdMatchIndex];
              Log(`Found existing entry via AniList ID match: ${entry.title}`);
              
              entry.lastRead = Date.now();
              entry.lastChapterRead = chapter;
              entry.readChapters = getHistoryCount(entry.title, entry.mangaSlug);
              if (slugWithId) entry.mangaSlug = slugWithId;
              entry.lastUpdated = Date.now();
              
              if (slugWithId && chapter) {
                entry.lastMangafireUrl = `https://mangafire.to/read/${slugWithId}/en/chapter-${chapter}`;
              }
              
              chrome.storage.local.set({ savedEntriesMerged: savedEntries });
              return;
          }
      }

      // Create new entry
      Log(`Creating new library entry for: ${title}`);
      const newEntry = {
        title: title,
        status: "Reading",
        readChapters: getHistoryCount(title, slugWithId) || 1,
        lastChapterRead: chapter,
        mangaSlug: slugWithId,
        anilistData: aniData || null,
        customMarker: null,
        lastRead: Date.now(),
        lastUpdated: Date.now(),
        lastMangafireUrl: (slugWithId && chapter) ? `https://mangafire.to/read/${slugWithId}/en/chapter-${chapter}` : null
      };
      
      savedEntries.push(newEntry);
      chrome.storage.local.set({ savedEntriesMerged: savedEntries }, () => {
          Log(`Auto-synced new entry ${title} to library`);
      });
    } catch (err) {
        Log(`Error auto-syncing ${title}: ${err.message}`);
    }
  });
}
