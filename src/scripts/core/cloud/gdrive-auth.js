/**
 * @fileoverview Google Drive authentication module using chrome.identity API.
 * This file handles logging in with Google and getting the access token.

 */

/**
 * This function gets a login token from Google.
 * If interactive is true, it will show a popup to the user.
 * @param {boolean} interactive - If we should show the login popup or not
 * @returns {Promise<string>} The token
 */
export async function getAuthToken(interactive = true) {
    return new Promise(function(resolve, reject) {
        // We check if we are actually in a chrome extension environment
        if (typeof chrome === 'undefined' || !chrome.identity) {
            reject(new Error('Chrome identity API not found. Are you in the extension?'));
            return;
        }

        // We ask chrome to give us the OAuth2 token
        chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
            if (chrome.runtime.lastError) {
                var errorMessage = chrome.runtime.lastError.message || 'Authentication failed';
                
                // Map common errors to user-friendly messages
                if (errorMessage.indexOf('OAuth2 not granted') != -1) {
                    reject(new Error('Please allow the extension to access your Google account'));
                } else if (errorMessage.indexOf('user did not approve') != -1) {
                    reject(new Error('Sign-in was cancelled by user'));
                } else {
                    reject(new Error(errorMessage));
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
 * This logs the user out by removing the token.
 */
export async function revokeToken() {
    try {
        // We try to get the current token without showing a popup
        var token = await getAuthToken(false);
        
        if (token) {
            // We tell Google to revoke (cancel) the token
            await fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token);
            
            // We also remove it from the browser's memory
            return new Promise(function(resolve) {
                chrome.identity.removeCachedAuthToken({ token: token }, function() {
                    resolve();
                });
            });
        }
    } catch (err) {
        // If we couldn't get a token, the user is probably already logged out
        console.log('[GDriveAuth] Already logged out or token is gone');
    }
}

/**
 * Checks if the user is currently signed in.
 * @returns {Promise<boolean>} True if signed in
 */
export async function isSignedIn() {
    try {
        await getAuthToken(false);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Gets the user's profile info (email and avatar) from Google.
 * @returns {Promise<Object>} The profile data
 */
export async function getUserProfile() {
    var token = await getAuthToken(false);
    
    var response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 
            'Authorization': 'Bearer ' + token 
        }
    });
    
    if (response.ok == false) {
        throw new Error('Failed to fetch profile: ' + response.status);
    }
    
    var profileData = await response.json();
    return profileData;
}

/**
 * Clears all cached tokens. This helps if there are login bugs.
 */
export async function clearAuthCache() {
    return new Promise(function(resolve) {
        if (chrome && chrome.identity && chrome.identity.clearAllCachedAuthTokens) {
            chrome.identity.clearAllCachedAuthTokens(resolve);
        } else {
            resolve();
        }
    });
}
