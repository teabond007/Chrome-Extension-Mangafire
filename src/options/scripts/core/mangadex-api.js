/**
 * @fileoverview MangaDex API interaction module for the Bookmarks Marker/Highlighter extension.
 * Provides manga search functionality with rate limiting, caching, and retry logic.
 * Used as fallback when AniList API fails to find a manga.
 */

/** @type {string} Base URL for MangaDex API */
const MANGADEX_API_URL = 'https://api.mangadex.org';

/** @type {number} Timestamp of the last successful API request */
let lastRequestTime = 0;

/** @const {number} Minimum interval between requests in milliseconds (MangaDex recommends 500ms) */
const MIN_REQUEST_INTERVAL = 600;

/** @const {number} Maximum retry attempts for failed requests */
const MAX_RETRIES = 2;

/** @const {number} Base delay for exponential backoff */
const RETRY_DELAY_BASE = 2000;

/** @const {number} Cache expiry time in milliseconds (7 days) */
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Utility function to pause execution with optional jitter.
 * @param {number} ms - Milliseconds to sleep.
 * @param {boolean} [useJitter=true] - Add random delay to prevent synchronized retries.
 * @returns {Promise<void>}
 */
function sleep(ms, useJitter = true) {
  const jitter = useJitter ? Math.floor(Math.random() * 300) : 0;
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Normalizes manga titles for better search matching on MangaDex.
 * @param {string} title - Raw manga title.
 * @param {boolean} [aggressive=false] - If true, applies aggressive cleaning.
 * @returns {string} Cleaned title.
 */
function cleanTitle(title, aggressive = false) {
  let cleaned = title
    .replace(/\s*\(.*?\)\s*/g, ' ')  // Remove parenthetical content
    .replace(/\s*\[.*?\]\s*/g, ' ')  // Remove bracketed content
    .replace(/[:\-–—]/g, ' ')        // Replace dashes/colons
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();

  if (aggressive) {
    const noiseWords = [
      /colored/gi, /remake/gi, /full color/gi, /digital/gi,
      /vertical/gi, /scanlation/gi, /official/gi, /ver\./gi,
      /remastered/gi, /raw/gi, /chapter/gi, /ch\.\d+/gi
    ];
    noiseWords.forEach(word => {
      cleaned = cleaned.replace(word, ' ');
    });
    cleaned = cleaned.replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return cleaned;
}

/**
 * Retrieves cached MangaDex data for a title if available and not expired.
 * @param {string} title - Manga title to look up.
 * @returns {Promise<object|null>} Cached data or null if not found/expired.
 */
async function getCachedData(title) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mangadexCache'], (data) => {
      const cache = data.mangadexCache || {};
      const key = title.toLowerCase().trim();
      const entry = cache[key];
      
      if (entry && (Date.now() - entry.timestamp < CACHE_EXPIRY_MS)) {
        resolve(entry.data);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Stores MangaDex data in cache.
 * @param {string} title - Manga title as cache key.
 * @param {object|null} data - Data to cache (null for NOT_FOUND).
 */
async function setCachedData(title, data) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mangadexCache'], (storageData) => {
      const cache = storageData.mangadexCache || {};
      const key = title.toLowerCase().trim();
      
      cache[key] = {
        data: data,
        timestamp: Date.now()
      };
      
      chrome.storage.local.set({ mangadexCache: cache }, resolve);
    });
  });
}

/**
 * Transforms MangaDex API response to match AniList-like data structure.
 * This ensures compatibility with existing library-manager.js code.
 * @param {object} mdManga - Raw MangaDex manga object.
 * @returns {object} Normalized manga data object.
 */
function transformToAnilistFormat(mdManga) {
  const attrs = mdManga.attributes;
  const relationships = mdManga.relationships || [];
  
  // Extract cover art URL - the fileName should be in the relationship attributes
  const coverRel = relationships.find(r => r.type === 'cover_art');
  let coverUrl = null;
  
  if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
    coverUrl = `https://uploads.mangadex.org/covers/${mdManga.id}/${coverRel.attributes.fileName}.256.jpg`;
  } else if (coverRel && coverRel.id) {
    // Fallback: try to use the cover ID directly (less reliable)
    console.log(`[MangaDex] ⚠️ Cover relationship exists but no fileName for ${mdManga.id}`);
  }
  
  // Use placeholder if no cover found
  if (!coverUrl) {
    coverUrl = 'https://mangadex.org/img/avatar.png'; // MangaDex default placeholder
  }

  // Extract author
  const authorRel = relationships.find(r => r.type === 'author');
  const authorName = authorRel?.attributes?.name || 'Unknown';

  // Map MangaDex status to AniList-like status
  const statusMap = {
    'ongoing': 'RELEASING',
    'completed': 'FINISHED',
    'hiatus': 'HIATUS',
    'cancelled': 'CANCELLED'
  };

  // Map content rating / demographic to format
  const formatMap = {
    'shounen': 'MANGA',
    'shoujo': 'MANGA',
    'seinen': 'MANGA',
    'josei': 'MANGA'
  };

  // Determine format from tags
  let format = 'MANGA';
  const tags = attrs.tags || [];
  const formatTag = tags.find(t => ['Manhwa', 'Manhua', 'Long Strip'].includes(t.attributes?.name?.en));
  if (formatTag) {
    if (formatTag.attributes.name.en === 'Manhwa') format = 'Manhwa';
    if (formatTag.attributes.name.en === 'Manhua') format = 'Manhua';
  }

  // Get country of origin from original language
  const countryMap = {
    'ko': 'KR',
    'zh': 'CN',
    'zh-hk': 'CN',
    'ja': 'JP'
  };

  return {
    id: `md_${mdManga.id}`,
    mangadexId: mdManga.id,
    source: 'MANGADEX',
    title: {
      english: attrs.title.en || Object.values(attrs.title)[0] || 'Unknown',
      romaji: attrs.altTitles?.find(t => t.ja)?.ja || attrs.title.en,
      native: attrs.title.ja || attrs.title['ja-ro'] || null
    },
    description: attrs.description?.en || Object.values(attrs.description || {})[0] || 'No description available from MangaDex.',
    coverImage: {
      large: coverUrl,
      medium: coverUrl
    },
    status: statusMap[attrs.status] || 'UNKNOWN',
    format: format,
    countryOfOrigin: countryMap[attrs.originalLanguage] || 'JP',
    genres: tags.filter(t => t.attributes?.group === 'genre').map(t => t.attributes.name.en),
    chapters: attrs.lastChapter ? parseInt(attrs.lastChapter) : null,
    averageScore: null, // MangaDex doesn't provide scores via public API
    popularity: null,
    startDate: attrs.year ? { year: attrs.year } : null,
    staff: {
      edges: [{
        node: { name: { full: authorName } },
        role: 'Story & Art'
      }]
    },
    externalLinks: [{
      site: 'MangaDex',
      url: `https://mangadex.org/title/${mdManga.id}`
    }]
  };
}

/**
 * Fetches manga details from MangaDex by title with rate limiting and caching.
 * @async
 * @param {string} title - Manga title to search for.
 * @param {number} [retryCount=0] - Internal retry tracker.
 * @returns {Promise<object|null>} Manga data in AniList-compatible format, or null if not found.
 */
export async function fetchMangaFromMangadex(title, retryCount = 0) {
  console.log(`[MangaDex] 🔍 Searching for: "${title}" (attempt ${retryCount + 1})`);
  
  // Check cache first
  const cached = await getCachedData(title);
  if (cached !== null) {
    if (cached.status === 'NOT_FOUND') {
      console.log(`[MangaDex] ⏭️ Cache hit: "${title}" marked as NOT_FOUND, skipping`);
      return null;
    }
    console.log(`[MangaDex] ✅ Cache hit: "${title}" - returning cached data`);
    return cached;
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  // Apply cleaning strategy based on retry count
  let searchTitle = title;
  if (retryCount === 1) searchTitle = cleanTitle(title, false);
  if (retryCount >= 2) searchTitle = cleanTitle(title, true);

  // Build URL with proper includes - URLSearchParams doesn't handle array params well
  const baseUrl = `${MANGADEX_API_URL}/manga`;
  const queryString = `title=${encodeURIComponent(searchTitle)}&limit=10&includes[]=cover_art&includes[]=author&order[relevance]=desc`;
  const url = `${baseUrl}?${queryString}`;
  console.log(`[MangaDex] 🌐 API Request: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        console.warn(`MangaDex rate limited. Waiting ${delay/1000}s before retry.`);
        await sleep(delay);
        return fetchMangaFromMangadex(title, retryCount + 1);
      }
      console.error('MangaDex rate limit exceeded after max retries');
      return null;
    }

    // Handle server errors
    if (response.status >= 500) {
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
        return fetchMangaFromMangadex(title, retryCount + 1);
      }
      return null;
    }

    if (!response.ok) {
      console.error(`MangaDex HTTP error: ${response.status} for title: "${searchTitle}"`);
      if (retryCount < MAX_RETRIES) {
        return fetchMangaFromMangadex(title, retryCount + 1);
      }
      return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      // No results - try next cleaning strategy
      if (retryCount < MAX_RETRIES) {
        return fetchMangaFromMangadex(title, retryCount + 1);
      }
      // Cache as NOT_FOUND to avoid repeated failed lookups
      await setCachedData(title, { status: 'NOT_FOUND', lastChecked: Date.now() });
      return null;
    }

    // Pick best match (first result with highest relevance)
    const bestMatch = data.data[0];
    const transformedData = transformToAnilistFormat(bestMatch);
    
    console.log(`[MangaDex] ✅ Found: "${transformedData.title.english}" (ID: ${transformedData.mangadexId})`);
    console.log(`[MangaDex] 📊 Format: ${transformedData.format}, Status: ${transformedData.status}, Chapters: ${transformedData.chapters || 'N/A'}`);
    
    // Cache the result
    await setCachedData(title, transformedData);
    
    return transformedData;

  } catch (error) {
    console.error('Network error fetching from MangaDex:', error);
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
      return fetchMangaFromMangadex(title, retryCount + 1);
    }
    return null;
  }
}

/**
 * Clears expired entries from the MangaDex cache.
 * @async
 * @returns {Promise<number>} Number of entries removed.
 */
export async function cleanMangadexCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['mangadexCache'], (data) => {
      const cache = data.mangadexCache || {};
      const now = Date.now();
      let removed = 0;
      
      Object.keys(cache).forEach(key => {
        if (now - cache[key].timestamp > CACHE_EXPIRY_MS) {
          delete cache[key];
          removed++;
        }
      });
      
      chrome.storage.local.set({ mangadexCache: cache }, () => resolve(removed));
    });
  });
}

/**
 * Extracts MDList ID from URL or returns the ID directly.
 * Supports formats: UUID, full URL (https://mangadex.org/list/UUID)
 * @param {string} input - User input (URL or ID).
 * @returns {string|null} The extracted MDList UUID or null if invalid.
 */
function extractMDListId(input) {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // UUID format (36 chars with dashes)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return trimmed;
  }
  
  // URL format: https://mangadex.org/list/UUID or https://mangadex.org/list/UUID/name
  const urlMatch = trimmed.match(/mangadex\.org\/list\/([0-9a-f-]{36})/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  return null;
}

/**
 * Fetches all manga from a public MangaDex reading list (MDList).
 * @async
 * @param {string} listIdOrUrl - The MDList ID or full URL.
 * @returns {Promise<{success: boolean, manga: Array, error?: string}>} Result object with manga array or error.
 */
export async function fetchMDList(listIdOrUrl) {
  const listId = extractMDListId(listIdOrUrl);
  
  if (!listId) {
    return { success: false, manga: [], error: 'Invalid MDList ID or URL format.' };
  }
  
  console.log(`[MangaDex] 📋 Fetching MDList: ${listId}`);
  
  try {
    // First, get the list info
    const listUrl = `${MANGADEX_API_URL}/list/${listId}`;
    const listResponse = await fetch(listUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!listResponse.ok) {
      if (listResponse.status === 404) {
        return { success: false, manga: [], error: 'MDList not found. Make sure the list is public.' };
      }
      return { success: false, manga: [], error: `API error: ${listResponse.status}` };
    }
    
    const listData = await listResponse.json();
    
    // Extract manga IDs from the list relationships
    const mangaRelations = listData.data?.relationships?.filter(r => r.type === 'manga') || [];
    
    if (mangaRelations.length === 0) {
      return { success: false, manga: [], error: 'MDList is empty or has no manga.' };
    }
    
    console.log(`[MangaDex] 📚 Found ${mangaRelations.length} manga in list`);
    
    // Fetch manga details in batches (MangaDex allows up to 100 IDs per request)
    const mangaIds = mangaRelations.map(r => r.id);
    const batchSize = 100;
    const allManga = [];
    
    for (let i = 0; i < mangaIds.length; i += batchSize) {
      const batch = mangaIds.slice(i, i + batchSize);
      const idsParam = batch.map(id => `ids[]=${id}`).join('&');
      const mangaUrl = `${MANGADEX_API_URL}/manga?${idsParam}&includes[]=cover_art&includes[]=author&limit=${batchSize}`;
      
      // Rate limiting
      await sleep(MIN_REQUEST_INTERVAL);
      
      const mangaResponse = await fetch(mangaUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (mangaResponse.ok) {
        const mangaData = await mangaResponse.json();
        const transformed = mangaData.data.map(m => transformToAnilistFormat(m));
        allManga.push(...transformed);
        console.log(`[MangaDex] ✅ Fetched batch ${Math.floor(i/batchSize) + 1}: ${transformed.length} manga`);
      }
    }
    
    return { 
      success: true, 
      manga: allManga,
      listName: listData.data?.attributes?.name || 'Unnamed List'
    };
    
  } catch (error) {
    console.error('[MangaDex] MDList fetch error:', error);
    return { success: false, manga: [], error: error.message };
  }
}
