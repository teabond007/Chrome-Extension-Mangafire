/**
 * @fileoverview MangaFire Content Script
 * Handles border highlighting for saved manga and chapter reading history tracking on MangaFire pages.
 * Part of the Bookmarks Marker/Highlighter Chrome Extension.
 */

/**
 * Main entry point for applying styles to manga cards on MangaFire pages.
 * Routes to appropriate handler based on current page path.
 */
function applyContainerStyles() {
  if (!chrome.runtime?.id) return;
  //doesnt run on pages that are loaded multiple times because of scrapers
  if (window.location.pathname === "/user/bookmark") {
    return;
  } else if (window.location.pathname === "/user/reading") {
    return;
  } else if (window.location.pathname === "/home") {
    applyContainerStylesHomePage();
    return;
  } else if (window.location.pathname === "/read") {
    return;
  }

  //Every Log is displayed on settings.html
  //settings page has to be open to register logs
  //dev tools dont work on mangafire.to this is alternative of console.log
  Log("applyContainerStyles() called");
  var pageMangas = [];
  const container = document.querySelector(".original.card-lg");
  if (container) {
    const mangaDivs = container.querySelectorAll(":scope > div");
    mangaDivs.forEach((item) => {
      const title = item.querySelector(".inner .info a").textContent.trim();
      if (title) {
        pageMangas.push(title);
        Log(`Title found: ${title}`);
      }
    });
  }
  // saves only mangas that are on the page and in the bookmarks
  crossRefrencBookmarks(pageMangas, (matched) => {
    Log("Matched Bookmarks:", matched);
    applyAndColorBorders(matched, ".inner .info a", ".inner");
  });
  autoSync();
}

/**
 * Saves the current chapter to the reading history for the specific manga title.
 * Data structure: { "manga-title": ["chapter-1", "chapter-2"] }
 */
function getReadChapters() {
  if (!chrome.runtime?.id) return; // Extension context invalidated

  const href = window.location.href;
  const { title, chapter, slugWithId } = cleanHrefToTitle(href);
  if (!title || !chapter) return;

  chrome.storage.local.get(["savedReadChapters"], (data) => {
    if (chrome.runtime.lastError) return;
    
    let history = data.savedReadChapters || {};
    let isNewChapter = false;

    if (!history[title]) {
      history[title] = [];
    }
    
    // Only add if it's a new chapter for this title
    if (!history[title].includes(chapter)) {
      history[title].push(chapter);
      isNewChapter = true;
    }

    const historyCount = history[title] ? history[title].length : 0;

    // Always notify background to update lastRead timestamp and current slug/chapter
    chrome.runtime.sendMessage({ 
      type: "autoSyncEntry", 
      title: title, 
      chapter: chapter,
      slugWithId: slugWithId,
      readChapters: historyCount
    }, () => {
      // Ignore errors if context invalidates during message
      if (chrome.runtime.lastError) return;
    });

    if (isNewChapter) {
      chrome.storage.local.set({ savedReadChapters: history }, () => {
        if (chrome.runtime.lastError) return;
        Log(`Saved chapter ${chapter} for ${title} to history`);
      });
    }
  });
}

/**
 * Parses manga title and chapter info from MangaFire reader URLs.
 * @param {string} href - The full URL of the reader page.
 * @returns {{title: string, chapter: string, slugWithId: string}} Parsed URL components.
 */
function cleanHrefToTitle(href) {
  if (!href) return { title: "", chapter: "", slugWithId: "" };

  // Improved regex to handle various MangaFire URL patterns
  // Pattern: .../read/[slug].[id]/[lang]/chapter-[num]
  const match = href.match(/\/read\/([^\/]+)\/(?:[^\/]+\/)?chapter-([^\/\?#]+)/);
  if (!match) return { title: "", chapter: "", slugWithId: "" };

  const slugWithId = match[1];
  const chapter = match[2];

  // Remove ID (everything after the last dot) for the "human" title
  let title = slugWithId.includes('.')
    ? slugWithId.substring(0, slugWithId.lastIndexOf('.'))
    : slugWithId;

  // Specific cleaning for MangaFire slugs (e.g., solo-levelingg -> solo-leveling)
  if (title.endsWith('gg')) {
    title = title.slice(0, -1);
  }

  return { title, chapter, slugWithId };
}

/**
 * Handles highlighting for MangaFire homepage sections loaded on initial page load.
 * Processes top trending, most viewed (day/week/month), and new releases sections.
 */
function applyContainerStylesHomePageOnLoad(){
//second part
Log("Homepage script executing");
    const topTrendingMangas = [];
    const mostViewedMangasDay = [];
    const mostViewedMangasWeek = [];
    const mostViewedMangasMonth = [];
    const newReleasesMangas = [];
    document.querySelectorAll(".swiper-slide").forEach((el) => {
      if (el.closest("#top-trending")) {
        
        //el.querySelector(".swiper-inner .info").style.setProperty("border-left", "4px solid darkblue", "important");
        let title = el
          .querySelector(".swiper-inner .info .above a")
          .textContent.trim();
        if (!topTrendingMangas.includes(title)) {
          topTrendingMangas.push(title);
          Log(`topTrending title: ${title}`);
        }
      } else if (el.closest("#most-viewed")) {
        if (el.closest('.tab-content[data-name="day"]')) {
          let title = el.querySelector("a span").textContent.trim();
          if (!mostViewedMangasDay.includes(title)) {
            mostViewedMangasDay.push(title);
            Log(`day title: ${title}`);
          }
        } else if (el.closest('.tab-content[data-name="week"]')) {
          let title = el.querySelector("a span").textContent.trim();
          if (!mostViewedMangasWeek.includes(title)) {
            mostViewedMangasWeek.push(title);
            Log(`week title: ${title}`);
          }
        } else if (el.closest('.tab-content[data-name="month"]')) {
          let title = el.querySelector("a span").textContent.trim();
          if (!mostViewedMangasMonth.includes(title)) {
            mostViewedMangasMonth.push(title);
            Log(`month title: ${title}`);
          }
        }
      } else {
        let title = el.querySelector("a span").textContent.trim();
        if (!newReleasesMangas.includes(title)) {
          newReleasesMangas.push(title);
          Log(`new release title: ${title}`);
        }
      }
    });

    crossRefrencBookmarks(topTrendingMangas, (matched) => {
      Log("crossRefrencBookmarks() for top trending mangas");
      applyAndColorBordersForTopTrendingMangas(
        matched,
      );
    });
    crossRefrencBookmarks(mostViewedMangasDay, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="day"] a span',
        "a"
      );
    });
    crossRefrencBookmarks(mostViewedMangasWeek, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="week"] a span',
        "a"
      );
    });
    crossRefrencBookmarks(mostViewedMangasMonth, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="month"] a span',
        "a"
      );
    });
    crossRefrencBookmarks(newReleasesMangas, (matched) => {
      Log("crossRefrencBookmarks()");
      applyAndColorBorders(matched, ".swiper.completed a span", "a");
    });
}

/**
 * Handles highlighting for the "Recently Updated" section on MangaFire homepage.
 */
function applyContainerStylesHomePage() {
  Log("applyContainerStylesHomePage() called");
  var pageMangas = [];

  //get titles for midlle mangas: recently updated
  var container = document.querySelector('.tab-content[data-name="all"]');
  if (container) {
    var mangaDivs = container.querySelectorAll(".unit");
    mangaDivs.forEach((item) => {
      const title = item.querySelector(".info a").textContent.trim();
      if (title && !pageMangas.includes(title)) {
        pageMangas.push(title);
        Log(`Title recently updated found: ${title}`);
      }
    });
    crossRefrencBookmarks(pageMangas, (matched) => {
      Log("--------------Matched Bookmarks:", matched);
      applyAndColorBorders(
        matched,
        '.tab-content[data-name="all"] .info a',
        ".inner"
      );
    });
    pageMangas = [];
  }

}

/**
 * Cross-references page manga titles with saved bookmarks to find matches.
 * @param {Array<string>} foundMangaTitles - All manga titles found on the current page.
 * @param {Function} callback - Callback receiving array of matched bookmark objects.
 */
function crossRefrencBookmarks(foundMangaTitles, callback) {
  if (!chrome.runtime?.id) return;
  Log(`crossRefrencBookmarks(), foundMangaTitles length: ${foundMangaTitles.length}`);
  chrome.storage.local.get(["userBookmarks", "savedEntriesMerged"], (data) => {
    if (chrome.runtime.lastError) return;
    // Priority: savedEntriesMerged (fuller data), fallback to userBookmarks (sync data)
    let bookmarks = [];
    
    const savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
    const userBookmarks = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];

    // Map titles for easy lookup
    const bookmarksMap = new Map();

    // Fill with userBookmarks first
    userBookmarks.forEach(b => {
      if (b && b.title) bookmarksMap.set(b.title, b);
    });

    // Overwrite/Add with savedEntries (preferred)
    savedEntries.forEach(b => {
      if (b && b.title) bookmarksMap.set(b.title, b);
    });

    bookmarks = Array.from(bookmarksMap.values());

    const matchedBookmarks = bookmarks.filter((bookmark) =>
      foundMangaTitles.includes(bookmark.title)
    );
    
    Log(`Matched ${matchedBookmarks.length} bookmarks`);
    callback(matchedBookmarks);
  });
}

/**
 * Applies colored borders to manga elements based on their bookmark status.
 * @param {Array<Object>} mangasToColor - Array of bookmark objects with title and status.
 * @param {string} querySelectToTitle - CSS selector to find title elements on page.
 * @param {string} elementClosestSelector - CSS selector for the element to apply border to.
 */
function applyAndColorBorders(
  mangasToColor,
  querySelectToTitle,
  elementClosestSelector
) {
  if (!chrome.runtime?.id) return;
  chrome.storage.local.get(
    [
      "CustomBookmarksfeatureEnabled",
      "customBookmarks",
      "CustomBorderSizefeatureEnabled",
      "CustomBorderSize",
      "SyncandMarkReadfeatureEnabled",
    ],
    (data) => {
      if (chrome.runtime.lastError) return;
      Log("massive local storage get done");
      Log(
        `querySelectToTitle: ${querySelectToTitle};    elementClosestSelector: ${elementClosestSelector}`
      );
      mangasToColor.forEach((bookmark) => {
        if (!bookmark || !bookmark.title || !bookmark.status) return;
        
        const status = bookmark.status.trim().toLowerCase();
        const element = [...document.querySelectorAll(querySelectToTitle)].find(
          (el) => el.textContent.trim() === bookmark.title
        );

        if (element) {
          var borderColor = "transparent";
          var borderStyle = "solid";
          const borderSize = data.CustomBorderSize || 4;

          // Standard status matching
          if (status.includes("reading")) {
            borderColor = "green";
          } else if (status.includes("dropped")) {
            borderColor = "darkred";
          } else if (status.includes("completed")) {
            borderColor = "blue";
          } else if (status.includes("on-hold") || status.includes("hold")) {
            borderColor = "orange";
          } else if (status.includes("plan to read")) {
            borderColor = "lightgreen";
          } else if (status.includes("read") && data.SyncandMarkReadfeatureEnabled) {
            borderColor = "grey";
          }

          // Custom Bookmark overrides
          if (data.CustomBookmarksfeatureEnabled) {
            const customBookmarks = data.customBookmarks || [];
            customBookmarks.forEach((custombookmark) => {
              if (custombookmark.name && status.includes(custombookmark.name.toLowerCase())) {
                borderColor = custombookmark.color;
                borderStyle = custombookmark.style || "solid";
              }
            });
          }

          const target = element.closest(elementClosestSelector);
          if (target) {
            if (data.CustomBorderSizefeatureEnabled) {
              target.style.border = `${borderSize}px ${borderStyle} ${borderColor}`;
            } else {
              target.style.border = `4px ${borderStyle} ${borderColor}`;
            }
          }
        }
      });
    }
  );
}

/**
 * Applies colored borders specifically for the Top Trending section on homepage.
 * Uses left-border styling with !important to override Swiper styles.
 * @param {Array<Object>} mangasToColor - Array of bookmark objects with title and status.
 */
function applyAndColorBordersForTopTrendingMangas(mangasToColor) {
    if (!chrome.runtime?.id) return;
    chrome.storage.local.get(
    [
      "CustomBookmarksfeatureEnabled",
      "customBookmarks",
      "CustomBorderSizefeatureEnabled",
      "CustomBorderSize",
      "SyncandMarkReadfeatureEnabled",
    ],
    (data) => {
      if (chrome.runtime.lastError) return;
      Log("applyAndColorBordersForTopTrendingMangas()");
      mangasToColor.forEach((bookmark) => {
        if (!bookmark || !bookmark.title || !bookmark.status) return;

        const status = bookmark.status.trim().toLowerCase();
        const element = [...document.querySelectorAll("#top-trending .swiper-inner .info .above a")].find(
          (el) => el.textContent.trim() === bookmark.title
        );
        
        if (element) {
          var borderColor = "transparent";
          var borderStyle = "solid";
          const borderSize = data.CustomBorderSize || 4;
          
          if (status.includes("reading")) {
            borderColor = "green";
          } else if (status.includes("dropped")) {
            borderColor = "darkred";
          } else if (status.includes("completed")) {
            borderColor = "blue";
          } else if (status.includes("on-hold") || status.includes("hold")) {
            borderColor = "orange";
          } else if (status.includes("plan to read")) {
            borderColor = "lightgreen";
          } else if (status.includes("read") && data.SyncandMarkReadfeatureEnabled) {
            borderColor = "grey";
          }

          if (data.CustomBookmarksfeatureEnabled) {
            const customBookmarks = data.customBookmarks || [];
            customBookmarks.forEach((custombookmark) => {
              if (custombookmark.name && status.includes(custombookmark.name.toLowerCase())) {
                borderColor = custombookmark.color;
                borderStyle = custombookmark.style || "solid";
              }
            });
          }

          const target = element.closest(".info");
          if (target) {
            if (data.CustomBorderSizefeatureEnabled) {
              target.style.setProperty("border-left", `${borderSize}px ${borderStyle} ${borderColor}`, "important");
            } else {
              target.style.setProperty("border-left", `4px solid ${borderColor}`, "important");
            }
          }
        }
      });
    }
  );
}

// Main initialization on page load
window.addEventListener("load", () => {
  if (!chrome.runtime?.id) return;

  if (window.location.pathname === "/home") {
    chrome.storage.local.get(
      ["MarkHomePagefeatureEnabled"],
      (data) => {
        if (data.MarkHomePagefeatureEnabled) {
          applyContainerStylesHomePageOnLoad();
          applyContainerStylesHomePage();
        }
      }
    );
   
    
    

    var mostViewedTab = document.getElementsByClassName(
      "trending-button-next"
    )[0];
    mostViewedTab.addEventListener("click", applyContainerStylesHomePage);
    mostViewedTab = document.getElementsByClassName("trending-button-prev")[0];
    mostViewedTab.addEventListener("click", applyContainerStylesHomePage);
    const tabs = document.querySelectorAll(".tabs");
    tabs.forEach((tab) => {
      tab.addEventListener("click", applyContainerStylesHomePage);
    });
    //second part
    
  } else {
    applyContainerStyles();
  }

  // Capture reading history if on a reader page
  if (window.location.pathname.startsWith("/read/")) {
    getReadChapters();
    const currentUrl = window.location.href;
    if (!chrome.runtime?.id) return;
    chrome.storage.local.get(["userbookmarkshistory"], (data) => {
      if (chrome.runtime.lastError) return;
      let history = data.userbookmarkshistory || [];
      // Remove if already exists to move to top
      history = history.filter(url => url !== currentUrl);
      // Add to front
      history.unshift(currentUrl);
      // Keep only 10
      if (history.length > 10) history = history.slice(0, 10);
      
      chrome.storage.local.set({ userbookmarkshistory: history }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    });
  }
});

/**
 * Sends log messages to the background script for debugging.
 * @param {string|Object} txt - The message to log.
 */
function Log(txt) {
  if (!chrome.runtime?.id) return; // Prevent "Extension context invalidated" error
  
  const text = typeof txt === "object" ? JSON.stringify(txt) : txt;
  chrome.runtime.sendMessage({ type: "log", text: text }, () => {
    if (chrome.runtime.lastError) { /* ignore */ }
  });
}

// Observe URL changes for SPA navigation (MangaFire reader)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (!chrome.runtime?.id) return; // Prevent "Extension context invalidated" error

  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.pathname.startsWith("/read/")) {
      Log("SPA Navigation detected, capturing chapter in 500ms...");
      setTimeout(getReadChapters, 500); // Small delay to ensure URL is fully updated
    }
  }
});
urlObserver.observe(document, { subtree: true, childList: true });

/**
 * Creates a promise that resolves when a matching message is received.
 * @param {Function} filterFn - Function to filter messages.
 * @returns {Promise<Object>} Resolves with the matching message.
 */
function waitForMessage(filterFn) {
  return new Promise((resolve) => {
    function handler(msg, sender, sendResponse) {
      if (!filterFn || filterFn(msg, sender)) {
        chrome.runtime.onMessage.removeListener(handler);
        resolve(msg);
      }
    }
    chrome.runtime.onMessage.addListener(handler);
  });
}

/**
 * Checks if automatic sync is due and triggers bookmark scraping if needed.
 */
function autoSync() {
  if (!chrome.runtime?.id) return;
  chrome.storage.local.get(
    ["AutoSyncfeatureEnabled", "SyncLastDate", "SyncEverySetDate"],
    (data) => {
      if (chrome.runtime.lastError) return;
      datebool = data.AutoSyncfeatureEnabled ?? false;
      if (datebool) {
        if (
          Date.now() - data.SyncLastDate >=
          data.SyncEverySetDate * 24 * 60 * 60 * 1000
        ) {
          chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
          });
        }
      }
    }
  );
}
