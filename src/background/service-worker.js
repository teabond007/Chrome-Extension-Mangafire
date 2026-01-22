/**
 * Background Service Worker
 * 
 * Handles extension lifecycle events, alarms, and message passing.
 * This is the central coordinator for background tasks including bookmark scraping.
 */

// Track scraping tabs so we can close them
let scrapingTabId = null;

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[MangaManager] Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // First-time installation: set default settings
        chrome.storage.local.set({
            extensionEnabled: true,
            NewTabDashboardfeatureEnabled: false,
            AutoSyncfeatureEnabled: false,
            notificationsEnabled: false
        });
    }
});

// Message handler for content scripts, popup, and options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[MangaManager] Message received:', message.type, message);
    
    switch (message.type) {
        // --- Legacy Message Types (used by popup and options) ---
        case 'scrapeBookmarks':
            handleScrapeBookmarks(message.value, sender);
            sendResponse({ status: 'received' });
            return true;
            
        case 'scrapeReadMangas':
            handleScrapeReadMangas(message.value, sender);
            sendResponse({ status: 'received' });
            return true;

        case 'freshSync':
            handleFreshSync(sendResponse);
            return true;
            
        case 'autoSyncEntry':
            // Forward to storage update
            updateEntryProgress(message.title, message.chapter, message.slugWithId, message.readChapters);
            sendResponse({ status: 'received' });
            return true;
            
        case 'bookmarksExtracted':
            // Close the tab that finished scraping
            if (sender.tab && sender.tab.id) {
                chrome.tabs.remove(sender.tab.id).catch(() => {});
            }
            sendResponse({ status: 'received' });
            return true;
            
        case 'log':
            console.log('[Content Script]', message.text);
            sendResponse({ status: 'received' });
            return true;
            
        // --- New Vue-style Message Types ---
        case 'GET_SETTINGS':
            handleGetSettings(sendResponse);
            return true;
            
        case 'UPDATE_READING_PROGRESS':
            handleReadingProgressUpdate(message.data, sendResponse);
            return true;
            
        case 'SYNC_BOOKMARKS':
            handleScrapeBookmarks(1, sender);
            sendResponse({ success: true, message: 'Sync started' });
            return true;
            
        default:
            console.warn('[MangaManager] Unknown message type:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

/**
 * Handles bookmark scraping - opens MangaFire bookmark page and extracts data
 * @param {number} pageValue - Page number (0 = done, 1+ = scrape that page)
 * @param {Object} sender - Message sender info
 */
function handleScrapeBookmarks(pageValue, sender) {
    // Close previous scraping tab if exists
    if (sender && sender.tab && sender.tab.id) {
        chrome.tabs.remove(sender.tab.id).catch(() => {});
    }

    if (pageValue === 0) {
        // Scraping complete - update sync timestamp
        chrome.storage.local.set({ SyncLastDate: Date.now() });
        console.log('[MangaManager] Bookmark sync complete');
        
        // Check if we should also sync reading history
        chrome.storage.local.get('SyncandMarkReadfeatureEnabled', (data) => {
            if (data.SyncandMarkReadfeatureEnabled) {
                console.log('[MangaManager] Starting reading history sync...');
                handleScrapeReadMangas(1, null);
            }
        });
        return;
    }

    // Open the bookmark page and scrape
    const pageUrl = `https://mangafire.to/user/bookmark?page=${pageValue}`;
    console.log('[MangaManager] Opening bookmark page:', pageUrl);
    
    chrome.tabs.create({ url: pageUrl, active: false }, (tab) => {
        if (chrome.runtime.lastError) {
            console.error('[MangaManager] Tab creation error:', chrome.runtime.lastError);
            return;
        }
        
        scrapingTabId = tab.id;
        
        // Wait for page to load then inject scraper
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Inject and execute scraping script
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    args: [pageValue],
                    func: scrapeBookmarksPage
                }).catch(err => {
                    console.error('[MangaManager] Script injection error:', err);
                    chrome.tabs.remove(tab.id).catch(() => {});
                });
            }
        });
    });
}

/**
 * This function runs in the context of the MangaFire page to scrape bookmarks
 * @param {number} pageIdentifier - Current page number
 */
function scrapeBookmarksPage(pageIdentifier) {
    const safeSendMessage = (msg) => {
        try {
            chrome.runtime.sendMessage(msg, () => chrome.runtime.lastError);
        } catch (e) { /* ignore */ }
    };

    safeSendMessage({ type: "log", text: "Scraping bookmark page " + pageIdentifier });
    const bookmarks = [];
    const container = document.querySelector(".original.card-xs");

    if (!container) {
        safeSendMessage({ type: "log", text: "Container not found. Are you logged into MangaFire?" });
        safeSendMessage({ type: "scrapeBookmarks", value: 0 });
        return;
    }

    const mangaDivs = container.querySelectorAll(":scope > div");
    
    if (mangaDivs.length === 0) {
        safeSendMessage({ type: "log", text: "No more bookmarks found, sync complete" });
        safeSendMessage({ type: "scrapeBookmarks", value: 0 });
        return;
    }

    mangaDivs.forEach((item) => {
        const inner = item.querySelector(".inner");
        if (inner) {
            const title = inner.querySelector(".info a");
            const statusBtn = inner.querySelector(".info .dropdown.width-limit.favourite button");

            if (title && statusBtn) {
                bookmarks.push({
                    title: title.textContent.trim(),
                    status: statusBtn.textContent.trim(),
                });
            }
        }
    });

    safeSendMessage({ type: "log", text: `Scraped ${bookmarks.length} bookmarks from page ${pageIdentifier}` });
    
    // Merge with existing bookmarks
    chrome.storage.local.get("userBookmarks", (data) => {
        const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
        const combined = existing.concat(bookmarks);
        chrome.storage.local.set({ userBookmarks: combined }, () => {
            safeSendMessage({ type: "log", text: `Total bookmarks: ${combined.length}` });
            // Request next page
            safeSendMessage({ type: "scrapeBookmarks", value: pageIdentifier + 1 });
        });
    });
}

/**
 * Handles reading history scraping
 * @param {number} pageValue - Page number (0 = done, 1+ = scrape that page)
 * @param {Object} sender - Message sender info
 */
function handleScrapeReadMangas(pageValue, sender) {
    if (sender && sender.tab && sender.tab.id) {
        chrome.tabs.remove(sender.tab.id).catch(() => {});
    }

    if (pageValue === 0) {
        console.log('[MangaManager] Reading history sync complete');
        return;
    }

    const pageUrl = `https://mangafire.to/user/reading?page=${pageValue}`;
    console.log('[MangaManager] Opening reading page:', pageUrl);
    
    chrome.tabs.create({ url: pageUrl, active: false }, (tab) => {
        if (chrome.runtime.lastError) {
            console.error('[MangaManager] Tab creation error:', chrome.runtime.lastError);
            return;
        }
        
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    args: [pageValue],
                    func: scrapeReadingPage
                }).catch(err => {
                    console.error('[MangaManager] Script injection error:', err);
                    chrome.tabs.remove(tab.id).catch(() => {});
                });
            }
        });
    });
}

/**
 * This function runs in the context of the MangaFire page to scrape reading history
 * @param {number} pageIdentifier - Current page number
 */
function scrapeReadingPage(pageIdentifier) {
    const safeSendMessage = (msg) => {
        try {
            chrome.runtime.sendMessage(msg, () => chrome.runtime.lastError);
        } catch (e) { /* ignore */ }
    };

    const ReadMangas = [];
    const mangaDivs = document.querySelectorAll(".inner .info");
    
    if (mangaDivs.length === 0) {
        safeSendMessage({ type: "scrapeReadMangas", value: 0 });
        return;
    }

    mangaDivs.forEach((item) => {
        const titleEl = item.querySelector("a");
        if (titleEl) {
            const title = titleEl.textContent.trim();
            if (title) {
                ReadMangas.push({ title, status: "Read" });
            }
        }
    });

    chrome.storage.local.get("userBookmarks", (data) => {
        const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
        const map = new Map(ReadMangas.map((item) => [item.title.toLowerCase(), item]));
        existing.forEach((item) => map.set(item.title.toLowerCase(), item));
        const merged = Array.from(map.values());

        chrome.storage.local.set({ userBookmarks: merged }, () => {
            safeSendMessage({ type: "scrapeReadMangas", value: pageIdentifier + 1 });
        });
    });
}

/**
 * Handles fresh sync - clears and rebuilds library
 * @param {Function} sendResponse - Response callback
 */
async function handleFreshSync(sendResponse) {
    try {
        console.log('[MangaManager] Fresh sync started - clearing userBookmarks');
        await chrome.storage.local.remove('userBookmarks');
        handleScrapeBookmarks(1, null);
        sendResponse({ success: true, message: 'Fresh sync started' });
    } catch (error) {
        console.error('[MangaManager] Fresh sync error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Updates entry progress when user reads a chapter
 */
function updateEntryProgress(title, chapter, slugWithId, readChaptersCount) {
    chrome.storage.local.get(['savedEntriesMerged'], (data) => {
        let savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
        const slugify = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const currentSlug = slugWithId ? slugWithId.split('.')[0] : slugify(title);
        
        let entryIndex = savedEntries.findIndex(e => {
            const entryTitle = e.title.toLowerCase();
            const entrySlug = e.mangaSlug ? e.mangaSlug.split('.')[0] : slugify(e.title);
            return entryTitle === title.toLowerCase() || entrySlug === currentSlug;
        });
        
        if (entryIndex !== -1) {
            savedEntries[entryIndex].lastRead = Date.now();
            savedEntries[entryIndex].lastChapterRead = chapter;
            savedEntries[entryIndex].readChapters = readChaptersCount || savedEntries[entryIndex].readChapters;
            if (slugWithId) savedEntries[entryIndex].mangaSlug = slugWithId;
            chrome.storage.local.set({ savedEntriesMerged: savedEntries });
        }
    });
}

/**
 * Retrieves current settings from storage
 * @param {Function} sendResponse - Response callback
 */
async function handleGetSettings(sendResponse) {
    try {
        const settings = await chrome.storage.local.get([
            'extensionEnabled',
            'NewTabDashboardfeatureEnabled',
            'AutoSyncfeatureEnabled'
        ]);
        sendResponse({ success: true, data: settings });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Updates reading progress for a manga entry
 * @param {Object} data - Progress update data
 * @param {Function} sendResponse - Response callback
 */
async function handleReadingProgressUpdate(data, sendResponse) {
    try {
        const { libraryEntries } = await chrome.storage.local.get('libraryEntries');
        const entries = libraryEntries || {};
        
        if (entries[data.id]) {
            entries[data.id] = {
                ...entries[data.id],
                lastChapter: data.chapter,
                lastReadAt: Date.now(),
                lastReadUrl: data.url
            };
            await chrome.storage.local.set({ libraryEntries: entries });
        }
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

console.log('[MangaManager] Background service worker initialized');
