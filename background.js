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
        chrome.runtime.sendMessage({ type: "log", text: "executing script" });
        const bookmarks = [];
        // Select the div that holds the 30-ish manga items/panels
        const container = document.querySelector(".original.card-xs");

        if (!container) {
          return chrome.runtime.sendMessage({
            type: "log",
            text: "!!!Container not found. Are you logged In Mangafire?",
          });
        }
        // Select all the manga items/panels within main container
        const mangaDivs = container.querySelectorAll(":scope > div");
        // there are practicly infinite pages, when it ecounters first empty one it stops.
        if (mangaDivs.length === 0) {
          chrome.runtime.sendMessage({ type: "bookmarksExtracted" });
          chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 0 });
          return;
        }

        mangaDivs.forEach((item) => {
          const inner = item.querySelector(".inner");
          if (inner) {
            //inner.style.border = "1px solid rgb(0, 255, 8)"; // Green border to check if the script found the element

            const title = inner.querySelector(".info a");
            chrome.runtime.sendMessage({
              type: "log",
              text: `title: ${title.textContent.trim()}`,
            });

            const statusBtn = inner.querySelector(
              ".info .dropdown.width-limit.favourite button"
            );
            chrome.runtime.sendMessage({
              type: "log",
              text: `status: ${statusBtn.textContent.trim()}`,
            });

            if (title && statusBtn) {
              bookmarks.push({
                title: title.textContent.trim(),
                status: statusBtn.textContent.trim(),
              });
              chrome.runtime.sendMessage({
                type: "log",
                text: `data pushed into Array. Array lenght: ${bookmarks.length}`,
              });
            } else {
              chrome.runtime.sendMessage({
                type: "log",
                text: "title or statusBtn not found",
              });
            }
          }
        });

        chrome.runtime.sendMessage({ type: "log", text: "bookmarks scraped" });
        // loads saved bookmarks and cross refrences them with newly scraped ones.
        chrome.storage.local.get("userBookmarks", (data) => {
          const existing = Array.isArray(data.userBookmarks)
            ? data.userBookmarks
            : [];
          const combined = existing.concat(bookmarks);
          chrome.storage.local.set({ userBookmarks: combined }, () => {
            chrome.runtime.sendMessage({
              type: "log",
              text: `bookmarks saved. Array length: ${combined.length}`,
            });
            chrome.runtime.sendMessage({ type: "bookmarksExtracted" });
            const pagevalue = pageIdentefier + 1;
            chrome.runtime.sendMessage({
              type: "log",
              text: `Next page value: ${pagevalue}`,
            });
            chrome.runtime.sendMessage({
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
          chrome.runtime.sendMessage({
            type: "log",
            text: "mangaDivs lenght is 0. this means there is zero mangas left",
          });
          //closes the tab
          chrome.runtime.sendMessage({ type: "bookmarksExtracted" });
          chrome.runtime.sendMessage({ type: "scrapeReadMangas", value: 0 });
          return;
        }

        chrome.runtime.sendMessage({
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
            chrome.runtime.sendMessage({
              type: "log",
              text: `title is : ${title} --- data pushed into Array. Array lenght: ${ReadMangas.length}`,
            });
          }
        });

        chrome.runtime.sendMessage({
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
            chrome.runtime.sendMessage({
              type: "log",
              text: `Read Mangas saved. Total Array length: ${merged.length}`,
            });
            chrome.runtime.sendMessage({ type: "bookmarksExtracted" });
            const pagevalue = pageIdentefier + 1;
            chrome.runtime.sendMessage({
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
  chrome.storage.local.get(["savedEntriesMerged", "savedReadChapters"], async (data) => {
    let savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
    let history = data.savedReadChapters || {};
    
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
    const getHistoryCount = (t) => {
        if (readChaptersCount) return readChaptersCount; // Use the one from message if available
        const tLower = t.toLowerCase();
        const tSlug = slugify(t);
        const key = Object.keys(history).find(k => k.toLowerCase() === tLower || slugify(k) === tSlug);
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
      entry.readChapters = getHistoryCount(entry.title); // Update the count
      if (slugWithId) entry.mangaSlug = slugWithId;
      entry.lastUpdated = Date.now();
      
      chrome.storage.local.set({ savedEntriesMerged: savedEntries });
      return;
    }

    // 3. Not found by title/slug, fetch from AniList
    Log(`No match for ${title}, fetching AniList data...`);
    try {
      const aniData = await fetchMangaFromAnilist(title);
      
      if (aniData && aniData.id) {
          // Double check if we have this AniList ID under a different name/slug
          let aniIdMatchIndex = savedEntries.findIndex(e => e.anilistData && e.anilistData.id === aniData.id);
          
          if (aniIdMatchIndex !== -1) {
              let entry = savedEntries[aniIdMatchIndex];
              Log(`Found existing entry via AniList ID match: ${entry.title}. Updating history.`);
              
              entry.lastRead = Date.now();
              entry.lastChapterRead = chapter;
              entry.readChapters = getHistoryCount(entry.title); // Update the count
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
        readChapters: getHistoryCount(title) || 1, // Start with at least 1 if we're sync-ing it
        lastChapterRead: chapter,
        mangaSlug: slugWithId,
        anilistData: aniData || null,
        customMarker: null,
        lastRead: Date.now(),
        lastUpdated: Date.now()
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

function Log(txt) {
  const text = typeof txt === "object" ? JSON.stringify(txt) : txt;
  chrome.runtime.sendMessage({ type: "log", text: text });
}
