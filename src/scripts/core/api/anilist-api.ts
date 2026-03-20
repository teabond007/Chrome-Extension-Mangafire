/**
 * @fileoverview AniList API interaction module for the MangaBook extension.
 * Provides functions for fetching manga metadata, title cleaning, and rate-limited API calls.
 */

/** @type {string} Base URL for AniList GraphQL API */
const ANILIST_API_URL = 'https://graphql.anilist.co';

interface AniListDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

interface AniListCoverImage {
  large: string;
  medium: string;
}

interface AniListTag {
  name: string;
}

interface AniListExternalLink {
  url: string;
  site: string;
  language: string | null;
}

export interface AniListManga {
  id: number;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  format: string;
  countryOfOrigin: string;
  genres: string[];
  synonyms: string[];
  tags: AniListTag[];
  status: string;
  chapters: number | null;
  volumes: number | null;
  siteUrl: string;
  averageScore: number | null;
  popularity: number | null;
  description: string | null;
  startDate: AniListDate;
  endDate: AniListDate;
  externalLinks: AniListExternalLink[];
}

interface AniListResponse {
  data?: {
    Page?: {
      media?: AniListManga[];
    };
  };
  errors?: { message: string }[];
}

/** @type {string|null} Cached string content of the GraphQL query */
let cachedQuery = `
query ($search: String) {
  Page (page: 1, perPage: 1) {
    media (search: $search, type: MANGA) {
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
      bannerImage
      format
      countryOfOrigin
      genres
      synonyms
      tags {
        name
      }
      status
      chapters
      volumes
      siteUrl
      averageScore
      popularity
      description
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
      externalLinks {
        url
        site
        language
      }
    }
  }
}
`;

/**
 * Returns the GraphQL query.
 * 
 * @returns {string} The GraphQL query string.
 */
function getQuery(): string {
  return cachedQuery;
}

/** @type {number} Timestamp of the last successful API request to AniList */
let lastRequestTime = 0;

/** @const {number} Minimum interval between requests in milliseconds to avoid rate limits */
const MIN_REQUEST_INTERVAL = 2000;

/** @const {number} Maximum number of retry attempts for failed or rate-limited requests */
const MAX_RETRIES = 3;

/** @const {number} Base delay in milliseconds for exponential backoff during retries */
const RETRY_DELAY_BASE = 3000;

/**
 * Utility function to pause execution for a specified duration, optionally adding jitter.
 * 
 * @param {number} ms - The number of milliseconds to sleep.
 * @param {boolean} [useJitter=true] - Whether to add a small random delay to prevent synchronized retries.
 * @returns {Promise<void>}
 */
function sleep(ms: number, useJitter: boolean = true): Promise<void> {
  const jitter = useJitter ? Math.floor(Math.random() * 500) : 0;
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Normalizes and cleans manga titles to improve search accuracy on AniList.
 * 
 * @param {string} title - The raw manga title string.
 * @param {boolean} [aggressive=false] - If true, performs more destructive cleaning (removes common noise words and special characters).
 * @returns {string} The cleaned and normalized title.
 */
function cleanTitle(title: string, aggressive: boolean = false): string {
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
 * Fetches manga details from AniList by title with automatic retry logic and exponential backoff.
 * Scales cleaning strategy based on retry attempts.
 * 
 * @async
 * @param {string} title - The title of the manga to search for.
 * @param {number} [retryCount=0] - Internal tracker for the current retry attempt.
 * @returns {Promise<AniListManga|null>} The primary manga data object from AniList, or null if no match found.
 */
export async function fetchMangaFromAnilist(title: string, retryCount: number = 0): Promise<AniListManga | null> {
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

  const query = getQuery();
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
        const retryHeader = response.headers.get('Retry-After');
        const retryAfter = retryHeader ? parseInt(retryHeader) : 60;
        const delay = Math.min(retryAfter * 1000, RETRY_DELAY_BASE * Math.pow(2, retryCount));
        console.warn(`AniList rate limited. Waiting ${delay / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}`);
        await sleep(delay);
        // Don't advance strategy for rate limits, just retry same title
        return fetchMangaFromAnilist(title, retryCount + 1);
      }
      console.error('AniList rate limit exceeded after max retries');
      return null;
    }

    // Handle Server Errors (500+)
    if (response.status >= 500) {
      console.warn(`AniList Server Error (${response.status}): ${response.statusText}. Retrying...`);
      if (retryCount < MAX_RETRIES) {
        // Use standard backoff
        await sleep(RETRY_DELAY_BASE * Math.pow(2, retryCount));
        return fetchMangaFromAnilist(title, retryCount + 1);
      }
      return null; // Give up after retries
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

    const data = await response.json() as AniListResponse;

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
        const getScore = (media: AniListManga) => {
          if (media.format === 'MANGA') return 100;
          if (media.format === 'ONE_SHOT') return 10;
          if (media.format === 'NOVEL') return 5;
          return 50; // Unknown or other formats
        };
        return getScore(b) - getScore(a);
      });

      return sortedResults[0];
    }
    return null;
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
 * Converts AniList format codes and country information into human-readable strings.
 * Correctly identifies Manhwa (Korean) and Manhua (Chinese) based on origin.
 * 
 * @param {string} format - The AniList format code (e.g., 'MANGA', 'NOVEL').
 * @param {string} countryOfOrigin - Two-letter country code (e.g., 'KR', 'CN').
 * @returns {string} Human-readable format name.
 */
export function getFormatName(format: string, countryOfOrigin: string): string {
  // Use country of origin to differentiate manhwa/manhua
  if (countryOfOrigin === 'KR') return 'Manhwa';
  if (countryOfOrigin === 'CN' || countryOfOrigin === 'TW') return 'Manhua';

  const formatMap: Record<string, string> = {
    'MANGA': 'Manga',
    'ONE_SHOT': 'One Shot',
    'NOVEL': 'Light Novel'
  };
  return formatMap[format] || format || 'Unknown';
}


