/**
 * @fileoverview AniList Synchronization Module
 * Handles OAuth2 authentication and progress syncing with AniList.
 */

import { API_CONFIG, DATA } from '../../../config.js';

/**
 * Initiates the AniList OAuth2 flow.
 * @returns {Promise<string>} The access token
 */
export async function authenticateAnilist(): Promise<string> {
    const redirectUrl = chrome.identity.getRedirectURL('anilist');
    
    if (API_CONFIG.ANILIST.CLIENT_ID.includes('YOUR_')) {
        throw new Error('AniList Client ID is not configured. Please set your Client ID in config.js');
    }

    const authUrl = `${API_CONFIG.ANILIST.AUTH_URL}?client_id=${API_CONFIG.ANILIST.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=token`;

    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                return reject(new Error(chrome.runtime.lastError?.message || 'AniList Auth failed'));
            }

            const url = new URL(responseUrl.replace('#', '?'));
            const token = url.searchParams.get('access_token');

            if (token) {
                chrome.storage.local.set({
                    [DATA.ANILIST_AUTH]: {
                        token,
                        timestamp: Date.now()
                    }
                }, () => resolve(token));
            } else {
                reject(new Error('No access token found in AniList response'));
            }
        });
    });
}

/**
 * Gets the current AniList auth token from storage.
 */
export async function getAnilistToken(): Promise<string | null> {
    const data = await chrome.storage.local.get([DATA.ANILIST_AUTH]) as any;
    return data[DATA.ANILIST_AUTH]?.token || null;
}

/**
 * Syncs reading progress to AniList.
 * @param mediaId - The AniList media ID
 * @param progress - Number of chapters read
 */
export async function syncAnilistProgress(mediaId: number, progress: number): Promise<any> {
    const token = await getAnilistToken();
    if (!token) throw new Error('Not authenticated with AniList');

    const query = `
        mutation ($mediaId: Int, $progress: Int) {
            SaveMediaListEntry (mediaId: $mediaId, progress: $progress) {
                id
                progress
                status
            }
        }
    `;

    const response = await fetch(API_CONFIG.ANILIST.BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query,
            variables: { mediaId, progress }
        })
    });

    const result = await response.json();
    if (result.errors) {
        throw new Error(result.errors[0].message);
    }

    return result.data.SaveMediaListEntry;
}
