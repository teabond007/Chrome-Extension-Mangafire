const ANILIST_API_URL = 'https://graphql.anilist.co';

let cachedQuery = null;

/**
 * Load GraphQL query from external file
 */
async function getQuery() {
    if (cachedQuery) return cachedQuery;
    try {
        const response = await fetch(chrome.runtime.getURL('options/anilist-query.graphql'));
        cachedQuery = await response.text();
        return cachedQuery;
    } catch (err) {
        console.error("Failed to load AniList query:", err);
        return null;
    }
}

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // Increased to 2 seconds for reliability
const MAX_RETRIES = 3; // Increased retries for rate limit handling
const RETRY_DELAY_BASE = 3000; // Increased base delay

/**
 * Sleep for specified milliseconds with optional jitter
 */
function sleep(ms, useJitter = true) {
  const jitter = useJitter ? Math.floor(Math.random() * 500) : 0;
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Clean manga title for better search results
 */
function cleanTitle(title, aggressive = false) {
  let cleaned = title
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove parenthetical content
    .replace(/\s*\[.*?\]\s*/g, ' ') // Remove bracketed content
    .replace(/[:\-–—]/g, ' ')       // Replace dashes/colons with spaces
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();

  if (aggressive) {
    // Specifically target common noise words
    const noiseWords = [
      /colored/gi, /remake/gi, /full color/gi, /digital/gi, 
      /vertical/gi, /scanlation/gi, /official/gi, /ver/gi,
      /manga/gi, /manhwa/gi, /manhua/gi, /remastered/gi,
      /raw/gi, /chapter/gi, /ch\.\d+/gi, /v\.\d+/gi
    ];
    noiseWords.forEach(word => {
      cleaned = cleaned.replace(word, ' ');
    });
    
    // Also remove everything except letters, numbers and spaces for very aggressive cleaning
    cleaned = cleaned.replace(/[^a-zA-Z0-9 ]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  }
  
  return cleaned;
}



/**
 * Fetches manga details from AniList by title with retry logic.
 * @param {string} title - The title of the manga to search for.
 * @param {number} retryCount - Current retry attempt (internal use)
 * @returns {Promise<object|null>} - The manga media object or null if not found.
 */
export async function fetchMangaFromAnilist(title, retryCount = 0) {
  // Rate limiting - ensure minimum interval between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  // Strategy for searches:
  // retry 0: exact title
  // retry 1: normal clean
  // retry 2: aggressive clean
  let searchTitle = title;
  if (retryCount === 1) searchTitle = cleanTitle(title, false);
  if (retryCount >= 2) searchTitle = cleanTitle(title, true);

    const query = await getQuery();
    if (!query) return null;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            variables: {
                search: searchTitle
            }
        })
    };

  try {
    const response = await fetch(ANILIST_API_URL, options);
    
    // Handle rate limiting (429)
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const delay = Math.min(retryAfter * 1000, RETRY_DELAY_BASE * Math.pow(2, retryCount));
        console.warn(`AniList rate limited. Waiting ${delay/1000}s before retry ${retryCount + 1}/${MAX_RETRIES}`);
        await sleep(delay);
        // Don't advance strategy for rate limits, just retry same title
        return fetchMangaFromAnilist(title, retryCount + 1);
      }
      console.error('AniList rate limit exceeded after max retries');
      return null;
    }

    // Handle other HTTP errors
    if (!response.ok) {
      console.error(`AniList HTTP error: ${response.status} ${response.statusText} for title: "${searchTitle}"`);
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
        return fetchMangaFromAnilist(title, retryCount + 1);
      }
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.warn('AniList API Error for title:', searchTitle, data.errors);
      
      // If we haven't reached max retries, try next cleaning strategy
      if (retryCount < 2) {
        return fetchMangaFromAnilist(title, retryCount + 1);
      }
      return null;
    }

    if (data.data && data.data.Page && data.data.Page.media) {
      const results = data.data.Page.media;
      if (results.length === 0) {
        // No results for this strategy - try next strategy
        if (retryCount < 2) {
          console.log(`No results for "${searchTitle}", trying next strategy...`);
          return fetchMangaFromAnilist(title, retryCount + 1);
        }
        return null;
      }

      // Pick the best match (Prioritize MANGA format)
      // Rank: MANGA > (Everything else) > NOVEL > ONE_SHOT
      const sortedResults = [...results].sort((a, b) => {
        const getScore = (media) => {
          if (media.format === 'MANGA') return 100;
          if (media.format === 'ONE_SHOT') return 10;
          if (media.format === 'NOVEL') return 5;
          return 50; // Unknown or other formats
        };
        return getScore(b) - getScore(a);
      });

      return sortedResults[0];
    }
  } catch (error) {
    console.error('Network error fetching from AniList:', error);
    
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
      return fetchMangaFromAnilist(title, retryCount + 1);
    }
    return null;
  }
}

/**
 * Get readable format name from AniList format code
 */
function getFormatName(format, countryOfOrigin) {
  // Use country of origin to differentiate manhwa/manhua
  if (countryOfOrigin === 'KR') return 'Manhwa';
  if (countryOfOrigin === 'CN' || countryOfOrigin === 'TW') return 'Manhua';
  
  const formatMap = {
    'MANGA': 'Manga',
    'ONE_SHOT': 'One Shot',
    'NOVEL': 'Light Novel'
  };
  return formatMap[format] || format || 'Unknown';
}
