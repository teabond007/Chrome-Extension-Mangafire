/**
 * This file gets metadata for manga from different websites.
 * It tries Anilist first and then Mangadex if things are missing.
 * I moved this here so we don't have the same code in two places.
 */

import { fetchMangaFromAnilist } from './anilist-api.js';
import { fetchMangaFromMangadex } from './mangadex-api.js';

// This function gets the data and mixes it together
export async function getMergedMetadata(title) {
    // We check if the title is actually there
    if (title == "" || title == null || title == undefined) {
        return null;
    }

    console.log("Starting to look for metadata for: " + title);

    try {
        // We try Anilist first because it has better data usually
        var data = await fetchMangaFromAnilist(title);
        
        if (data != null) {
            console.log("We found the manga on Anilist! ID is " + data.id);
        } else {
            console.log("We could not find anything on Anilist for " + title);
        }

        // Now we see if Anilist gave us everything we need
        // If it is missing a banner or description or cover we try to get it from somewhere else
        var isMissingStuff = false;
        
        if (data == null) {
            isMissingStuff = true;
        } else {
            // Check if banner is missing
            if (data.bannerImage == null || data.bannerImage == "") {
                isMissingStuff = true;
            }
            
            // Check if description is missing
            if (data.description == null || data.description == "") {
                isMissingStuff = true;
            }
            
            // Check if cover is missing or small
            if (data.coverImage == null) {
                isMissingStuff = true;
            } else {
                if (data.coverImage.large == null || data.coverImage.large == "") {
                    isMissingStuff = true;
                }
            }
            
            // Check if genres are missing
            if (data.genres == null) {
                isMissingStuff = true;
            } else {
                if (data.genres.length == 0) {
                    isMissingStuff = true;
                }
            }
        }

        // If we don't have enough data or nothing at all we check Mangadex
        if (isMissingStuff == true) {
            if (data != null) {
                console.log("Anilist was missing some stuff for " + title + " so we are checking Mangadex now");
            }
            
            var mdData = await fetchMangaFromMangadex(title);
            
            if (mdData != null) {
                console.log("Mangadex found a match for " + title);
                
                if (data == null) {
                    // We had nothing so we just use everything from Mangadex
                    console.log("Using all the data from Mangadex for " + title);
                    data = mdData;
                } else {
                    // We have some data but we add the missing bits from Mangadex
                    console.log("Adding Mangadex data to the Anilist data");
                    
                    if (data.bannerImage == null || data.bannerImage == "") {
                        data.bannerImage = mdData.bannerImage;
                    }
                    
                    if (data.description == null || data.description == "") {
                        data.description = mdData.description;
                    }
                    
                    // Check if the cover is the default one or missing
                    var coverIsBad = false;
                    if (data.coverImage == null) {
                        coverIsBad = true;
                    } else {
                        if (data.coverImage.large == null || data.coverImage.large == "") {
                            coverIsBad = true;
                        } else {
                            // If it says "default" in the name it is probably not a real cover
                            if (data.coverImage.large.indexOf("default") != -1) {
                                coverIsBad = true;
                            }
                        }
                    }
                    
                    if (coverIsBad == true) {
                        if (mdData.coverImage != null) {
                            data.coverImage = mdData.coverImage;
                        }
                    }
                    
                    // Add genres if we have none
                    if (data.genres == null || data.genres.length == 0) {
                        if (mdData.genres != null) {
                            if (mdData.genres.length > 0) {
                                data.genres = mdData.genres;
                            }
                        }
                    }
                }
            } else {
                console.log("Mangadex also did not have anything for " + title);
            }
        }

        // We check one last time if we have anything
        if (data == null) {
            console.log("We finished but we found no metadata for " + title + " anywhere.");
        } else {
            console.log("We finished! We have metadata for " + title);
        }

        return data;

    } catch (err) {
        // If it crashes we just log the error and return null so the app doesn't break
        console.log("There was a big error getting metadata for " + title);
        console.log(err);
        return null;
    }
}
