/**
 * @fileoverview AniList API interaction module.
 * This file handles getting manga data from Anilist.

 */

import { API_CONFIG } from '../../../config.js';

// The URL for the Anilist API
var ANILIST_API_URL = API_CONFIG.ANILIST.BASE_URL;

// This is the query we send to Anilist to get the manga data
// It asks for things like titles, cover images, genres and descriptions
var graphQLQuery = `
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
      isAdult
    }
  }
}
`;

// We keep track of the last time we made a request so we don't go too fast (rate limiting)
var lastRequestTime = 0;
var MIN_INTERVAL = API_CONFIG.ANILIST.MIN_REQUEST_INTERVAL;

/**
 * This function makes the code wait for a bit.
 * @param {number} ms - How many milliseconds to wait
 */
function wait(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

/**
 * This function cleans up the title so Anilist can find it better.
 * Sometimes titles have extra stuff like "(Colored)" or "[Official]" that makes the search fail.
 * @param {string} title - The title to clean
 * @param {boolean} aggressive - If we should be extra careful and remove almost everything
 */
function cleanTitle(title, aggressive) {
    // First we remove stuff inside brackets [] or parentheses ()
    var cleaned = title
        .replace(/\s*\(.*?\)\s*/g, ' ')
        .replace(/\s*\[.*?\]\s*/g, ' ')
        .replace(/[:\-–—]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (aggressive == true) {
        // If we are still not finding it, we remove common words that cause trouble
        var wordsToRemove = [
            "colored", "remake", "full color", "digital",
            "vertical", "scanlation", "official", "ver",
            "manga", "manhwa", "manhua", "remastered",
            "raw", "chapter"
        ];
        
        for (var i = 0; i < wordsToRemove.length; i++) {
            var word = wordsToRemove[i];
            var regex = new RegExp(word, "gi");
            cleaned = cleaned.replace(regex, " ");
        }

        // We only keep letters, numbers and spaces as a last resort
        cleaned = cleaned.replace(/[^a-zA-Z0-9 ]/g, ' ');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }

    return cleaned;
}

/**
 * This gets the manga data from Anilist using their GraphQL API.
 * It will try a few times with different title cleaning if it doesn't find anything.
 * @param {string} title - The title of the manga to search for
 * @param {number} attempt - Which try this is (starts at 0)
 */
export async function fetchMangaFromAnilist(title, attempt = 0) {
    // We check if we need to wait a bit before the next request
    var now = Date.now();
    var timeDiff = now - lastRequestTime;
    if (timeDiff < MIN_INTERVAL) {
        await wait(MIN_INTERVAL - timeDiff);
    }
    lastRequestTime = Date.now();

    // Decide what title to search for
    var searchTitle = title;
    if (attempt == 1) {
        // Try cleaning simple things
        searchTitle = cleanTitle(title, false);
    } else if (attempt >= 2) {
        // Try cleaning everything
        searchTitle = cleanTitle(title, true);
    }

    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: graphQLQuery,
            variables: {
                search: searchTitle
            }
        })
    };

    try {
        var response = await fetch(ANILIST_API_URL, fetchOptions);

        // 429 means we are making too many requests
        if (response.status == 429) {
            if (attempt < 3) {
                console.log("Anilist rate limit reached. Waiting 5 seconds before retry...");
                await wait(5000);
                return fetchMangaFromAnilist(title, attempt + 1);
            }
            return null;
        }

        // If the server has a problem we wait and try again
        if (response.ok == false) {
            console.log("Anilist API error: " + response.status);
            if (attempt < 2) {
                await wait(2000);
                return fetchMangaFromAnilist(title, attempt + 1);
            }
            return null;
        }

        var result = await response.json();

        // If there are errors in the GraphQL response
        if (result.errors) {
            if (attempt < 2) {
                return fetchMangaFromAnilist(title, attempt + 1);
            }
            return null;
        }

        if (result.data && result.data.Page && result.data.Page.media) {
            var items = result.data.Page.media;
            
            if (items.length == 0) {
                // If we found nothing, try the next attempt with more cleaning
                if (attempt < 2) {
                    return fetchMangaFromAnilist(title, attempt + 1);
                }
                return null;
            }

            // We look for a result that is actually a Manga (not a novel or one-shot)
            var chosenItem = items[0];
            for (var k = 0; k < items.length; k++) {
                if (items[k].format == 'MANGA') {
                    chosenItem = items[k];
                    break;
                }
            }
            
            return chosenItem;
        }
        
        return null;

    } catch (error) {
        console.log("Something went wrong with the network request to Anilist:");
        console.log(error);
        
        // Try again if we can
        if (attempt < 2) {
            await wait(2000);
            return fetchMangaFromAnilist(title, attempt + 1);
        }
        return null;
    }
}

/**
 * Converts internal codes to human-readable format names.
 * @param {string} format - The format from Anilist (like MANGA or NOVEL)
 * @param {string} country - The country code (like KR for Korea)
 */
export function getFormatName(format, country) {
    // Korea uses Manhwa
    if (country == 'KR') {
        return 'Manhwa';
    }
    // China uses Manhua
    if (country == 'CN' || country == 'TW') {
        return 'Manhua';
    }

    // Default mappings
    if (format == 'MANGA') return 'Manga';
    if (format == 'ONE_SHOT') return 'One Shot';
    if (format == 'NOVEL') return 'Light Novel';
    
    return format || 'Unknown';
}
