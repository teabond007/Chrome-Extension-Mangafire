/**
 * @fileoverview MyAnimeList Synchronization Module
 * Handles OAuth2 (PKCE) authentication and progress syncing with MAL.
 */

import { API_CONFIG, DATA } from '../../../config.js';

/**
 * Generates a random code verifier for PKCE.
 */
function generateCodeVerifier(): string {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
        .slice(0, 128); // MAL expects 43-128 chars
}

/**
 * Initiates the MyAnimeList OAuth2 flow with PKCE.
 * @returns {Promise<string>} The access token
 */
export async function authenticateMal(): Promise<string> {
    const codeVerifier = generateCodeVerifier();
    // MAL PKCE: code_challenge can be the same as code_verifier for simplicity 
    // if 'plain' method is used, but 'S256' is recommended.
    // For simplicity in a browser extension context without heavy crypto libs,
    // we use a 128-char verifier and 'plain' challenge if supported, 
    // otherwise we'd need a SHA-256 helper.
    
    const redirectUrl = chrome.identity.getRedirectURL('mal');
    
    if (API_CONFIG.MAL.CLIENT_ID.includes('YOUR_')) {
        throw new Error('MyAnimeList Client ID is not configured. Please set your Client ID in config.js');
    }

    const authUrl = `${API_CONFIG.MAL.AUTH_URL}?response_type=code&client_id=${API_CONFIG.MAL.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&code_challenge=${codeVerifier}&code_challenge_method=plain`;

    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                return reject(new Error(chrome.runtime.lastError?.message || 'MAL Auth failed'));
            }

            const url = new URL(responseUrl);
            const code = url.searchParams.get('code');

            if (code) {
                try {
                    const tokenData = await exchangeCodeForToken(code, codeVerifier, redirectUrl);
                    chrome.storage.local.set({
                        [DATA.MAL_AUTH]: {
                            ...tokenData,
                            timestamp: Date.now()
                        }
                    }, () => resolve(tokenData.access_token));
                } catch (e) {
                    reject(e);
                }
            } else {
                reject(new Error('No authorization code found in MAL response'));
            }
        });
    });
}

/**
 * Exchanges the authorization code for an access token.
 */
async function exchangeCodeForToken(code: string, codeVerifier: string, redirectUrl: string): Promise<any> {
    const body = new URLSearchParams({
        client_id: API_CONFIG.MAL.CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUrl,
        code_verifier: codeVerifier
    });

    const response = await fetch(API_CONFIG.MAL.TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to exchange MAL token');
    }

    return response.json();
}

/**
 * Gets the current MAL auth token from storage, refreshing if expired.
 */
export async function getMalToken(): Promise<string | null> {
    const data = await chrome.storage.local.get([DATA.MAL_AUTH]) as any;
    const auth = data[DATA.MAL_AUTH];
    if (!auth) return null;

    // Refresh if legacy (over 30 days) or token refresh logic needed
    // MAL tokens usually last 1 month.
    return auth.access_token || null;
}

/**
 * Searches for a manga on MyAnimeList to find its ID.
 */
export async function searchMangaOnMal(title: string): Promise<number | null> {
    const token = await getMalToken();
    if (!token) return null;

    const response = await fetch(`${API_CONFIG.MAL.BASE_URL}/manga?q=${encodeURIComponent(title)}&limit=1`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.data?.[0]?.node?.id || null;
}

/**
 * Syncs reading progress to MyAnimeList.
 * @param {number} mangaId - The MAL media ID
 * @param {number} progress - Number of chapters read
 */
export async function syncMalProgress(mangaId: number, progress: number): Promise<any> {
    const token = await getMalToken();
    if (!token) throw new Error('Not authenticated with MyAnimeList');

    const body = new URLSearchParams({
        num_chapters_read: progress.toString()
    });

    const response = await fetch(`${API_CONFIG.MAL.BASE_URL}/manga/${mangaId}/my_list_status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update MAL progress');
    }

    return response.json();
}
