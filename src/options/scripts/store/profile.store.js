/**
 * @fileoverview Pinia store for profile and Google Drive sync state management.
 * Handles authentication state, sync preferences, and cloud backup operations.
 */

import { defineStore } from 'pinia';
import { storage } from '../core/storage-adapter.js';
import * as gdriveAuth from '../../../scripts/core/gdrive-auth.js';
import * as gdriveSync from '../../../scripts/core/gdrive-sync.js';

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
        syncSettings: false,
        conflictStrategy: 'newerWins', // 'newerWins' | 'localWins' | 'remoteWins'
        
        // Cloud backup info
        cloudBackupInfo: null,
        
        // OAuth configuration status
        isOAuthConfigured: false
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
                const saved = await storage.get([
                    'profileAutoSync',
                    'profileSyncLibrary',
                    'profileSyncHistory',
                    'profileSyncPersonal',
                    'profileSyncSettings',
                    'profileConflictStrategy',
                    'profileLastSync'
                ]);

                this.autoSyncEnabled = saved.profileAutoSync ?? false;
                this.syncLibrary = saved.profileSyncLibrary ?? true;
                this.syncHistory = saved.profileSyncHistory ?? true;
                this.syncPersonal = saved.profileSyncPersonal ?? true;
                this.syncSettings = saved.profileSyncSettings ?? false;
                this.conflictStrategy = saved.profileConflictStrategy ?? 'newerWins';
                this.lastSyncTime = saved.profileLastSync ?? null;

                // Check OAuth configuration
                this.isOAuthConfigured = this.checkOAuthConfig();

                // Check auth status if configured
                if (this.isOAuthConfigured) {
                    this.isSignedIn = await gdriveAuth.isSignedIn();
                    if (this.isSignedIn) {
                        await this.loadUserProfile();
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
                    console.log('[ProfileStore] chrome.identity not available');
                    return false;
                }
                
                // Check manifest for oauth2 config
                const manifest = chrome.runtime?.getManifest?.();
                if (!manifest) {
                    console.log('[ProfileStore] Could not get manifest');
                    return false;
                }
                
                const clientId = manifest?.oauth2?.client_id;
                const hasIdentity = manifest?.permissions?.includes('identity');
                
                if (!clientId || clientId.includes('YOUR_CLIENT_ID')) {
                    console.log('[ProfileStore] OAuth client_id not configured');
                    return false;
                }
                
                if (!hasIdentity) {
                    console.log('[ProfileStore] identity permission missing');
                    return false;
                }
                
                console.log('[ProfileStore] OAuth configured correctly');
                return true;
            } catch (error) {
                console.error('[ProfileStore] checkOAuthConfig error:', error);
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
                // Gather data to sync
                this.syncProgress = 20;
                const data = await this.gatherSyncData();

                // Upload to Drive
                this.syncProgress = 40;
                this.syncStatusMessage = 'Uploading to Google Drive...';
                const result = await gdriveSync.uploadBackup(data);

                // Update state
                this.syncProgress = 100;
                this.lastSyncTime = result.syncTime;
                await this.persistPreference('profileLastSync', result.syncTime);

                this.syncStatus = 'success';
                const entryCount = data.userBookmarks ? Object.keys(data.userBookmarks).length : 0;
                this.lastSyncResult = {
                    type: 'success',
                    message: `Backed up ${entryCount} entries successfully`
                };

                // Refresh cloud info
                await this.refreshCloudInfo();

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

                // Get local data and merge
                this.syncProgress = 60;
                this.syncStatusMessage = 'Merging data...';
                const local = await this.gatherSyncData();
                const merged = gdriveSync.mergeData(local, remote, this.conflictStrategy);

                // Apply merged data
                this.syncProgress = 80;
                this.syncStatusMessage = 'Saving...';
                await this.applySyncData(merged);

                this.syncProgress = 100;
                this.lastSyncTime = Date.now();
                await this.persistPreference('profileLastSync', this.lastSyncTime);

                this.syncStatus = 'success';
                this.lastSyncResult = {
                    type: 'success',
                    message: 'Restored from cloud successfully'
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
        async refreshCloudInfo() {
            if (!this.isSignedIn) return;

            try {
                this.cloudBackupInfo = await gdriveSync.getBackupInfo();
            } catch (error) {
                console.error('[ProfileStore] Failed to get cloud info:', error);
                this.cloudBackupInfo = null;
            }
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
         * Gathers data based on sync preferences.
         */
        async gatherSyncData() {
            const keys = [];
            if (this.syncLibrary) keys.push('userBookmarks', 'savedEntriesMerged');
            if (this.syncHistory) keys.push('readingHistory');
            if (this.syncPersonal) keys.push('personalData');
            if (this.syncSettings) {
                keys.push('theme', 'highlightThickness', 'libraryThickness', 'customMarkers');
            }

            return storage.get(keys);
        },

        /**
         * Applies synced data to local storage.
         */
        async applySyncData(data) {
            // Only apply fields that were synced
            const toSave = {};
            if (this.syncLibrary) {
                if (data.userBookmarks) toSave.userBookmarks = data.userBookmarks;
                if (data.savedEntriesMerged) toSave.savedEntriesMerged = data.savedEntriesMerged;
            }
            if (this.syncHistory && data.readingHistory) {
                toSave.readingHistory = data.readingHistory;
            }
            if (this.syncPersonal && data.personalData) {
                toSave.personalData = data.personalData;
            }
            if (this.syncSettings) {
                if (data.theme) toSave.theme = data.theme;
                if (data.highlightThickness) toSave.highlightThickness = data.highlightThickness;
                if (data.libraryThickness) toSave.libraryThickness = data.libraryThickness;
                if (data.customMarkers) toSave.customMarkers = data.customMarkers;
            }

            await storage.set(toSave);
        },

        /**
         * Persists a single preference to storage.
         */
        async persistPreference(key, value) {
            await storage.set({ [key]: value });
        },

        /**
         * Persists sync preferences when they change.
         */
        async savePreferences() {
            await storage.set({
                profileAutoSync: this.autoSyncEnabled,
                profileSyncLibrary: this.syncLibrary,
                profileSyncHistory: this.syncHistory,
                profileSyncPersonal: this.syncPersonal,
                profileSyncSettings: this.syncSettings,
                profileConflictStrategy: this.conflictStrategy
            });
        }
    }
});
