/**
 * @fileoverview AniList API interaction module.
 * Provides functions for fetching manga metadata, title cleaning, and rate-limited API calls.
 * 
 * Framework-agnostic module that can be used by Vue components and vanilla JS.
 * 
 * @module core/anilist-api
 */

/** @type {string} Base URL for AniList GraphQL API */
const ANILIST_API_URL = 'https://graphql.anilist.co';

/** @type {number} Timestamp of the last successful API request to AniList */
let lastRequestTime = 0;

/** @const {number} Minimum interval between requests in milliseconds to avoid rate limits */
const MIN_REQUEST_INTERVAL = 2000;

/** @const {number} Maximum number of retry attempts for failed or rate-limited requests */
const MAX_RETRIES = 3;

/** @const {number} Base delay in milliseconds for exponential backoff during retries */
const RETRY_DELAY_BASE = 3000;

/**
 * GraphQL query for fetching manga data from AniList.
 * Inline to avoid file loading issues in content scripts.
 */
const ANILIST_QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 5) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      description
      status
      format
      chapters
      volumes
      genres
      tags {
        name
        rank
      }
      averageScore
      popularity
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      countryOfOrigin
      isAdult
      siteUrl
    }
  }
}
`;

/**
 * Utility function to pause execution for a specified duration, optionally adding jitter.
 * @param {number} ms - The number of milliseconds to sleep.
 * @param {boolean} [useJitter=true] - Whether to add a small random delay.
 * @returns {Promise<void>}
 */
function sleep(ms, useJitter = true) {
    const jitter = useJitter ? Math.floor(Math.random() * 500) : 0;
    return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Normalizes and cleans manga titles to improve search accuracy on AniList.
 * @param {string} title - The raw manga title string.
 * @param {boolean} [aggressive=false] - If true, performs more destructive cleaning.
 * @returns {string} The cleaned and normalized title.
 */
export function cleanTitle(title, aggressive = false) {
    let cleaned = title
        .replace(/\s*\(.*?\)\s*/g, ' ')  // Remove parenthetical content
        .replace(/\s*\[.*?\]\s*/g, ' ')  // Remove bracketed content
        .replace(/[:–—-]/g, ' ')         // Replace dashes/colons with spaces
        .replace(/\s+/g, ' ')            // Normalize whitespace
        .trim();

    if (aggressive) {
        const noiseWords = [
            /colored/gi, /remake/gi, /full color/gi, /digital/gi,
            /vertical/gi, /scanlation/gi, /official/gi, /ver/gi,
            /manga/gi, /manhwa/gi, /manhua/gi, /remastered/gi,
            /raw/gi, /chapter/gi, /ch\.\d+/gi, /v\.\d+/gi
        ];
        noiseWords.forEach(word => {
            cleaned = cleaned.replace(word, ' ');
        });

        cleaned = cleaned.replace(/[^a-zA-Z0-9 ]/g, ' ');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }

    return cleaned;
}

/**
 * Fetches manga details from AniList by title with automatic retry logic and exponential backoff.
 * @param {string} title - The title of the manga to search for.
 * @param {number} [retryCount=0] - Internal tracker for the current retry attempt.
 * @returns {Promise<Object|null>} The primary manga data object from AniList, or null if no match found.
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

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: ANILIST_QUERY,
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
                console.warn(`[AniList] Rate limited. Waiting ${delay / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}`);
                await sleep(delay);
                return fetchMangaFromAnilist(title, retryCount + 1);
            }
            console.error('[AniList] Rate limit exceeded after max retries');
            return null;
        }

        // Handle Server Errors (500+)
        if (response.status >= 500) {
            console.warn(`[AniList] Server Error (${response.status}). Retrying...`);
            if (retryCount < MAX_RETRIES) {
                await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
                return fetchMangaFromAnilist(title, retryCount + 1);
            }
            return null;
        }

        // Handle other HTTP errors
        if (!response.ok) {
            console.error(`[AniList] HTTP error: ${response.status} for title: "${searchTitle}"`);
            if (retryCount < MAX_RETRIES) {
                await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
                return fetchMangaFromAnilist(title, retryCount + 1);
            }
            return null;
        }

        const data = await response.json();

        if (data.errors) {
            console.warn('[AniList] API Error for title:', searchTitle, data.errors);
            if (retryCount < 2) {
                return fetchMangaFromAnilist(title, retryCount + 1);
            }
            return null;
        }

        if (data.data?.Page?.media) {
            const results = data.data.Page.media;
            if (results.length === 0) {
                if (retryCount < 2) {
                    console.log(`[AniList] No results for "${searchTitle}", trying next strategy...`);
                    return fetchMangaFromAnilist(title, retryCount + 1);
                }
                return null;
            }

            // Pick the best match (Prioritize MANGA format)
            const sortedResults = [...results].sort((a, b) => {
                const getScore = (media) => {
                    if (media.format === 'MANGA') return 100;
                    if (media.format === 'ONE_SHOT') return 10;
                    if (media.format === 'NOVEL') return 5;
                    return 50;
                };
                return getScore(b) - getScore(a);
            });

            return sortedResults[0];
        }
    } catch (error) {
        console.error('[AniList] Network error:', error);

        if (retryCount < MAX_RETRIES) {
            await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
            return fetchMangaFromAnilist(title, retryCount + 1);
        }
        return null;
    }

    return null;
}

/**
 * Converts AniList format codes and country information into human-readable strings.
 * @param {string} format - The AniList format code (e.g., 'MANGA', 'NOVEL').
 * @param {string} countryOfOrigin - Two-letter country code (e.g., 'KR', 'CN').
 * @returns {string} Human-readable format name.
 */
export function getFormatName(format, countryOfOrigin) {
    if (countryOfOrigin === 'KR') return 'Manhwa';
    if (countryOfOrigin === 'CN' || countryOfOrigin === 'TW') return 'Manhua';

    const formatMap = {
        'MANGA': 'Manga',
        'ONE_SHOT': 'One Shot',
        'NOVEL': 'Light Novel'
    };
    return formatMap[format] || format || 'Unknown';
}

/**
 * Formats a date object from AniList to a readable string.
 * @param {{year: number|null, month: number|null, day: number|null}} date - AniList date object
 * @returns {string} Formatted date string
 */
export function formatAnilistDate(date) {
    if (!date || !date.year) return 'Unknown';
    
    const parts = [date.year];
    if (date.month) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        parts.unshift(monthNames[date.month - 1]);
    }
    if (date.day) {
        parts.splice(1, 0, date.day);
    }
    
    return parts.join(' ');
}

/**
 * Strips HTML tags from a description.
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}
