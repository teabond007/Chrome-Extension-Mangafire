import { fetchMangaFromAnilist } from './options/scripts/core/anilist-api.js';

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
});

/** opens first User Bookmarks page and saves every manga title and status.
 *  each page holds 30 mangas. after scraping goes to next page.
 *  on empty page stops.
 * @param {int} pageIdentefier determines which page to open.
 */
function scrapeBookmarksFromUnopenedTab(pageIdentefier) {
  Log("scrapeBookmarksFromUnopenedTab() called");
  pageurl = `https://mangafire.to/user/bookmark?page=${pageIdentefier}`;
  Log(`Page URL: ${pageurl}`);
  chrome.tabs.create({ url: pageurl, active: false }, (tab) => {
    Log(`New tab created with ID: ${tab.id}`);

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [pageIdentefier],
      func: (pageIdentefier) => {
        safeSendMessage({ type: "log", text: "executing script" });
        const bookmarks = [];
        // Select the div that holds the 30-ish manga items/panels
        const container = document.querySelector(".original.card-xs");

        if (!container) {
          return safeSendMessage({
            type: "log",
            text: "!!!Container not found. Are you logged In Mangafire?",
          });
        }
        // Select all the manga items/panels within main container
        const mangaDivs = container.querySelectorAll(":scope > div");
        // there are practicly infinite pages, when it ecounters first empty one it stops.
        if (mangaDivs.length === 0) {
          safeSendMessage({ type: "bookmarksExtracted" });
          safeSendMessage({ type: "scrapeBookmarks", value: 0 });
          return;
        }

        mangaDivs.forEach((item) => {
          const inner = item.querySelector(".inner");
          if (inner) {
            //inner.style.border = "1px solid rgb(0, 255, 8)"; // Green border to check if the script found the element

            const title = inner.querySelector(".info a");
            safeSendMessage({
              type: "log",
              text: `title: ${title.textContent.trim()}`,
            });

            const statusBtn = inner.querySelector(
              ".info .dropdown.width-limit.favourite button"
            );
            safeSendMessage({
              type: "log",
              text: `status: ${statusBtn.textContent.trim()}`,
            });

            if (title && statusBtn) {
              bookmarks.push({
                title: title.textContent.trim(),
                status: statusBtn.textContent.trim(),
              });
              safeSendMessage({
                type: "log",
                text: `data pushed into Array. Array lenght: ${bookmarks.length}`,
              });
            } else {
              safeSendMessage({
                type: "log",
                text: "title or statusBtn not found",
              });
            }
          }
        });

        safeSendMessage({ type: "log", text: "bookmarks scraped" });
        // loads saved bookmarks and cross refrences them with newly scraped ones.
        chrome.storage.local.get("userBookmarks", (data) => {
          const existing = Array.isArray(data.userBookmarks)
            ? data.userBookmarks
            : [];
          const combined = existing.concat(bookmarks);
          chrome.storage.local.set({ userBookmarks: combined }, () => {
            safeSendMessage({
              type: "log",
              text: `bookmarks saved. Array length: ${combined.length}`,
            });
            safeSendMessage({ type: "bookmarksExtracted" });
            const pagevalue = pageIdentefier + 1;
            safeSendMessage({
              type: "log",
              text: `Next page value: ${pagevalue}`,
            });
            safeSendMessage({
              type: "scrapeBookmarks",
              value: pagevalue,
            });
          });
        });
      },
    });
  });
}

/** opens first User History page and saves every manga title and adds status: read.
 *  each page holds 30 mangas. after scraping goes to next page.
 *  on empty page stops.
 *
 * @param {int} pageIdentefier
 */
function scrapReadMangasFromUnopenedTab(pageIdentefier) {
  Log("scrapReadMangasFromUnopenedTab() called");
  pageurl = `https://mangafire.to/user/reading?page=${pageIdentefier}`;
  Log(`Page URL: ${pageurl}`);
  chrome.tabs.create({ url: pageurl, active: false }, (tab) => {
    Log(`New tab created with ID: ${tab.id}`);

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [pageIdentefier],
      func: (pageIdentefier) => {
        const ReadMangas = [];

        const container = document.body;

        mangaDivs = container.querySelectorAll(".inner .info");
        // there are practicly infinite pages, when it ecounters first empty one it stops.
        if (mangaDivs.length === 0) {
          safeSendMessage({
            type: "log",
            text: "mangaDivs lenght is 0. this means there is zero mangas left",
          });
          //closes the tab
          safeSendMessage({ type: "bookmarksExtracted" });
          safeSendMessage({ type: "scrapeReadMangas", value: 0 });
          return;
        }

        safeSendMessage({
          type: "log",
          text: "executing forEach loop",
        });

        mangaDivs.forEach((item) => {
          const title = item.querySelector("a").textContent.trim();

          if (title) {
            ReadMangas.push({
              title: title,
              status: "Read",
            });
            safeSendMessage({
              type: "log",
              text: `title is : ${title} --- data pushed into Array. Array lenght: ${ReadMangas.length}`,
            });
          }
        });

        safeSendMessage({
          type: "log",
          text: "Read Mangas scraped. forEach loop stopped",
        });
        // Cross refrences with Bookmarked mangas which have higher priority
        // if there is no saved manga with same title it adds it to userBookmarks with title: read
        chrome.storage.local.get("userBookmarks", (data) => {
          const existing = Array.isArray(data.userBookmarks)
            ? data.userBookmarks
            : [];

          //Step 1: Create a map from the second array (lower priority)
          const map = new Map(
            ReadMangas.map((item) => [item.title.toLowerCase(), item])
          );

          // Step 2: Overwrite with items from the first array (higher priority)
          existing.forEach((item) => map.set(item.title.toLowerCase(), item));

          // Step 3: Convert the map back to an array
          const merged = Array.from(map.values());

          chrome.storage.local.set({ userBookmarks: merged }, () => {
            safeSendMessage({
              type: "log",
              text: `Read Mangas saved. Total Array length: ${merged.length}`,
            });
            safeSendMessage({ type: "bookmarksExtracted" });
            const pagevalue = pageIdentefier + 1;
            safeSendMessage({
              type: "scrapeReadMangas",
              value: pagevalue,
            });
          });
        });
      },
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "scrapeReadMangas") {
    Log("scrapeReadMangas message received");
    if (msg.value === 0) {
      Log(
        "Message received: scrapeReadMangas. msg.value is 0. stopping further execution. everyithing is OK"
      );
      chrome.storage.local.set({ SyncLastDate: Date.now() });
    } else if (msg.value === 1) {
      Log("Message received: scrapeReadMangas, value: 1");
      Log("Contionouing scraping Mangas now scraping Read Mangas");
      scrapReadMangasFromUnopenedTab(1);
    } else {
      Log(`Message received: scrapeReadMangas, value: ${msg.value}`);
      scrapReadMangasFromUnopenedTab(msg.value);
    }
  } else if (msg.type === "scrapeBookmarks") {
    if (msg.value === 0) {
      Log(
        "Message received: scrapeBookmarks. msg.value is 0. stopping further execution. everyithing is OK"
      );
      chrome.storage.local.get("SyncandMarkReadfeatureEnabled", (data) => {
        if (data.SyncandMarkReadfeatureEnabled || false) {
          scrapReadMangasFromUnopenedTab(1);
        }
      });
      chrome.storage.local.set({ SyncLastDate: Date.now() });
    } else if (msg.value === 1) {
      chrome.storage.local.remove("userBookmarks");
      Log("Removed userBookmarks for a fresh restart");
      Log(`Message received: scrapeBookmarks, value: ${msg.value}`);
      scrapeBookmarksFromUnopenedTab(msg.value);
    } else {
      Log(`Message received: scrapeBookmarks, value: ${msg.value}`);
      scrapeBookmarksFromUnopenedTab(msg.value);
    }
  } else if (msg.type === "autoSyncEntry") {
    handleAutoSyncEntry(msg.title, msg.chapter, msg.slugWithId, msg.readChapters);
  } else if (msg.type === "bookmarksExtracted") {
    chrome.tabs.remove(sender.tab.id);
    Log("Tab closed after scraping");
  }
  
  // Mandatory response to prevent "The message port closed before a response was received"
  sendResponse({ status: "received" });
  return true; 
});

async function handleAutoSyncEntry(title, chapter, slugWithId, readChaptersCount) {
  Log(`handleAutoSyncEntry called for: ${title} (Ch. ${chapter}) with slug: ${slugWithId}. Chapters: ${readChaptersCount || 'unknown'}`);
  chrome.storage.local.get(["savedEntriesMerged", "savedReadChapters", "SmartAutoCompletefeatureEnabled"], async (data) => {
    let savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
    let history = data.savedReadChapters || {};
    const smartCompleteEnabled = data.SmartAutoCompletefeatureEnabled || false;
    
    // 1. Deduplication Pass (Emergency Cleanup)
    // Favor entries with anilistData and higher lastRead
    const seenIds = new Set();
    const seenSlugs = new Set();
    const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    savedEntries.sort((a, b) => {
        if (!!a.anilistData !== !!b.anilistData) return b.anilistData ? 1 : -1;
        return (b.lastRead || 0) - (a.lastRead || 0);
    });

    savedEntries = savedEntries.filter(e => {
        if (e.anilistData && e.anilistData.id) {
            if (seenIds.has(e.anilistData.id)) return false;
            seenIds.add(e.anilistData.id);
        }
        const eSlug = e.mangaSlug ? e.mangaSlug.split('.')[0] : slugify(e.title);
        if (seenSlugs.has(eSlug)) return false;
        seenSlugs.add(eSlug);
        return true;
    });

    const currentSlug = slugWithId ? slugWithId.split('.')[0] : slugify(title);

    // Helper to get chapter count from history
    const getHistoryCount = (t, slug) => {
        if (readChaptersCount) return readChaptersCount; // Use the one from message if available
        
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

    // 2. Search for existing entry (Title or Slug)
    let entryIndex = savedEntries.findIndex(e => {
        const entryTitle = e.title.toLowerCase();
        const entrySlug = e.mangaSlug ? e.mangaSlug.split('.')[0] : slugify(e.title);
        return entryTitle === title.toLowerCase() || entrySlug === currentSlug;
    });
    
    if (entryIndex !== -1) {
      let entry = savedEntries[entryIndex];
      Log(`Updating existing entry: ${entry.title}. Preserving status: ${entry.status || "Reading"}`);
      
      entry.lastRead = Date.now();
      entry.lastChapterRead = chapter;
      entry.readChapters = getHistoryCount(entry.title, entry.mangaSlug); // Update the count
      if (slugWithId) entry.mangaSlug = slugWithId;
      entry.lastUpdated = Date.now();

      // Smart Auto-Complete Check
      if (smartCompleteEnabled && entry.anilistData && entry.anilistData.chapters) {
          // If current chapter is greater or equal to total chapters
          const currentCh = parseFloat(String(chapter).replace(/[^\d.]/g, '')) || 0;
          
          // REFINEMENT: Only mark completed if the series is actually FINISHED on AniList
          const isFinished = entry.anilistData.status === 'FINISHED';

          if (isFinished && currentCh >= entry.anilistData.chapters && entry.anilistData.chapters > 0) {
              if (entry.status !== "Completed") {
                  entry.status = "Completed";
                  Log(`Smart Auto-Complete: Marked ${entry.title} as Completed (Ch. ${currentCh}/${entry.anilistData.chapters}). Status: ${entry.anilistData.status}`);
              }
          }
      }
      
      chrome.storage.local.set({ savedEntriesMerged: savedEntries });
      return;
    }

    // 3. Not found by title/slug, fetch from AniList
    Log(`No match for ${title}, fetching AniList data...`);
    try {
      const aniData = await fetchMangaFromAnilist(title);
      
      // Negative Caching Structure if not found
      let effectiveAniData = aniData;
      if (!aniData) {
          Log(`AniList returned no data for ${title}. Marking as NOT_FOUND.`);
          effectiveAniData = {
              status: 'NOT_FOUND',
              lastChecked: Date.now(),
              title: { english: title },
              format: 'Unknown'
          };
      }
      
      if (effectiveAniData && effectiveAniData.id) {
          // Double check if we have this AniList ID under a different name/slug
          let aniIdMatchIndex = savedEntries.findIndex(e => e.anilistData && e.anilistData.id === effectiveAniData.id);
          
          if (aniIdMatchIndex !== -1) {
              let entry = savedEntries[aniIdMatchIndex];
              Log(`Found existing entry via AniList ID match: ${entry.title}. Updating history.`);
              
              entry.lastRead = Date.now();
              entry.lastChapterRead = chapter;
              entry.readChapters = getHistoryCount(entry.title, entry.mangaSlug); // Update the count
              if (slugWithId) entry.mangaSlug = slugWithId;
              entry.lastUpdated = Date.now();
              
              chrome.storage.local.set({ savedEntriesMerged: savedEntries });
              return;
          }
      }

      // 4. Create new entry
      Log(`Creating new library entry for: ${title}`);
      const newEntry = {
        title: title,
        status: "Reading", // Default for top-level new discoveries
        readChapters: getHistoryCount(title, slugWithId) || 1, // Start with at least 1 if we're sync-ing it
        lastChapterRead: chapter,
        mangaSlug: slugWithId,
        lastChapterRead: chapter,
        mangaSlug: slugWithId,
        anilistData: effectiveAniData || null,
        customMarker: null,
        customMarker: null,
        lastRead: Date.now(),
        lastUpdated: Date.now()
      };
      
      savedEntries.push(newEntry);
      chrome.storage.local.set({ savedEntriesMerged: savedEntries }, () => {
          Log(`Auto-synced new entry ${title} to library`);
      });
      chrome.storage.local.set({ savedEntriesMerged: savedEntries }, () => {
          Log(`Auto-synced new entry ${title} to library`);
      });
    } catch (err) {
        Log(`Error auto-syncing ${title}: ${err.message}`);
        // Optional: If error is persistent, we could also mark as NOT_FOUND here, 
        // but for now we rely on the null check above for "no results".
    }
  });
}

function Log(txt) {
  const text = typeof txt === "object" ? JSON.stringify(txt) : txt;
  // Use safeSendMessage instead of direct sendMessage
  safeSendMessage({ type: "log", text: text });
}

/**
 * Safe wrapper for chrome.runtime.sendMessage to suppress "Receiving end does not exist" errors.
 * These errors occur when sending messages to popup/options pages that are currently closed.
 */
function safeSendMessage(message) {
  try {
    // Only send if we are in a valid context
    if (chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, (response) => {
        // Just checking lastError suppresses the "Receiving end does not exist" console error
        const err = chrome.runtime.lastError;
        if (err) {
          // Optional: Only log real errors, ignore the connection one
          if (err.message !== "Could not establish connection. Receiving end does not exist.") {
            // console.warn("Background message error:", err.message);
          }
        }
      });
    }
  } catch (e) {
    // Ignore context invalidated errors
  }
}
