/**
 * @fileoverview Google Drive sync operations for manga library backup.
 * Uses the appDataFolder space for hidden, app-specific storage.
 * 
 * The appDataFolder is:
 * - Hidden from user's Drive file view
 * - Automatically deleted if the app is uninstalled
 * - Perfect for app-specific sync data
 */

import { getAuthToken } from './gdrive-auth.js';

const BACKUP_FILENAME = 'manga_colormarker_sync.json';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Uploads backup data to Google Drive appDataFolder.
 * Creates new file on first sync, updates existing file on subsequent syncs.
 * 
 * @param {Object} data - The backup data object (library, history, settings)
 * @returns {Promise<{fileId: string, syncTime: number}>}
 * @throws {Error} If upload fails
 */
export async function uploadBackup(data) {
    const token = await getAuthToken();
    const syncTime = Date.now();
    
    // Add sync metadata to payload
    const payload = {
        ...data,
        syncTimestamp: syncTime,
        syncVersion: '1.0',
        extensionVersion: chrome.runtime?.getManifest?.()?.version || 'unknown'
    };

    // Check if backup file already exists
    const existingFile = await findBackupFile(token);

    // Prepare metadata
    const metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json'
    };

    // Only set parents for new files
    if (!existingFile) {
        metadata.parents = ['appDataFolder'];
    }

    // Create multipart form for upload
    const boundary = '---ColorMarkerSync' + Date.now();
    const body = createMultipartBody(boundary, metadata, payload);

    // Determine URL based on create vs update
    const url = existingFile
        ? `${DRIVE_UPLOAD_BASE}/files/${existingFile.id}?uploadType=multipart`
        : `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;

    const response = await fetch(url, {
        method: existingFile ? 'PATCH' : 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { fileId: result.id, syncTime };
}

/**
 * Downloads the latest backup from Google Drive.
 * 
 * @returns {Promise<Object|null>} Backup data object, or null if no backup exists
 * @throws {Error} If download fails (but not if file doesn't exist)
 */
export async function downloadBackup() {
    const token = await getAuthToken();
    const file = await findBackupFile(token);

    if (!file) {
        return null;
    }

    const response = await fetch(`${DRIVE_API_BASE}/files/${file.id}?alt=media`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Gets info about the cloud backup without downloading full content.
 * 
 * @returns {Promise<{id: string, size: string, modifiedTime: string, entryCount: number}|null>}
 */
export async function getBackupInfo() {
    const token = await getAuthToken();
    const file = await findBackupFile(token);

    if (!file) {
        return null;
    }

    // Get file metadata including size
    const response = await fetch(
        `${DRIVE_API_BASE}/files/${file.id}?fields=id,name,size,modifiedTime`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
        return null;
    }

    const metadata = await response.json();

    // Get entry count by downloading just the structure
    const data = await downloadBackup();
    const entryCount = data?.userBookmarks ? Object.keys(data.userBookmarks).length : 0;

    return {
        id: metadata.id,
        size: formatBytes(parseInt(metadata.size || '0')),
        modifiedTime: new Date(metadata.modifiedTime).toLocaleString(),
        entryCount
    };
}

/**
 * Deletes the backup file from Google Drive.
 * 
 * @returns {Promise<boolean>} True if deleted, false if no file existed
 */
export async function deleteBackup() {
    const token = await getAuthToken();
    const file = await findBackupFile(token);

    if (!file) {
        return false;
    }

    const response = await fetch(`${DRIVE_API_BASE}/files/${file.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return response.ok || response.status === 404;
}

/**
 * Merges remote and local data with conflict resolution.
 * Per-entry comparison using lastModified timestamps.
 * 
 * @param {Object} local - Local storage data
 * @param {Object} remote - Remote Drive data
 * @param {'newerWins'|'localWins'|'remoteWins'} strategy - Conflict resolution strategy
 * @returns {Object} Merged data
 */
export function mergeData(local, remote, strategy = 'newerWins') {
    const merged = { ...local };

    // Merge userBookmarks (main library)
    if (remote.userBookmarks) {
        merged.userBookmarks = mergeByKey(
            local.userBookmarks || {},
            remote.userBookmarks,
            strategy,
            'lastModified'
        );
    }

    // Merge readingHistory
    if (remote.readingHistory) {
        merged.readingHistory = mergeByKey(
            local.readingHistory || {},
            remote.readingHistory,
            strategy,
            'lastRead'
        );
    }

    // Merge personalData (tags, notes, ratings)
    if (remote.personalData) {
        merged.personalData = mergeByKey(
            local.personalData || {},
            remote.personalData,
            strategy,
            'updatedAt'
        );
    }

    // Merge customMarkers
    if (remote.customMarkers) {
        merged.customMarkers = remote.customMarkers;
    }

    // Preserve sync metadata from remote
    merged.syncTimestamp = remote.syncTimestamp;
    merged.syncVersion = remote.syncVersion;

    return merged;
}

// ============ Private Helper Functions ============

/**
 * Finds the backup file in appDataFolder.
 * @private
 */
async function findBackupFile(token) {
    const query = encodeURIComponent(`name='${BACKUP_FILENAME}'`);
    const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.files?.[0] || null;
}

/**
 * Creates multipart body for Drive upload.
 * @private
 */
function createMultipartBody(boundary, metadata, content) {
    const delimiter = `--${boundary}`;
    const closeDelimiter = `--${boundary}--`;

    return [
        delimiter,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(metadata),
        delimiter,
        'Content-Type: application/json',
        '',
        JSON.stringify(content, null, 2),
        closeDelimiter
    ].join('\r\n');
}

/**
 * Merges two objects by key using specified strategy.
 * @private
 */
function mergeByKey(local, remote, strategy, timestampField) {
    const merged = { ...local };

    for (const [key, remoteEntry] of Object.entries(remote)) {
        if (!merged[key]) {
            // New entry from remote
            merged[key] = remoteEntry;
        } else if (strategy === 'remoteWins') {
            merged[key] = remoteEntry;
        } else if (strategy === 'localWins') {
            // Keep local, do nothing
        } else {
            // newerWins - compare timestamps
            const localTime = merged[key][timestampField] || 0;
            const remoteTime = remoteEntry[timestampField] || 0;
            if (remoteTime > localTime) {
                merged[key] = remoteEntry;
            }
        }
    }

    return merged;
}

/**
 * Formats bytes to human-readable string.
 * @private
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
