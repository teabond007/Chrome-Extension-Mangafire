/**
 * @fileoverview Pinia store for profile and Google Drive sync state management.
 * Handles authentication state, sync preferences, and cloud backup operations.
 */

import { defineStore } from 'pinia';
import * as gdriveAuth from '../../../scripts/core/cloud/gdrive-auth.js';
import * as gdriveSync from '../../../scripts/core/cloud/gdrive-sync.js';
import { fetchMDList } from '../../../scripts/core/api/mangadex-api.js';
import { gatherStorageData, applyStorageData } from '../modules/storage-io.js';
import { TOGGLES, SETTINGS, DATA } from '../../../config.js';

export const useProfileStore = defineStore('profile', {
    state: () => ({
        // Authentication state
        isSignedIn: false,
        userEmail: null,
        userAvatar: null,
        
        // Sync state
        lastSyncTime: null,
        syncStatus: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
        syncProgress: 0,
        syncStatusMessage: '',
        lastSyncResult: null,
        
        // Sync preferences (persisted)
        autoSyncEnabled: false,
        syncLibrary: true,
        syncHistory: true,
        syncPersonal: true,
        syncSettings: true,
        syncCache: false,
        syncInterval: 1, // Default to 1 day
        
        
        // OAuth configuration status
        isOAuthConfigured: false,

        // Local Export/Import state
        lastLocalBackup: null,
        localExportSettings: {
            library: true,
            history: true,
            personalData: true,
            settings: true,
            cache: false,
            customSites: true
        },
        isMergeImport: true,

        // Cloud backup metadata
        cloudBackupInfo: null
    }),

    getters: {
        /**
         * Formats lastSyncTime for display.
         */
        lastSyncFormatted: (state) => {
            if (!state.lastSyncTime) return 'Never';
            const date = new Date(state.lastSyncTime);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
            return date.toLocaleDateString();
        }
    },

    actions: {
        /**
         * Initializes the profile store from persisted storage.
         */
        async initialize() {
            try {
                // Load persisted preferences
                const saved = await chrome.storage.local.get([
                    TOGGLES.AUTO_SYNC,
                    TOGGLES.SYNC_LIBRARY,
                    TOGGLES.SYNC_HISTORY_CLOUD,
                    TOGGLES.SYNC_PERSONAL,
                    TOGGLES.SYNC_SETTINGS,
                    TOGGLES.SYNC_CACHE,
                    DATA.LAST_SYNC_CLOUD,
                    SETTINGS.SYNC_INTERVAL,
                    DATA.LAST_BACKUP
                ]);

                this.autoSyncEnabled = saved[TOGGLES.AUTO_SYNC] ?? false;
                this.syncLibrary = saved[TOGGLES.SYNC_LIBRARY] ?? true;
                this.syncHistory = saved[TOGGLES.SYNC_HISTORY_CLOUD] ?? true;
                this.syncPersonal = saved[TOGGLES.SYNC_PERSONAL] ?? true;
                this.syncSettings = saved[TOGGLES.SYNC_SETTINGS] ?? true;
                this.syncCache = saved[TOGGLES.SYNC_CACHE] ?? false;
                this.syncInterval = saved[SETTINGS.SYNC_INTERVAL] ?? 1;
                this.lastSyncTime = saved[DATA.LAST_SYNC_CLOUD] ?? null;
                this.lastLocalBackup = saved[DATA.LAST_BACKUP] ?? null;

                // Check OAuth configuration
                this.isOAuthConfigured = this.checkOAuthConfig();

                // Check auth status if configured
                if (this.isOAuthConfigured) {
                    const token = await gdriveAuth.getAuthToken(false).catch(() => null);
                    if (token) {
                        this.isSignedIn = true;
                        // Parallelize user profile and cloud info fetching
                        await Promise.all([
                            this.loadUserProfile(),
                            this.updateCloudBackupInfo()
                        ]);
                    } else {
                        this.isSignedIn = false;
                    }
                }
            } catch (error) {
                console.error('[ProfileStore] Initialization error:', error);
            }
        },

        /**
         * Checks if OAuth2 is properly configured in manifest.
         */
        checkOAuthConfig() {
            try {
                // Check if chrome.identity API is available
                if (!chrome?.identity?.getAuthToken) {
                    return false;
                }
                
                // Check manifest for oauth2 config
                const manifest = chrome.runtime?.getManifest?.();
                if (!manifest) {
                    return false;
                }
                
                const clientId = manifest?.oauth2?.client_id;
                const hasIdentity = manifest?.permissions?.includes('identity');
                
                return !!(clientId && !clientId.includes('YOUR_CLIENT_ID') && hasIdentity);
            } catch (error) {
                return false;
            }
        },

        /**
         * Signs in with Google.
         */
        async signIn() {
            try {
                await gdriveAuth.getAuthToken(true);
                this.isSignedIn = true;
                await this.loadUserProfile();
                this.lastSyncResult = { type: 'success', message: 'Signed in successfully' };
            } catch (error) {
                this.lastSyncResult = { type: 'error', message: error.message };
                throw error;
            }
        },

        /**
         * Signs out and clears cached auth.
         */
        async signOut() {
            try {
                await gdriveAuth.revokeToken();
                this.isSignedIn = false;
                this.userEmail = null;
                this.userAvatar = null;
                this.lastSyncResult = { type: 'success', message: 'Signed out successfully' };
            } catch (error) {
                console.error('[ProfileStore] Sign out error:', error);
            }
        },

        /**
         * Loads user profile from Google.
         */
        async loadUserProfile() {
            try {
                const profile = await gdriveAuth.getUserProfile();
                this.userEmail = profile.email;
                this.userAvatar = profile.picture;
            } catch (error) {
                console.error('[ProfileStore] Failed to load profile:', error);
            }
        },

        /**
         * Uploads current data to Google Drive.
         */
        async uploadToCloud() {
            if (!this.isSignedIn) return;

            this.syncStatus = 'syncing';
            this.syncProgress = 0;
            this.syncStatusMessage = 'Preparing data...';

            try {
                // Gather data based on user preferences
                this.syncProgress = 20;
                const categories = {
                    library: this.syncLibrary,
                    history: this.syncHistory,
                    personalData: this.syncPersonal,
                    settings: this.syncSettings,
                    cache: this.syncCache,
                    customSites: true
                };
                const data = await gatherStorageData(categories);

                // Upload to Drive
                this.syncProgress = 40;
                this.syncStatusMessage = 'Uploading to Google Drive...';
                const result = await gdriveSync.uploadBackup(data);

                // Update state
                this.syncProgress = 100;
                this.lastSyncTime = result.syncTime;
                await chrome.storage.local.set({ [DATA.LAST_SYNC_CLOUD]: result.syncTime });

                this.syncStatus = 'success';
                this.lastSyncResult = {
                    type: 'success',
                    message: `Backed up successfully`
                };

                // Refresh cloud info
                await this.updateCloudBackupInfo();

            } catch (error) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: error.message };
                console.error('[ProfileStore] Upload error:', error);
            }
        },

        /**
         * Downloads and merges data from Google Drive.
         */
        async downloadFromCloud() {
            if (!this.isSignedIn) return;

            this.syncStatus = 'syncing';
            this.syncProgress = 0;
            this.syncStatusMessage = 'Connecting to Google Drive...';

            try {
                // Download from Drive
                this.syncProgress = 30;
                this.syncStatusMessage = 'Downloading backup...';
                const remote = await gdriveSync.downloadBackup();

                if (!remote) {
                    throw new Error('No backup found in cloud');
                }

                // Merge and apply data (Always use MERGE for cloud restore)
                this.syncProgress = 60;
                this.syncStatusMessage = 'Merging data...';
                await applyStorageData(remote, true);

                this.syncProgress = 100;
                this.lastSyncTime = Date.now();
                await chrome.storage.local.set({ [DATA.LAST_SYNC_CLOUD]: this.lastSyncTime });

                this.syncStatus = 'success';
                this.lastSyncResult = {
                    type: 'success',
                    message: 'Synced from cloud successfully'
                };

                // Trigger UI refresh
                window.dispatchEvent(new CustomEvent('sync-data-updated'));

            } catch (error) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: error.message };
                console.error('[ProfileStore] Download error:', error);
            }
        },

        /**
         * Refreshes cloud backup info.
         */
        async updateCloudBackupInfo() {
            if (!this.isSignedIn) return;

            try {
                this.cloudBackupInfo = await gdriveSync.getBackupInfo();
            } catch (error) {
                console.error('[ProfileStore] Failed to get cloud info:', error);
                this.cloudBackupInfo = null;
            }
        },

        /**
         * Clears the last sync result message from UI.
         */
        clearSyncResult() {
            this.lastSyncResult = null;
        },

        /**
         * Clears all cloud backup data.
         */
        async clearCloudData() {
            if (!this.isSignedIn) return;

            try {
                await gdriveSync.deleteBackup();
                this.cloudBackupInfo = null;
                this.lastSyncResult = {
                    type: 'success',
                    message: 'Cloud data cleared'
                };
            } catch (error) {
                this.lastSyncResult = { type: 'error', message: error.message };
            }
        },

        /**
         * Persists sync preferences when they change.
         */
        async savePreferences() {
            await chrome.storage.local.set({
                [TOGGLES.AUTO_SYNC]: this.autoSyncEnabled,
                [TOGGLES.SYNC_LIBRARY]: this.syncLibrary,
                [TOGGLES.SYNC_HISTORY_CLOUD]: this.syncHistory,
                [TOGGLES.SYNC_PERSONAL]: this.syncPersonal,
                [TOGGLES.SYNC_SETTINGS]: this.syncSettings,
                [TOGGLES.SYNC_CACHE]: this.syncCache,
                [SETTINGS.SYNC_INTERVAL]: this.syncInterval
            });
        },

        /**
         * Sets the automatic synchronization interval.
         * @param {number} days - Interval in days (1-30)
         */
        async setSyncInterval(days) {
            const val = Math.max(1, Math.min(30, parseInt(days) || 1));
            this.syncInterval = val;
            await chrome.storage.local.set({ [SETTINGS.SYNC_INTERVAL]: val });
        },

        /**
         * Generic data gathering helper.
         */
        async prepareExportData(categories) {
            return await gatherStorageData(categories);
        },

        /**
         * Exports data to a local JSON file.
         */
        async exportLocalData() {
            this.syncStatus = 'syncing';
            this.syncStatusMessage = 'Preparing export...';
            
            try {
                const data = await this.prepareExportData(this.localExportSettings);
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `mangabook_backup_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.lastLocalBackup = Date.now();
                await chrome.storage.local.set({ [DATA.LAST_BACKUP]: this.lastLocalBackup });
                
                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Local backup exported successfully' };
            } catch (error) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: `Export failed: ${error.message}` };
            }
        },

        /**
         * Imports data from a local file.
         */
        async importLocalData(file, isMerge) {
            this.syncStatus = 'syncing';
            this.syncStatusMessage = 'Parsing file...';

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        await applyStorageData(importedData, isMerge);
                        
                        this.syncStatus = 'success';
                        this.lastSyncResult = { type: 'success', message: 'Import successful! Reloading...' };
                        
                        // Small delay before reload to let user see success
                        setTimeout(() => location.reload(), 1500);
                        resolve();
                    } catch (error) {
                        this.syncStatus = 'error';
                        this.lastSyncResult = { type: 'error', message: `Import failed: ${error.message}` };
                        reject(error);
                    }
                };
                reader.onerror = () => {
                    this.syncStatus = 'error';
                    this.lastSyncResult = { type: 'error', message: 'Failed to read file' };
                    reject(new Error('Failed to read file'));
                };
                reader.readAsText(file);
            });
        },

        /**
         * Imports manga from a MangaDex list.
         */
        async importMDList(inputValue) {
            if (!inputValue) return;

            this.syncStatus = 'syncing';
            this.syncStatusMessage = 'Fetching MangaDex list...';

            try {
                const result = await fetchMDList(inputValue);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                if (result.manga.length === 0) {
                    throw new Error('No manga found in this list.');
                }
                
                const data = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES]);
                let savedEntries = Array.isArray(data[DATA.LIBRARY_ENTRIES]) ? data[DATA.LIBRARY_ENTRIES] : [];
                
                // Deep log for MD import
                console.log('[ProfileStore] MD Import current entries count:', savedEntries.length);
                
                const existingTitles = new Set(savedEntries.map(e => e.title.toLowerCase()));
                const existingMdIds = new Set(savedEntries.filter(e => e.anilistData?.mangadexId).map(e => e.anilistData.mangadexId));
                
                let added = 0;
                let skipped = 0;
                
                result.manga.forEach(manga => {
                    const title = manga.title?.english || manga.title?.romaji || 'Unknown';
                    const mdId = manga.mangadexId;
                    
                    if (existingTitles.has(title.toLowerCase()) || existingMdIds.has(mdId)) {
                        skipped++;
                        return;
                    }
                    
                    savedEntries.push({
                        title: title,
                        status: 'Plan to Read',
                        readChapters: [],
                        anilistData: manga,
                        customStatus: null,
                        lastUpdated: Date.now(),
                        importedFrom: 'MDList'
                    });
                    added++;
                });
                
                // Use plain object for storage set
                const plainEntries = JSON.parse(JSON.stringify(savedEntries));
                await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: plainEntries });
                
                this.syncStatus = 'success';
                this.lastSyncResult = { 
                    type: 'success', 
                    message: `Imported ${added} manga from "${result.listName}". ${skipped} duplicates skipped.` 
                };
                
                // Trigger refresh
                window.dispatchEvent(new CustomEvent('sync-data-updated'));
            } catch (error) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: `MD Import failed: ${error.message}` };
            }
        }
    }
});
