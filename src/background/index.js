/**
 * @fileoverview Background Service Worker for Bookmarks Marker/Highlighter Extension
 * Acts as central message router and orchestrates site-specific scrapers.
 */

import { 
  scrapeBookmarksFromUnopenedTab, 
  scrapeReadMangasFromUnopenedTab, 
  handleAutoSyncEntry 
} from '../scripts/content/adapters/mangafire/scraper';

// Open options page when extension icon clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html") });
});

/**
 * Central message listener that routes messages to appropriate handlers.
 * Supports MangaFire scraping operations and auto-sync functionality.
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "scrapeReadMangas") {
    Log("scrapeReadMangas message received");
    if (msg.value === 0) {
      Log("Message received: scrapeReadMangas. msg.value is 0. stopping further execution. everything is OK");
      chrome.storage.local.set({ SyncLastDate: Date.now() });
    } else if (msg.value === 1) {
      Log("Message received: scrapeReadMangas, value: 1");
      Log("Continuing scraping Mangas now scraping Read Mangas");
      scrapeReadMangasFromUnopenedTab(1);
    } else {
      Log(`Message received: scrapeReadMangas, value: ${msg.value}`);
      scrapeReadMangasFromUnopenedTab(msg.value);
    }
  } else if (msg.type === "scrapeBookmarks") {
    if (msg.value === 0) {
      Log("Message received: scrapeBookmarks. msg.value is 0. stopping further execution. everything is OK");
      chrome.storage.local.get("SyncandMarkReadfeatureEnabled", (data) => {
        if (data.SyncandMarkReadfeatureEnabled || false) {
          scrapeReadMangasFromUnopenedTab(1);
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
  } else if (msg.type === "showMangaDetails") {
    // Open options page with library tab and manga details modal
    // Encode the entry title to find it in storage
    const encodedTitle = encodeURIComponent(msg.title || '');
    chrome.tabs.create({ 
      url: chrome.runtime.getURL(`src/options/options.html#library?showDetails=${encodedTitle}`)
    });
  } else if (msg.type === "bookmarksExtracted") {
    chrome.tabs.remove(sender.tab.id);
    Log("Tab closed after scraping");
  }
  
  // Mandatory response to prevent "The message port closed before a response was received"
  sendResponse({ status: "received" });
  return true; 
});

/**
 * Logs messages via the extension's messaging system.
 * @param {string|Object} txt - The message to log.
 */
function Log(txt) {
  const text = typeof txt === "object" ? JSON.stringify(txt) : txt;
  safeSendMessage({ type: "log", text: text });
}

/**
 * Safe wrapper for chrome.runtime.sendMessage to suppress connection errors.
 * @param {Object} message - Message object to send.
 */
function safeSendMessage(message) {
  try {
    if (chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, () => {
        const err = chrome.runtime.lastError;
        if (err && err.message !== "Could not establish connection. Receiving end does not exist.") {
          // Only log real errors
        }
      });
    }
  } catch (e) {
    // Ignore context invalidated errors
  }
}
