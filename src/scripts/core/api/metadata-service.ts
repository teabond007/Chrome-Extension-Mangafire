/**
 * @fileoverview Centralized Metadata Service
 * Aggregates manga metadata from AniList and MangaDex, merging the results for a unified data object.
 * Replaces duplicate logic previously found in background/index.js and library.store.js.
 */

import { fetchMangaFromAnilist } from './anilist-api';
import { fetchMangaFromMangadex } from './mangadex-api.js';

/**
 * Fetches and merges metadata for a given manga title.
 * Prioritizes AniList data, but falls back to MangaDex if AniList is missing 
 * critical information (banner image, description, or high-res cover).
 * 
 * @param {string} title - The title of the manga to search for.
 * @returns {Promise<any|null>} A merged metadata object, or null if no data found.
 */
export async function getMergedMetadata(title: string): Promise<any | null> {
    if (!title) return null;

    console.log(`[MetadataService] Starting fetch for: "${title}"`);

    try {
        let data: any = await fetchMangaFromAnilist(title);
        
        if (data) {
            console.log(`[MetadataService] AniList match found for: "${title}" (ID: ${data.id})`);
        } else {
            console.log(`[MetadataService] No AniList match for: "${title}"`);
        }

        // Define what constitutes "incomplete" data from AniList
        const isAniListIncomplete = data && (
            !data.bannerImage || 
            !data.description || 
            !data.coverImage?.large || 
            (data.genres && data.genres.length === 0)
        );

        if (!data || isAniListIncomplete) {
            if (isAniListIncomplete) {
                console.log(`[MetadataService] AniList data incomplete for: "${title}", attempting MangaDex fallback`);
            }
            
            const mdData: any = await fetchMangaFromMangadex(title);
            
            if (mdData) {
                console.log(`[MetadataService] MangaDex match found for: "${title}"`);
                if (!data) {
                    // Full fallback to MangaDex
                    console.log(`[MetadataService] Using full MangaDex data for: "${title}"`);
                    data = mdData;
                } else {
                    // Merge MangaDex data into AniList data
                    console.log(`[MetadataService] Merging MangaDex data for: "${title}"`);
                    if (!data.bannerImage) data.bannerImage = mdData.bannerImage;
                    if (!data.description) data.description = mdData.description;
                    
                    if ((!data.coverImage?.large || data.coverImage.large.includes('default')) && mdData.coverImage?.large) {
                        data.coverImage = mdData.coverImage;
                    }
                    
                    if ((!data.genres || data.genres.length === 0) && mdData.genres?.length > 0) {
                        data.genres = mdData.genres;
                    }
                }
            } else {
                console.log(`[MetadataService] No MangaDex match for: "${title}"`);
            }
        }

        if (!data) {
            console.warn(`[MetadataService] Final: No metadata found for "${title}" from any source.`);
        } else {
            console.log(`[MetadataService] Final: Successfully resolved metadata for "${title}"`);
        }

        return data || null;
    } catch (error) {
        console.error(`[MetadataService] ERROR processing metadata for "${title}":`, error);
        return null; // Fail gracefully
    }
}
