/**
 * @fileoverview Webtoons Content Script
 * Handles border highlighting for saved webtoons and episode reading history tracking.
 * Part of the Bookmarks Marker/Highlighter Chrome Extension.
 * 
 * ToS Compliance: This script only enhances the user's current browsing experience
 * by reading DOM elements they are actively viewing. No scraping or data harvesting.
 */

/** Namespace prefix for webtoon episodes in storage */
const WEBTOON_PREFIX = 'webtoon:';

/**
 * Extracts webtoon info from a URL.
 * @param {string} href - The URL to parse.
 * @returns {{titleNo: string, slug: string, episodeNo: string|null}} Parsed URL components.
 */
function extractWebtoonInfoFromUrl(href) {
  if (!href) return { titleNo: '', slug: '', episodeNo: null };

  // Extract title_no from query params
  const urlObj = new URL(href, window.location.origin);
  const titleNo = urlObj.searchParams.get('title_no') || '';
  const episodeNo = urlObj.searchParams.get('episode_no') || null;

  // Extract slug from path: /en/{genre}/{slug}/...
  const pathMatch = href.match(/\/en\/[^\/]+\/([^\/]+)/);
  const slug = pathMatch ? pathMatch[1] : '';

  return { titleNo, slug, episodeNo };
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
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Finds all webtoon cards on the current page.
 * Handles homepage, originals, canvas, and other listing pages.
 * @returns {Array<{element: Element, title: string, titleNo: string, slug: string, cardType: string}>}
 */
function findWebtoonCards() {
  const results = [];
  const processedElements = new Set();

  // Card selector patterns for different page sections
  const cardPatterns = [
    // Homepage trending carousel
    { selector: 'a.link._trending_title_a', cardType: 'trending' },
    // Originals daily grid
    { selector: 'a.link._originals_title_a', cardType: 'originals' },
    // Canvas page
    { selector: 'a.link._canvas_title_a', cardType: 'canvas' },
    // Generic webtoon cards (search results, recommendations)
    { selector: 'a[href*="/list?title_no="]', cardType: 'generic' },
    // Ranking page cards
    { selector: '.ranking_lst a[href*="title_no"]', cardType: 'ranking' }
  ];

  cardPatterns.forEach(({ selector, cardType }) => {
    document.querySelectorAll(selector).forEach(card => {
      // Skip if already processed
      if (processedElements.has(card)) return;
      processedElements.add(card);

      const href = card.href || '';
      const { titleNo, slug } = extractWebtoonInfoFromUrl(href);

      // Find title - usually in a <strong> or <span> element
      const titleElement = card.querySelector('strong') || 
                          card.querySelector('.subj') ||
                          card.querySelector('span.title');
      const title = titleElement?.textContent?.trim() || '';

      if (title || titleNo) {
        results.push({
          element: card,
          title,
          titleNo,
          slug,
          cardType
        });
      }
    });
  });

  return results;
}

/**
 * Matches page webtoons with saved bookmarks.
 * @param {Array} pageWebtoons - Array of webtoon info from the page.
 * @param {Function} callback - Receives matched data.
 */
function crossReferenceBookmarks(pageWebtoons, callback) {
  if (!chrome.runtime?.id) return;

  chrome.storage.local.get(['savedEntriesMerged', 'userBookmarks', 'savedReadChapters'], (data) => {
    if (chrome.runtime.lastError) return;

    const savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
    const userBookmarks = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
    const readChapters = data.savedReadChapters || {};

    // Build lookup maps by normalized title
    const bookmarksMap = new Map();
    userBookmarks.forEach(b => {
      if (b?.title) bookmarksMap.set(normalizeTitle(b.title), b);
    });
    savedEntries.forEach(b => {
      if (b?.title) bookmarksMap.set(normalizeTitle(b.title), b);
    });

    // Match page webtoons with bookmarks
    const matched = [];
    pageWebtoons.forEach(pageWebtoon => {
      const normalizedTitle = normalizeTitle(pageWebtoon.title);
      let bookmark = bookmarksMap.get(normalizedTitle);

      // Try matching by slug/title variations if direct match fails
      if (!bookmark && pageWebtoon.slug) {
        const slugAsTitle = pageWebtoon.slug.replace(/-/g, ' ');
        bookmark = bookmarksMap.get(normalizeTitle(slugAsTitle));
      }

      if (bookmark) {
        // Find reading history with webtoon namespace
        const historyKey = findHistoryKey(pageWebtoon.title, pageWebtoon.slug, readChapters);
        const episodes = historyKey ? readChapters[historyKey] : [];

        matched.push({
          pageData: pageWebtoon,
          bookmark,
          readEpisodes: episodes,
          totalEpisodes: bookmark.chapters || null
        });
      }
    });

    callback(matched);
  });
}

/**
 * Finds the matching key in reading history for a webtoon.
 * @param {string} title - The webtoon title.
 * @param {string} slug - The webtoon URL slug.
 * @param {Object} readChapters - The savedReadChapters object.
 * @returns {string|null} The matching key or null.
 */
function findHistoryKey(title, slug, readChapters) {
  if (!readChapters) return null;

  // Try webtoon-namespaced key first
  const namespacedKey = `${WEBTOON_PREFIX}${slug}`;
  if (readChapters[namespacedKey]) return namespacedKey;

  // Try title-based keys
  if (readChapters[title]) return title;

  // Normalized match
  const normalizedTarget = normalizeTitle(title);
  for (const key of Object.keys(readChapters)) {
    if (normalizeTitle(key) === normalizedTarget) return key;
    if (key.startsWith(WEBTOON_PREFIX) && normalizeTitle(key.replace(WEBTOON_PREFIX, '').replace(/-/g, ' ')) === normalizedTarget) {
      return key;
    }
  }

  return null;
}

/**
 * Gets the highest episode number from a list of episode strings.
 * @param {Array<string>} episodes - Array of episode identifiers.
 * @returns {number} The highest episode number found, or 0.
 */
function getHighestEpisode(episodes) {
  if (!episodes || episodes.length === 0) return 0;

  let highest = 0;
  episodes.forEach(ep => {
    const num = parseInt(String(ep), 10);
    if (!isNaN(num) && num > highest) highest = num;
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
 * Creates a progress badge element for webtoon cards.
 * @param {number} currentEpisode - Highest read episode.
 * @param {number|null} totalEpisodes - Total episodes if known.
 * @returns {HTMLElement} The badge element.
 */
function createProgressBadge(currentEpisode, totalEpisodes) {
  const badge = document.createElement('div');
  badge.className = 'webtoon-progress-badge';

  const text = totalEpisodes
    ? `Ep. ${currentEpisode}/${totalEpisodes}`
    : `Ep. ${currentEpisode}`;

  badge.textContent = text;
  badge.style.cssText = `
    position: absolute;
    top: 4px;
    right: 4px;
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
 * Applies colored borders and progress badges to matched webtoon cards.
 * @param {Array} matchedWebtoons - Array of matched webtoon data.
 */
function applyBorders(matchedWebtoons) {
  if (!chrome.runtime?.id) return;

  chrome.storage.local.get([
    'CustomBookmarksfeatureEnabled',
    'customBookmarks',
    'WebtoonsBorderSizefeatureEnabled',
    'WebtoonsBorderSize',
    'SyncandMarkReadfeatureEnabled',
    'WebtoonsShowProgress'
  ], (settings) => {
    if (chrome.runtime.lastError) return;

    // Use webtoons-specific border size if enabled, otherwise fall back to default
    const borderSize = settings.WebtoonsBorderSizefeatureEnabled
      ? (settings.WebtoonsBorderSize || 4)
      : 4;

    const showProgress = settings.WebtoonsShowProgress !== false;

    matchedWebtoons.forEach(({ pageData, bookmark, readEpisodes, totalEpisodes }) => {
      if (!bookmark?.status) return;

      const { color, style } = getBorderStyle(bookmark.status, settings);
      if (color === 'transparent') return;

      const element = pageData.element;
      if (!element) return;

      // Find the best element to apply border to (parent li or the element itself)
      // Webtoons uses <li> containers for cards, border looks better on the li
      const targetElement = element.closest('li') || element;

      // Apply border to the target element
      targetElement.style.setProperty('border', `${borderSize}px ${style} ${color}`, 'important');
      targetElement.style.setProperty('border-radius', '8px', 'important');
      targetElement.style.setProperty('position', 'relative', 'important');
      targetElement.style.setProperty('overflow', 'hidden', 'important');

      // Add progress badge if enabled and has reading history
      if (showProgress && readEpisodes && readEpisodes.length > 0) {
        const highestEpisode = getHighestEpisode(readEpisodes);
        if (highestEpisode > 0) {
          // Remove existing badge if any
          const existingBadge = targetElement.querySelector('.webtoon-progress-badge');
          if (existingBadge) existingBadge.remove();

          const badge = createProgressBadge(highestEpisode, totalEpisodes);
          targetElement.appendChild(badge);
        }
      }

      // Mark both as processed to avoid re-processing
      element.dataset.bookmarkProcessed = 'true';
      targetElement.dataset.bookmarkProcessed = 'true';
    });
  });
}

/**
 * Main entry point for applying styles to Webtoons pages.
 */
function applyWebtoonsStyles() {
  if (!chrome.runtime?.id) return;

  // Check if Webtoons highlighting is enabled
  chrome.storage.local.get(['WebtoonsHighlightfeatureEnabled'], (data) => {
    if (chrome.runtime.lastError) return;

    // Default to true if not set
    if (data.WebtoonsHighlightfeatureEnabled === false) {
      Log('Webtoons highlighting disabled');
      return;
    }

    const cards = findWebtoonCards().filter(card =>
      !card.element.dataset.bookmarkProcessed
    );

    if (cards.length === 0) return;

    Log(`Found ${cards.length} unprocessed webtoon cards`);

    crossReferenceBookmarks(cards, (matched) => {
      if (matched.length > 0) {
        applyBorders(matched);
        Log(`Applied borders to ${matched.length} webtoons`);
      }
    });
  });
}

/**
 * Saves the current episode to reading history.
 * Only runs on viewer pages (episode reader).
 */
function getReadEpisodes() {
  if (!chrome.runtime?.id) return;

  const href = window.location.href;
  if (!href.includes('/viewer')) return;

  const { titleNo, slug, episodeNo } = extractWebtoonInfoFromUrl(href);
  if (!slug || !episodeNo) return;

  // Get webtoon title from the page header
  const titleElement = document.querySelector('.subj_info .subj') ||
                       document.querySelector('h1.subj') ||
                       document.querySelector('.viewer_header .subj_info a');
  const title = titleElement?.textContent?.trim() || slug.replace(/-/g, ' ');

  // Use namespaced key for storage
  const storageKey = `${WEBTOON_PREFIX}${slug}`;

  chrome.storage.local.get(['savedReadChapters'], (data) => {
    if (chrome.runtime.lastError) return;

    let history = data.savedReadChapters || {};
    let isNewEpisode = false;

    if (!history[storageKey]) {
      history[storageKey] = [];
    }

    // Only add if it's a new episode
    if (!history[storageKey].includes(episodeNo)) {
      history[storageKey].push(episodeNo);
      isNewEpisode = true;
    }

    const historyCount = history[storageKey].length;

    // Notify background to update lastRead timestamp
    chrome.runtime.sendMessage({
      type: 'autoSyncEntry',
      title: title,
      chapter: episodeNo,
      slugWithId: `webtoon-${slug}-${titleNo}`,
      readChapters: historyCount,
      source: 'webtoons'
    }, () => {
      if (chrome.runtime.lastError) return;
    });

    if (isNewEpisode) {
      chrome.storage.local.set({ savedReadChapters: history }, () => {
        if (chrome.runtime.lastError) return;
        Log(`Saved episode ${episodeNo} for ${title} to history`);
      });
    }
  });
}

/**
 * Sends log messages to the background script for debugging.
 * @param {string|Object} txt - The message to log.
 */
function Log(txt) {
  if (!chrome.runtime?.id) return;

  const text = typeof txt === 'object' ? JSON.stringify(txt) : txt;
  chrome.runtime.sendMessage({ type: 'log', text: `[Webtoons] ${text}` }, () => {
    if (chrome.runtime.lastError) { /* ignore */ }
  });
}

// Initialize on page load
window.addEventListener('load', () => {
  if (!chrome.runtime?.id) return;

  Log('Webtoons content script loaded');

  // Initial pass after DOM settles
  setTimeout(applyWebtoonsStyles, 500);

  // Track reading history on viewer pages
  if (window.location.href.includes('/viewer')) {
    getReadEpisodes();
  }

  // Handle dynamically loaded content with MutationObserver
  const observer = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
    if (hasNewNodes) {
      applyWebtoonsStyles();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Handle SPA navigation
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

    setTimeout(applyWebtoonsStyles, 500);

    // Track reading history if on viewer page
    if (location.href.includes('/viewer')) {
      setTimeout(getReadEpisodes, 500);
    }
  }
});
urlObserver.observe(document, { subtree: true, childList: true });
