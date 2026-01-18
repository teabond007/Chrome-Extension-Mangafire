/**
 * @fileoverview MangaDex Content Script
 * Handles border highlighting for saved manga on MangaDex pages.
 * Part of the Bookmarks Marker/Highlighter Chrome Extension.
 */

/**
 * Extracts manga UUID from MangaDex URL.
 * @param {string} href - URL containing /title/{uuid}/...
 * @returns {string|null} The UUID or null if not found.
 */
function extractMangaUUID(href) {
  if (!href) return null;
  const match = href.match(/\/title\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

/**
 * Extracts manga title from a card element.
 * @param {Element} card - The manga card container element.
 * @param {string} cardType - 'hchaptercard' or 'manga-card'.
 * @returns {string} The manga title or empty string.
 */
function extractMangaTitle(card, cardType) {
  let titleElement;
  
  if (cardType === 'hchaptercard') {
    // Homepage "Latest Updates" cards
    titleElement = card.querySelector('a[href*="/title/"] h6');
  } else {
    // Browse/Search page cards
    titleElement = card.querySelector('a.title span') || 
                   card.querySelector('a.title');
  }
  
  return titleElement?.textContent?.trim() || '';
}

/**
 * Finds all manga cards on the current MangaDex page.
 * @returns {Array<{element: Element, title: string, uuid: string, cardType: string}>}
 */
function findMangaCards() {
  const results = [];
  
  // Homepage "Latest Updates" cards (.hchaptercard)
  document.querySelectorAll('.hchaptercard').forEach(card => {
    const link = card.querySelector('a[href*="/title/"]');
    if (link) {
      const uuid = extractMangaUUID(link.href);
      const title = extractMangaTitle(card, 'hchaptercard');
      if (title || uuid) {
        results.push({ element: card, title, uuid, cardType: 'hchaptercard' });
      }
    }
  });
  
  // Browse/Search page cards (.manga-card)
  document.querySelectorAll('.manga-card').forEach(card => {
    const link = card.querySelector('a[href*="/title/"]');
    if (link) {
      const uuid = extractMangaUUID(link.href);
      const title = extractMangaTitle(card, 'manga-card');
      if (title || uuid) {
        results.push({ element: card, title, uuid, cardType: 'manga-card' });
      }
    }
  });
  
  return results;
}

/**
 * Normalizes a title for fuzzy matching.
 * @param {string} title - Title to normalize.
 * @returns {string} Normalized lowercase title.
 */
function normalizeTitle(title) {
  if (!title) return '';
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Matches page manga with saved bookmarks.
 * @param {Array} pageMangas - Array of {element, title, uuid, cardType}.
 * @param {Function} callback - Receives matched data and reading history.
 */
function crossReferenceBookmarks(pageMangas, callback) {
  if (!chrome.runtime?.id) return;
  
  chrome.storage.local.get(['savedEntriesMerged', 'userBookmarks', 'savedReadChapters'], (data) => {
    if (chrome.runtime.lastError) return;
    
    // Build lookup maps for saved entries
    const savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
    const userBookmarks = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
    const readChapters = data.savedReadChapters || {};
    
    // Merge bookmarks, preferring savedEntriesMerged
    const bookmarksMap = new Map();
    userBookmarks.forEach(b => {
      if (b?.title) bookmarksMap.set(normalizeTitle(b.title), b);
    });
    savedEntries.forEach(b => {
      if (b?.title) bookmarksMap.set(normalizeTitle(b.title), b);
    });
    
    // Also index by mangadexId if available
    const byMangadexId = new Map();
    [...userBookmarks, ...savedEntries].forEach(b => {
      if (b?.mangadexId) byMangadexId.set(b.mangadexId, b);
    });
    
    // Match page mangas with bookmarks
    const matched = [];
    pageMangas.forEach(pageManga => {
      // Try matching by MangaDex UUID first
      let bookmark = byMangadexId.get(pageManga.uuid);
      
      // Fallback to title matching
      if (!bookmark && pageManga.title) {
        bookmark = bookmarksMap.get(normalizeTitle(pageManga.title));
      }
      
      if (bookmark) {
        // Find reading history for this manga
        const historyKey = findHistoryKey(bookmark.title, readChapters);
        const chapters = historyKey ? readChapters[historyKey] : [];
        
        matched.push({ 
          pageData: pageManga, 
          bookmark,
          readChapters: chapters,
          totalChapters: bookmark.chapters || null
        });
      }
    });
    
    callback(matched);
  });
}

/**
 * Finds the matching key in reading history for a manga title.
 * @param {string} title - The manga title to find.
 * @param {Object} readChapters - The savedReadChapters object.
 * @returns {string|null} The matching key or null.
 */
function findHistoryKey(title, readChapters) {
  if (!title || !readChapters) return null;
  
  // Direct match
  if (readChapters[title]) return title;
  
  // Normalized match
  const normalizedTarget = normalizeTitle(title);
  for (const key of Object.keys(readChapters)) {
    if (normalizeTitle(key) === normalizedTarget) {
      return key;
    }
  }
  
  return null;
}

/**
 * Gets the highest chapter number from a list of chapter strings.
 * @param {Array<string>} chapters - Array of chapter identifiers.
 * @returns {number} The highest chapter number found, or 0.
 */
function getHighestChapter(chapters) {
  if (!chapters || chapters.length === 0) return 0;
  
  let highest = 0;
  chapters.forEach(ch => {
    // Extract numeric part from chapter string (e.g., "123" from "123" or "123.5")
    const match = String(ch).match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highest) highest = num;
    }
  });
  
  return highest;
}

/**
 * Determines border color based on bookmark status.
 * @param {string} status - The bookmark status.
 * @param {Object} settings - Storage settings object.
 * @returns {{color: string, style: string}} Border color and style.
 */
function getBorderStyle(status, settings) {
  const normalizedStatus = status?.trim().toLowerCase() || '';
  let borderColor = 'transparent';
  let borderStyle = 'solid';
  
  // Standard status matching
  if (normalizedStatus.includes('reading')) {
    borderColor = 'green';
  } else if (normalizedStatus.includes('dropped')) {
    borderColor = 'darkred';
  } else if (normalizedStatus.includes('completed')) {
    borderColor = 'blue';
  } else if (normalizedStatus.includes('on-hold') || normalizedStatus.includes('hold')) {
    borderColor = 'orange';
  } else if (normalizedStatus.includes('plan to read')) {
    borderColor = 'lightgreen';
  } else if (normalizedStatus.includes('read') && settings.SyncandMarkReadfeatureEnabled) {
    borderColor = 'grey';
  }
  
  // Custom bookmark overrides
  if (settings.CustomBookmarksfeatureEnabled) {
    const customBookmarks = settings.customBookmarks || [];
    customBookmarks.forEach(custom => {
      if (custom.name && normalizedStatus.includes(custom.name.toLowerCase())) {
        borderColor = custom.color;
        borderStyle = custom.style || 'solid';
      }
    });
  }
  
  return { color: borderColor, style: borderStyle };
}

/**
 * Creates a progress badge element.
 * @param {number} currentChapter - Highest read chapter.
 * @param {number|null} totalChapters - Total chapters if known.
 * @returns {HTMLElement} The badge element.
 */
function createProgressBadge(currentChapter, totalChapters) {
  const badge = document.createElement('div');
  badge.className = 'mangadex-progress-badge';
  
  const text = totalChapters 
    ? `Ch. ${currentChapter}/${totalChapters}`
    : `Ch. ${currentChapter}`;
  
  badge.textContent = text;
  badge.style.cssText = `
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 4px;
    z-index: 10;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  return badge;
}

/**
 * Applies colored borders and progress badges to matched manga cards.
 * @param {Array} matchedMangas - Array of matched manga data.
 */
function applyBorders(matchedMangas) {
  if (!chrome.runtime?.id) return;
  
  chrome.storage.local.get([
    'CustomBookmarksfeatureEnabled',
    'customBookmarks',
    'CustomBorderSizefeatureEnabled',
    'CustomBorderSize',
    'SyncandMarkReadfeatureEnabled',
    'MangaDexShowProgress'
  ], (settings) => {
    if (chrome.runtime.lastError) return;
    
    const borderSize = settings.CustomBorderSizefeatureEnabled 
      ? (settings.CustomBorderSize || 4) 
      : 4;
    
    // Default to true if not set
    const showProgress = settings.MangaDexShowProgress !== false;
    
    matchedMangas.forEach(({ pageData, bookmark, readChapters, totalChapters }) => {
      if (!bookmark?.status) return;
      
      const { color, style } = getBorderStyle(bookmark.status, settings);
      if (color === 'transparent') return;
      
      const element = pageData.element;
      if (!element) return;
      
      // Apply border based on card type
      let coverContainer;
      if (pageData.cardType === 'hchaptercard') {
        // Homepage cards - apply to the cover image container
        coverContainer = element.querySelector('a[href*="/title/"]');
        if (coverContainer) {
          coverContainer.style.setProperty('border', `${borderSize}px ${style} ${color}`, 'important');
          coverContainer.style.setProperty('border-radius', '8px', 'important');
          coverContainer.style.setProperty('position', 'relative', 'important');
        }
      } else {
        // Browse page cards - apply to the card itself
        coverContainer = element.querySelector('.manga-card-cover') || element;
        coverContainer.style.setProperty('border', `${borderSize}px ${style} ${color}`, 'important');
        coverContainer.style.setProperty('border-radius', '8px', 'important');
        coverContainer.style.setProperty('position', 'relative', 'important');
      }
      
      // Add progress badge if enabled and has reading history
      if (showProgress && readChapters && readChapters.length > 0 && coverContainer) {
        const highestChapter = getHighestChapter(readChapters);
        if (highestChapter > 0) {
          // Remove existing badge if any
          const existingBadge = coverContainer.querySelector('.mangadex-progress-badge');
          if (existingBadge) existingBadge.remove();
          
          const badge = createProgressBadge(highestChapter, totalChapters);
          coverContainer.appendChild(badge);
        }
      }
      
      // Mark as processed
      element.dataset.bookmarkProcessed = 'true';
    });
  });
}

/**
 * Main entry point for applying styles to MangaDex pages.
 */
function applyMangaDexStyles() {
  if (!chrome.runtime?.id) return;
  
  // Check if MangaDex highlighting is enabled
  chrome.storage.local.get(['MangaDexHighlightEnabled'], (data) => {
    if (chrome.runtime.lastError) return;
    
    // Default to true if not set
    if (data.MangaDexHighlightEnabled === false) {
      Log('MangaDex highlighting disabled');
      return;
    }
    
    const cards = findMangaCards().filter(card => 
      !card.element.dataset.bookmarkProcessed
    );
    
    if (cards.length === 0) return;
    
    crossReferenceBookmarks(cards, (matched) => {
      if (matched.length > 0) {
        applyBorders(matched);
        Log(`Applied borders to ${matched.length} manga on MangaDex`);
      }
    });
  });
}

/**
 * Sends log messages to the background script for debugging.
 * @param {string|Object} txt - The message to log.
 */
function Log(txt) {
  if (!chrome.runtime?.id) return;
  
  const text = typeof txt === 'object' ? JSON.stringify(txt) : txt;
  chrome.runtime.sendMessage({ type: 'log', text: `[MangaDex] ${text}` }, () => {
    if (chrome.runtime.lastError) { /* ignore */ }
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  if (!chrome.runtime?.id) return;
  
  Log('MangaDex content script loaded');
  
  // Initial pass
  setTimeout(applyMangaDexStyles, 500);
  
  // Handle dynamically loaded content with MutationObserver
  const observer = new MutationObserver((mutations) => {
    // Only process if new nodes were added
    const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
    if (hasNewNodes) {
      applyMangaDexStyles();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Also handle SPA-style navigation
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (!chrome.runtime?.id) return;
  
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    Log('URL changed, re-applying styles...');
    // Reset processed flags for new page
    document.querySelectorAll('[data-bookmark-processed]').forEach(el => {
      delete el.dataset.bookmarkProcessed;
    });
    setTimeout(applyMangaDexStyles, 500);
  }
});
urlObserver.observe(document, { subtree: true, childList: true });
