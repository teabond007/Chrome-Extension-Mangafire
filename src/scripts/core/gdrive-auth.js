/**
 * @fileoverview Google Drive authentication module using chrome.identity API.
 * Handles OAuth2 token management for Drive appDataFolder access.
 * 
 * Required manifest.json configuration:
 * - permissions: ["identity"]
 * - oauth2: { client_id: "...", scopes: ["https://www.googleapis.com/auth/drive.appdata"] }
 */

const SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

/**
 * Retrieves an OAuth2 access token, prompting user login if needed.
 * Uses chrome.identity.getAuthToken for seamless Chrome extension OAuth.
 * 
 * @param {boolean} interactive - If true, shows OAuth consent screen when needed
 * @returns {Promise<string>} The OAuth access token
 * @throws {Error} If authentication fails or user denies consent
 */
export async function getAuthToken(interactive = true) {
    return new Promise((resolve, reject) => {
        // Debug logging
        console.log('[GDriveAuth] getAuthToken called');
        console.log('[GDriveAuth] typeof chrome:', typeof chrome);
        console.log('[GDriveAuth] chrome.identity:', chrome?.identity);
        console.log('[GDriveAuth] chrome.runtime:', chrome?.runtime);
        console.log('[GDriveAuth] location.protocol:', location.protocol);
        
        // Check if running in extension context
        if (typeof chrome === 'undefined') {
            reject(new Error('chrome object not defined. Are you running in a browser?'));
            return;
        }
        
        if (!chrome.identity) {
            // More detailed error with available chrome APIs
            const availableApis = Object.keys(chrome).join(', ');
            reject(new Error(`chrome.identity not available. Available APIs: ${availableApis}. Protocol: ${location.protocol}`));
            return;
        }
        
        if (!chrome.identity.getAuthToken) {
            reject(new Error('chrome.identity.getAuthToken not available. Make sure identity permission is in manifest.'));
            return;
        }

        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message || 'Authentication failed';
                // Provide more helpful error messages
                if (errorMsg.includes('OAuth2 not granted')) {
                    reject(new Error('Please allow the extension to access your Google account'));
                } else if (errorMsg.includes('user did not approve')) {
                    reject(new Error('Sign-in was cancelled'));
                } else {
                    reject(new Error(errorMsg));
                }
            } else if (!token) {
                reject(new Error('No token received from Google'));
            } else {
                console.log('[GDriveAuth] Token received successfully');
                resolve(token);
            }
        });
    });
}

/**
 * Revokes the cached OAuth token and signs the user out.
 * Also invalidates the token on Google's servers.
 * 
 * @returns {Promise<void>}
 */
export async function revokeToken() {
    try {
        const token = await getAuthToken(false);
        if (token) {
            // Revoke on Google's servers
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
            
            // Remove from Chrome's cache
            return new Promise((resolve) => {
                chrome.identity.removeCachedAuthToken({ token }, () => {
                    resolve();
                });
            });
        }
    } catch (error) {
        // Token might already be invalid, that's fine
        console.log('[GDrive Auth] Token already revoked or invalid');
    }
}

/**
 * Checks if user has a valid cached token (is signed in).
 * Uses non-interactive check to avoid prompting user.
 * 
 * @returns {Promise<boolean>} True if user is signed in
 */
export async function isSignedIn() {
    try {
        await getAuthToken(false);
        return true;
    } catch {
        return false;
    }
}

/**
 * Fetches user profile info from Google's OAuth2 userinfo endpoint.
 * 
 * @returns {Promise<{email: string, picture: string, name: string}>}
 * @throws {Error} If not signed in or request fails
 */
export async function getUserProfile() {
    const token = await getAuthToken(false);
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 
            Authorization: `Bearer ${token}` 
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Clears all cached authentication state.
 * Useful for troubleshooting auth issues.
 * 
 * @returns {Promise<void>}
 */
export async function clearAuthCache() {
    return new Promise((resolve) => {
        if (chrome?.identity?.clearAllCachedAuthTokens) {
            chrome.identity.clearAllCachedAuthTokens(resolve);
        } else {
            resolve();
        }
    });
}
