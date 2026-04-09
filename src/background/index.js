/**
 * @fileoverview Background Service Worker for Bookmarks Marker/Highlighter Extension
 * Acts as central message router and orchestrates site-specific scrapers.
 */

import { getMergedMetadata } from '../scripts/core/api/metadata-service';
import { DATA } from '../config.js';

// Open options page when extension icon clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html") });
});

/**
 * Central message listener that routes messages to appropriate handlers.
 * Supports MangaFire scraping operations and auto-sync functionality.
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "showMangaDetails") {
    // Open options page with library tab and manga details modal
    // Encode the entry title to find it in storage
    const encodedTitle = encodeURIComponent(msg.title || '');
    chrome.tabs.create({ 
      url: chrome.runtime.getURL(`src/options/options.html#library?showDetails=${encodedTitle}`)
    });
  } 
  // ========== Google Drive Sync Handlers ==========
  else if (msg.type === "gdrive:signIn") {
    handleGDriveSignIn(sendResponse);
    return true; // Keep channel open for async response
  } else if (msg.type === "gdrive:signOut") {
    handleGDriveSignOut(sendResponse);
    return true;
  } else if (msg.type === "gdrive:upload") {
    handleGDriveUpload(msg.data, sendResponse);
    return true;
  } else if (msg.type === "gdrive:download") {
    handleGDriveDownload(sendResponse);
    return true;
  } else if (msg.type === "gdrive:getBackupInfo") {
    handleGDriveBackupInfo(sendResponse);
    return true;
  } else if (msg.type === "gdrive:deleteBackup") {
    handleGDriveDeleteBackup(sendResponse);
    return true;
  } else if (msg.type === "custom-sites-updated") {
    // Re-register content scripts for custom sites
    handleCustomSitesUpdate(sendResponse);
    return true;
  } else if (msg.type === "fetchMetadata") {
    // Fetch AniList/MangaDex metadata from background (avoids CORS on custom sites)
    handleFetchMetadata(msg.title, msg.storageKey, sendResponse);
    return true;
  }
  
  // Mandatory response to prevent "The message port closed before a response was received"
  sendResponse({ status: "received" });
  return true; 
});

/**
 * Logs messages via the extension's messaging system.
 * @param {string|Object} txt - The message to log.
 */
function Log(txt) {
  const text = typeof txt === "object" ? JSON.stringify(txt) : txt;
  safeSendMessage({ type: "log", text: text });
}

/**
 * Safe wrapper for chrome.runtime.sendMessage to suppress connection errors.
 * @param {Object} message - Message object to send.
 */
function safeSendMessage(message) {
  try {
    if (chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, () => {
        const err = chrome.runtime.lastError;
        if (err && err.message !== "Could not establish connection. Receiving end does not exist.") {
          // Only log real errors
        }
      });
    }
  } catch (e) {
    // Ignore context invalidated errors
  }
}

// ========== Google Drive Handler Functions ==========

/**
 * Handles Google sign-in via chrome.identity.
 */
async function handleGDriveSignIn(sendResponse) {
  try {
    const { getAuthToken, getUserProfile } = await import('../scripts/core/cloud/gdrive-auth.js');
    await getAuthToken(true);
    const profile = await getUserProfile();
    sendResponse({ success: true, profile });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handles Google sign-out and token revocation.
 */
async function handleGDriveSignOut(sendResponse) {
  try {
    const { revokeToken } = await import('../scripts/core/cloud/gdrive-auth.js');
    await revokeToken();
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handles backup upload to Google Drive.
 */
async function handleGDriveUpload(data, sendResponse) {
  try {
    const { uploadBackup } = await import('../scripts/core/cloud/gdrive-sync.js');
    const result = await uploadBackup(data);
    sendResponse({ success: true, result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handles backup download from Google Drive.
 */
async function handleGDriveDownload(sendResponse) {
  try {
    const { downloadBackup } = await import('../scripts/core/cloud/gdrive-sync.js');
    const data = await downloadBackup();
    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handles fetching backup info from Google Drive.
 */
async function handleGDriveBackupInfo(sendResponse) {
  try {
    const { getBackupInfo } = await import('../scripts/core/cloud/gdrive-sync.js');
    const info = await getBackupInfo();
    sendResponse({ success: true, info });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handles deleting backup from Google Drive.
 */
async function handleGDriveDeleteBackup(sendResponse) {
  try {
    const { deleteBackup } = await import('../scripts/core/cloud/gdrive-sync.js');
    await deleteBackup();
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}



let isUpdatingCustomSites = false;

/**
 * Updates dynamic content script registrations based on user-defined custom sites.
 * Uses chrome.scripting.registerContentScripts to inject the main content script
 * on custom site domains.
 */
async function handleCustomSitesUpdate(sendResponse) {
  const CUSTOM_SCRIPT_ID = 'bmh-custom-sites';

  if (isUpdatingCustomSites) {
    console.log('[Background] Update already in progress, skipping');
    if (sendResponse) sendResponse({ success: true, message: 'Update already in progress' });
    return;
  }

  isUpdatingCustomSites = true;

  try {
    // Get current custom sites from storage
    const data = await chrome.storage.local.get([DATA.CUSTOM_SITES]);
    const rawSites = data[DATA.CUSTOM_SITES];
    const customSites = Array.isArray(rawSites) ? rawSites : [];
    const enabledSites = customSites.filter(s => s && s.enabled && s.hostname);

    // First, unregister any existing custom site scripts
    try {
      const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [CUSTOM_SCRIPT_ID] });
      if (scripts.length > 0) {
        await chrome.scripting.unregisterContentScripts({ ids: [CUSTOM_SCRIPT_ID] });
      }
    } catch (e) {
      // Script not registered yet, ignore
    }

    // If no enabled sites, we're done
    if (enabledSites.length === 0) {
      Log('Custom sites: No enabled sites, skipping registration');
      if (sendResponse) sendResponse({ success: true, count: 0 });
      return;
    }

    // Build match patterns for all enabled custom sites
    const matches = enabledSites.map(site => `*://${site.hostname}/*`);
    
    // Get the manifest to find the correct compiled content script path
    const manifest = chrome.runtime.getManifest();
    const contentScriptPath = manifest.content_scripts?.[0]?.js?.[0];
    const cssPath = manifest.content_scripts?.[0]?.css?.[0];
    
    if (!contentScriptPath) {
      console.error('[Background] Could not find content script path in manifest');
      if (sendResponse) sendResponse({ success: false, error: 'No content script path found' });
      return;
    }

    Log(`Custom sites: Using content script: ${contentScriptPath}`);

    // Register the content script and associated CSS for custom sites
    const scriptProps = {
      id: CUSTOM_SCRIPT_ID,
      matches: matches,
      js: [contentScriptPath],
      runAt: 'document_idle'
    };
    
    if (cssPath) {
        scriptProps.css = [cssPath];
    }

    await chrome.scripting.registerContentScripts([scriptProps]);

    Log(`Custom sites: Registered script for ${enabledSites.length} site(s): ${matches.join(', ')}`);
    if (sendResponse) sendResponse({ success: true, count: enabledSites.length });

  } catch (error) {
    if (error.message?.includes('Duplicate script ID')) {
       console.warn('[Background] Duplicate script ID during registration, attempting recovery');
    }
    console.error('[Background] Failed to update custom site scripts:', error);
    if (sendResponse) sendResponse({ success: false, error: error.message });
  } finally {
    isUpdatingCustomSites = false;
  }
}

/**
 * Fetches AniList/MangaDex metadata for a library entry and updates storage.
 * Runs in the background to avoid CORS issues on custom site content scripts.
 * @param {string} title - Manga title to search for
 * @param {string} storageKey - Storage key to find the entry
 * @param {Function} sendResponse - Response callback
 */
async function handleFetchMetadata(title, storageKey, sendResponse) {
  try {
    Log(`Fetching metadata for: ${title}`);

    const data = await getMergedMetadata(title);

    if (!data) {
      Log(`No metadata found for: ${title}`);
      if (sendResponse) sendResponse({ success: false });
      return;
    }

    // Update the entry in storage
    const stored = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES]);
    const library = stored[DATA.LIBRARY_ENTRIES] || [];
    const entry = library.find(e => e.slug === storageKey || e.title === title);

    if (entry) {
      entry.anilistData = data;
      entry.lastChecked = Date.now();
      
      // Ensure array integrity and plain object serialization
      const finalLibrary = Array.isArray(library) ? library : [];
      await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: JSON.parse(JSON.stringify(finalLibrary)) });
      Log(`Metadata saved for: ${title}`);
    }

    if (sendResponse) sendResponse({ success: true });
  } catch (e) {
    console.warn('[Background] Metadata fetch failed:', e);
    if (sendResponse) sendResponse({ success: false, error: e.message });
  }
}

// Re-register custom sites on extension startup
chrome.runtime.onStartup.addListener(async () => {
  Log('Extension startup - checking custom sites...');
  handleCustomSitesUpdate(() => {});
});


chrome.runtime.onInstalled.addListener(async () => {
  Log('Extension installed/updated - checking custom sites...');
  handleCustomSitesUpdate(() => {});
  
});
