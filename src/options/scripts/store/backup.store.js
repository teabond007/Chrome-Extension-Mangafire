/**
 * @fileoverview Pinia store for local backup (export and import) with custom site permissions handling.
 * This handles saving your library to a file and loading it back safely.
 */

import { defineStore } from 'pinia';
import { gatherStorageData, applyStorageData } from '../modules/storage-io.js';
import { DATA } from '../../../config.js';

export const useBackupStore = defineStore('backup', {
    state: function() {
        return {
            // Tracks if we are currently doing something (used to show spinner)
            syncStatus: 'idle', // 'idle', 'syncing', 'success', or 'error'

            // Shows a message to the user after an action
            lastSyncResult: null,

            // When was the last time we saved a file backup
            lastLocalBackup: null,

            // Flow management for imported custom sites requiring permissions
            needsPermissions: false,
            pendingImportData: null,
            pendingOrigins: [],
            pendingCustomSites: []
        };
    },

    actions: {
        /**
         * Loads saved info from browser storage when the page first opens.
         */
        async initialize() {
            try {
                var saved = await chrome.storage.local.get([DATA.LAST_BACKUP]);
                this.lastLocalBackup = saved[DATA.LAST_BACKUP] || null;
            } catch (err) {
                console.log('[BackupStore] Could not load backup info: ' + err);
            }
        },

        /**
         * Saves all your data to a .json file on your computer.
         * The user can use this file later to restore their data.
         */
        async exportLocalData() {
            this.syncStatus = 'syncing';

            try {
                // Get all our data from the extension storage
                var data = await gatherStorageData();

                // Turn the data object into a text string
                var jsonString = JSON.stringify(data, null, 2);

                // Create a temporary downloadable file in the browser
                var blob = new Blob([jsonString], { type: 'application/json' });
                var url = URL.createObjectURL(blob);

                // Create a fake link and click it to trigger the download
                var anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = 'mangabook_backup_' + new Date().toISOString().slice(0, 10) + '.json';
                anchor.click();

                // Save the time of this backup so we can show it in the UI
                this.lastLocalBackup = Date.now();
                var saveObj = {};
                saveObj[DATA.LAST_BACKUP] = this.lastLocalBackup;
                await chrome.storage.local.set(saveObj);

                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Backup file saved successfully!' };
            } catch (err) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: 'Export failed: ' + err.message };
            }
        },

        /**
         * Reads a .json file from your computer and parses it.
         * Checks if we need to request new site permissions from the user.
         * @param {File} file - The file the user selected from their computer
         */
        async importLocalData(file) {
            this.syncStatus = 'syncing';
            this.lastSyncResult = null;
            this.needsPermissions = false;
            this.pendingImportData = null;
            this.pendingOrigins = [];
            this.pendingCustomSites = [];

            var self = this;
            var reader = new FileReader();

            // This function runs when the file is done being read
            reader.onload = async function(event) {
                try {
                    // Parse the JSON text back into an object
                    var importedData = JSON.parse(event.target.result);

                    // Look for custom sites in the imported data
                    var customSites = importedData[DATA.CUSTOM_SITES];
                    var origins = [];

                    if (Array.isArray(customSites)) {
                        for (var i = 0; i < customSites.length; i++) {
                            var site = customSites[i];
                            if (site && site.hostname) {
                                // Add standard host matching patterns
                                origins.push('http://' + site.hostname + '/*');
                                origins.push('https://' + site.hostname + '/*');
                            }
                        }
                    }

                    // Check if we need to request permissions for these origins
                    var needsAuth = false;
                    if (origins.length > 0) {
                        var alreadyHas = await chrome.permissions.contains({ origins: origins });
                        if (!alreadyHas) {
                            needsAuth = true;
                        }
                    }

                    if (needsAuth) {
                        // Save backup data in memory and trigger the permissions prompt UI
                        self.pendingImportData = importedData;
                        self.pendingOrigins = origins;
                        self.pendingCustomSites = customSites;
                        self.needsPermissions = true;
                        self.syncStatus = 'idle';
                    } else {
                        // No new permissions needed, complete import immediately
                        await self.completeImport(importedData);
                    }
                } catch (err) {
                    self.syncStatus = 'error';
                    self.lastSyncResult = { type: 'error', message: 'Import failed: ' + err.message };
                }
            };

            // Start reading the file
            reader.readAsText(file);
        },

        /**
         * Called when the user clicks the "Grant Permissions" button.
         * Requests host permissions inside a valid user gesture context, then imports.
         */
        async grantPermissionsAndImport() {
            if (!this.pendingImportData) return;

            this.syncStatus = 'syncing';

            try {
                // Request host permissions from Chrome
                // We copy the origins to a clean, raw array to avoid Vue Proxy type issues in Chrome bindings
                var cleanOrigins = [];
                for (var i = 0; i < this.pendingOrigins.length; i++) {
                    cleanOrigins.push(this.pendingOrigins[i]);
                }

                var granted = await chrome.permissions.request({
                    origins: cleanOrigins
                });

                if (!granted) {
                    console.log('[BackupStore] Host permissions denied by user. Proceeding with import anyway.');
                }

                // Finish saving the data
                await this.completeImport(this.pendingImportData);
            } catch (err) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: 'Permission request failed: ' + err.message };
            }
        },

        /**
         * Helper function to save the data to storage and reload the extension.
         * @param {Object} data - The data object to save
         */
        async completeImport(data) {
            try {
                // Apply the data (true means merge instead of replace)
                await applyStorageData(data, true);

                // Let the background service worker know custom sites changed so it updates scripting
                chrome.runtime.sendMessage({ type: 'custom-sites-updated' });

                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Import successful! The page will reload now.' };

                this.needsPermissions = false;
                this.pendingImportData = null;
                this.pendingOrigins = [];
                this.pendingCustomSites = [];

                // Reload after a short delay so the user can see the success message
                setTimeout(function() {
                    location.reload();
                }, 1500);
            } catch (err) {
                this.syncStatus = 'error';
                this.lastSyncResult = { type: 'error', message: 'Save failed: ' + err.message };
            }
        },

        /**
         * Resets state if user cancels the permission prompt.
         */
        cancelImport() {
            this.needsPermissions = false;
            this.pendingImportData = null;
            this.pendingOrigins = [];
            this.pendingCustomSites = [];
            this.syncStatus = 'idle';
            this.lastSyncResult = null;
        }
    }
});
