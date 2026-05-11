/**
 * @fileoverview Google Drive sync operations for manga library backup.
 * This file handles uploading and downloading data from Google Drive.

 */

import { getAuthToken } from './gdrive-auth.js';
import { DATA } from '../../../config.js';

var BACKUP_FILENAME = 'manga_colormarker_sync.json';
var DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
var DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Uploads all our extension data to Google Drive appDataFolder.
 * This makes sure your library is safe if you uninstall the extension.
 * @param {Object} data - The data object to backup
 * @returns {Promise<Object>} Results with fileId and syncTime
 */
export async function uploadBackup(data) {
    var token = await getAuthToken();
    var now = Date.now();
    
    // We create a copy of the data so we don't change the original
    var payload = {};
    for (var key in data) {
        payload[key] = data[key];
    }
    
    // Add some info about when this was saved
    payload.syncTimestamp = now;
    payload.syncVersion = '1.0';

    // We check if a backup file already exists on Google Drive
    var existingFile = await findBackupFile(token);

    // Information about the file we are saving
    var metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json'
    };

    // If it's the first time, we tell Google to put it in the hidden app folder
    if (existingFile == null) {
        metadata.parents = ['appDataFolder'];
    }

    // We build a multipart body manually. 
    // This allows sending the file description (metadata) and the file content (payload) together.
    var boundary = '---ColorMarkerSyncBoundary---' + now;
    var body = "";
    body += "--" + boundary + "\r\n";
    body += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    body += JSON.stringify(metadata) + "\r\n";
    body += "--" + boundary + "\r\n";
    body += "Content-Type: application/json\r\n\r\n";
    body += JSON.stringify(payload, null, 2) + "\r\n";
    body += "--" + boundary + "--";

    var url = "";
    var method = "";
    
    if (existingFile != null) {
        // Update the existing file
        url = DRIVE_UPLOAD_BASE + "/files/" + existingFile.id + "?uploadType=multipart";
        method = 'PATCH';
    } else {
        // Create a new file
        url = DRIVE_UPLOAD_BASE + "/files?uploadType=multipart";
        method = 'POST';
    }

    var response = await fetch(url, {
        method: method,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: body
    });

    if (response.ok == false) {
        var errorText = await response.text();
        console.error("Upload failed with status: " + response.status);
        throw new Error('Google Drive upload failed');
    }

    var result = await response.json();
    return { fileId: result.id, syncTime: now };
}

/**
 * Downloads the latest backup file from Google Drive.
 * @returns {Promise<Object|null>} The data or null if not found
 */
export async function downloadBackup() {
    var token = await getAuthToken();
    var file = await findBackupFile(token);

    if (file == null) {
        return null;
    }

    // We ask for the "media" content of the file
    var response = await fetch(DRIVE_API_BASE + "/files/" + file.id + "?alt=media", {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    if (response.ok == false) {
        throw new Error('Google Drive download failed: ' + response.status);
    }

    var data = await response.json();
    return data;
}

/**
 * Gets some basic info about the backup file without downloading everything.
 * @param {string} [providedToken] - Optional token to use
 * @returns {Promise<Object|null>} File info
 */
export async function getBackupInfo(providedToken = null) {
    var token = providedToken;
    if (token == null) {
        token = await getAuthToken();
    }
    
    var file = await findBackupFile(token);

    if (file == null) {
        return null;
    }

    // Get the file details like size and date
    var response = await fetch(
        DRIVE_API_BASE + "/files/" + file.id + "?fields=id,name,size,modifiedTime",
        { headers: { 'Authorization': 'Bearer ' + token } }
    );

    if (response.ok == false) {
        return null;
    }

    var metadata = await response.json();

    // To find out how many manga are in the backup, we have to look inside the file
    var downloadResponse = await fetch(DRIVE_API_BASE + "/files/" + file.id + "?alt=media", {
        headers: { 'Authorization': 'Bearer ' + token }
    });

    var mangaCount = 0;
    if (downloadResponse.ok) {
        var data = await downloadResponse.json();
        if (data && data[DATA.LIBRARY_ENTRIES]) {
            if (Array.isArray(data[DATA.LIBRARY_ENTRIES])) {
                mangaCount = data[DATA.LIBRARY_ENTRIES].length;
            }
        }
    }

    return {
        id: metadata.id,
        size: formatBytes(parseInt(metadata.size || '0')),
        modifiedTime: new Date(metadata.modifiedTime).toLocaleString(),
        entryCount: mangaCount
    };
}

/**
 * Deletes the backup file from Google Drive.
 * @returns {Promise<boolean>} True if it worked
 */
export async function deleteBackup() {
    var token = await getAuthToken();
    var file = await findBackupFile(token);

    if (file == null) {
        return false;
    }

    var response = await fetch(DRIVE_API_BASE + "/files/" + file.id, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    return response.ok;
}

/**
 * Internal function to find the backup file in the hidden appData folder.
 * @param {string} token - OAuth2 token
 * @returns {Promise<Object|null>} The file object or null
 */
async function findBackupFile(token) {
    var nameFilter = encodeURIComponent("name='" + BACKUP_FILENAME + "'");
    var url = DRIVE_API_BASE + "/files?spaces=appDataFolder&q=" + nameFilter + "&fields=files(id,name,modifiedTime)";

    var response = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
    });

    if (response.ok == false) {
        return null;
    }

    var result = await response.json();
    if (result.files && result.files.length > 0) {
        return result.files[0];
    }
    
    return null;
}

/**
 * Converts bytes into a readable string like "500 KB" or "2.5 MB".
 * @param {number} bytes - The size in bytes
 * @returns {string} Human readable size
 */
function formatBytes(bytes) {
    if (bytes == 0) return '0 B';
    
    // We check the size manually with simple math
    if (bytes < 1024) {
        return bytes + " B";
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
    }
}
