/**
 * @fileoverview Pinia store for user profile and Google Drive sync.
 * This file keeps track of if you are logged in and handles sync buttons.

 */

import { defineStore } from 'pinia';
import * as gdriveAuth from '../../../scripts/core/cloud/gdrive-auth.js';
import * as gdriveSync from '../../../scripts/core/cloud/gdrive-sync.js';
import { gatherStorageData, applyStorageData } from '../modules/storage-io.js';
import { TOGGLES, SETTINGS, DATA } from '../../../config.js';

export const useProfileStore = defineStore('profile', {
    state: function() {
        return {
            // Authentication info
            isSignedIn: false,
            userEmail: null,
            userAvatar: null,
            
            // Sync status info
            lastSyncTime: null,
            syncStatus: 'idle', // 'idle', 'syncing', 'success', or 'error'
            syncProgress: 0,
            syncStatusMessage: '',
            lastSyncResult: null,
            
            // Preferences
            autoSyncEnabled: false,
            syncInterval: 1, // in days
            
            // Backup info
            lastLocalBackup: null,
            cloudBackupInfo: null
        };
    },

    getters: {
        /**
         * Returns a nice looking date for the last sync.
         */
        lastSyncFormatted: function(state) {
            if (!state.lastSyncTime) {
                return 'Never';
            }
            var date = new Date(state.lastSyncTime);
            return date.toLocaleDateString() + " " + date.toLocaleTimeString();
        }
    },

    actions: {
        /**
         * Initializes the store when the app starts.
         */
        async initialize() {
            try {
                // Load our settings from the browser storage
                var keys = [
                    TOGGLES.AUTO_SYNC,
                    DATA.LAST_SYNC_CLOUD,
                    DATA.LAST_BACKUP,
                    SETTINGS.SYNC_INTERVAL
                ];

                var saved = await chrome.storage.local.get(keys);

                this.autoSyncEnabled = saved[TOGGLES.AUTO_SYNC] || false;
                this.syncInterval = saved[SETTINGS.SYNC_INTERVAL] || 1;
                this.lastSyncTime = saved[DATA.LAST_SYNC_CLOUD] || null;
                this.lastLocalBackup = saved[DATA.LAST_BACKUP] || null;

                // Check if we already have a valid login token
                var token = await gdriveAuth.getAuthToken(false).catch(function() { return null; });
                
                if (token) {
                    this.isSignedIn = true;
                    console.log("[ProfileStore] User is logged in. Loading details...");
                    // We load these one after another
                    await this.loadUserProfile();
                    await this.updateCloudBackupInfo();
                } else {
                    this.isSignedIn = false;
                }
            } catch (err) {
                console.log("[ProfileStore] Error during startup: " + err);
            }
        },

        /**
         * Starts the login process.
         */
        async signIn() {
            try {
                await gdriveAuth.getAuthToken(true);
                this.isSignedIn = true;
                await this.loadUserProfile();
                this.lastSyncResult = { type: 'success', message: 'Successfully signed in with Google!' };
            } catch (err) {
                this.lastSyncResult = { type: 'error', message: err.message };
            }
        },

        /**
         * Logs the user out.
         */
        async signOut() {
            try {
                await gdriveAuth.revokeToken();
                this.isSignedIn = false;
                this.userEmail = null;
                this.userAvatar = null;
                this.lastSyncResult = { type: 'success', message: 'You have been signed out.' };
            } catch (err) {
                console.log("[ProfileStore] Sign out error: " + err);
            }
        },

        /**
         * Gets user email and picture from Google.
         */
        async loadUserProfile() {
            try {
                var profile = await gdriveAuth.getUserProfile();
                this.userEmail = profile.email;
                this.userAvatar = profile.picture;
            } catch (err) {
                console.log("[ProfileStore] Could not load user profile.");
            }
        },

        /**
         * Sends local data to Google Drive.
         */
        async uploadToCloud() {
            if (this.isSignedIn == false) return;

            this.syncStatus = 'syncing';
            this.syncProgress = 10;
            this.syncStatusMessage = 'Getting data ready...';

            try {
                var data = await gatherStorageData();
                
                this.syncProgress = 50;
                this.syncStatusMessage = 'Uploading to Google Drive...';
                
                var result = await gdriveSync.uploadBackup(data);

                this.lastSyncTime = result.syncTime;
                
                // Save the new sync time to storage
                var saveObj = {};
                saveObj[DATA.LAST_SYNC_CLOUD] = result.syncTime;
                await chrome.storage.local.set(saveObj);

                this.syncStatus = 'success';
                this.syncProgress = 100;
                this.lastSyncResult = { type: 'success', message: 'Backup successful!' };
                
                // Refresh the file info we show in the UI
                await this.updateCloudBackupInfo();
            } catch (err) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: 'Upload failed: ' + err.message };
            }
        },

        /**
         * Gets data from Google Drive and merges it into our local library.
         */
        async downloadFromCloud() {
            if (this.isSignedIn == false) return;

            this.syncStatus = 'syncing';
            this.syncProgress = 20;
            this.syncStatusMessage = 'Connecting to Google Drive...';

            try {
                var remoteData = await gdriveSync.downloadBackup();

                if (remoteData == null) {
                    throw new Error('We could not find any backup file in your Google Drive.');
                }

                this.syncProgress = 70;
                this.syncStatusMessage = 'Merging data into your library...';
                
                // Apply the downloaded data (true means merge instead of replace)
                await applyStorageData(remoteData, true);

                this.lastSyncTime = Date.now();
                var saveObj = {};
                saveObj[DATA.LAST_SYNC_CLOUD] = this.lastSyncTime;
                await chrome.storage.local.set(saveObj);

                this.syncStatus = 'success';
                this.syncProgress = 100;
                this.lastSyncResult = { type: 'success', message: 'Sync from cloud finished!' };
            } catch (err) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: 'Download failed: ' + err.message };
            }
        },

        /**
         * Gets the cloud file metadata (size, date) to show in the UI.
         */
        async updateCloudBackupInfo() {
            if (this.isSignedIn == false) return;
            try {
                this.cloudBackupInfo = await gdriveSync.getBackupInfo();
            } catch (err) {
                this.cloudBackupInfo = null;
            }
        },

        /**
         * Saves sync preferences like Auto-Sync.
         */
        async savePreferences() {
            var prefs = {};
            prefs[TOGGLES.AUTO_SYNC] = this.autoSyncEnabled;
            prefs[SETTINGS.SYNC_INTERVAL] = this.syncInterval;
            await chrome.storage.local.set(prefs);
        },

        /**
         * Saves all your data to a .json file on your computer.
         */
        async exportLocalData() {
            this.syncStatus = 'syncing';
            try {
                var data = await gatherStorageData();
                var jsonString = JSON.stringify(data, null, 2);
                
                // Create a temporary link to download the file
                var blob = new Blob([jsonString], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                
                var anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = "mangabook_backup_" + new Date().toISOString().slice(0, 10) + ".json";
                anchor.click();
                
                this.lastLocalBackup = Date.now();
                var saveObj = {};
                saveObj[DATA.LAST_BACKUP] = this.lastLocalBackup;
                await chrome.storage.local.set(saveObj);
                
                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Local backup file saved.' };
            } catch (err) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: 'Export failed: ' + err.message };
            }
        },

        /**
         * Reads a .json file from your computer and adds it to your library.
         */
        async importLocalData(file, isMerge) {
            this.syncStatus = 'syncing';
            this.syncStatusMessage = 'Reading file...';
            
            var self = this;
            var reader = new FileReader();
            
            reader.onload = async function(event) {
                try {
                    var importedData = JSON.parse(event.target.result);
                    await applyStorageData(importedData, isMerge);
                    
                    self.syncStatus = 'success';
                    self.lastSyncResult = { type: 'success', message: 'Import successful! The page will reload now.' };
                    
                    // Reload after a short delay so the user can see the success message
                    setTimeout(function() {
                        location.reload();
                    }, 1500);
                } catch (err) {
                    self.syncStatus = 'error';
                    self.lastSyncResult = { type: 'error', message: 'Import failed: ' + err.message };
                }
            };
            
            reader.readAsText(file);
        }
    }
});
