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
            console.log("initializing backup store");
            try {
                var saved = await chrome.storage.local.get([DATA.LAST_BACKUP]);
                this.lastLocalBackup = saved[DATA.LAST_BACKUP] || null;
                console.log("backup store loaded");
            } catch (err) {
                console.log("load backup info error: " + err);
            }
        },

        async exportLocalData() {
            console.log("exporting local backup");
            this.syncStatus = 'syncing';

            try {
                // Get all our data from the extension storage
                console.log("gathering all storage data");
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
                console.log("export successful");
            } catch (err) {
                this.syncStatus = 'error';
                console.log("export error: " + err.message);
                this.lastSyncResult = { type: 'error', message: 'Export failed: ' + err.message };
            }
        },

        async importLocalData(file) {
            console.log("importing local backup file");
            this.syncStatus = 'syncing';
            this.lastSyncResult = null;
            this.needsPermissions = false;
            this.pendingImportData = null;
            this.pendingOrigins = [];
            this.pendingCustomSites = [];

            var self = this;
            try {
                var reader = new FileReader();

                reader.onload = async function(event) {
                    try {
                        console.log("parsing import file json");
                        var importedData = JSON.parse(event.target.result);

                        // Look for custom sites in the imported data
                        var customSites = importedData[DATA.CUSTOM_SITES];
                        var origins = [];

                        if (Array.isArray(customSites)) {
                            console.log("checking custom site origins");
                            for (var i = 0; i < customSites.length; i++) {
                                var site = customSites[i];
                                if (site && site.hostname) {
                                    origins.push('http://' + site.hostname + '/*');
                                    origins.push('https://' + site.hostname + '/*');
                                }
                            }
                        }

                        // Check if we need to request permissions for these origins
                        var needsAuth = false;
                        if (origins.length > 0) {
                            console.log("checking origins permissions");
                            var alreadyHas = await chrome.permissions.contains({ origins: origins });
                            if (!alreadyHas) {
                                needsAuth = true;
                            }
                        }

                        if (needsAuth) {
                            console.log("new permissions needed, showing dialog");
                            self.pendingImportData = importedData;
                            self.pendingOrigins = origins;
                            self.pendingCustomSites = customSites;
                            self.needsPermissions = true;
                            self.syncStatus = 'idle';
                        } else {
                            console.log("no new permissions needed, doing complete import");
                            await self.completeImport(importedData);
                        }
                    } catch (err) {
                        self.syncStatus = 'error';
                        console.log("parse error: " + err.message);
                        self.lastSyncResult = { type: 'error', message: 'Import failed: ' + err.message };
                    }
                };

                // Start reading the file
                console.log("reading backup file text");
                reader.readAsText(file);
            } catch (err) {
                this.syncStatus = 'error';
                console.log("read error: " + err.message);
            }
        },

        async grantPermissionsAndImport() {
            console.log("requesting origins permissions from user");
            if (!this.pendingImportData) {
                console.log("pending import data not found");
                return;
            }

            this.syncStatus = 'syncing';

            try {
                // Request host permissions from Chrome
                var cleanOrigins = [];
                for (var i = 0; i < this.pendingOrigins.length; i++) {
                    cleanOrigins.push(this.pendingOrigins[i]);
                }

                console.log("prompting user for permissions");
                var granted = await chrome.permissions.request({
                    origins: cleanOrigins
                });

                if (!granted) {
                    console.log('permissions denied, doing import anyway');
                } else {
                    console.log('permissions granted');
                }

                await this.completeImport(this.pendingImportData);
            } catch (err) {
                this.syncStatus = 'error';
                console.log("permissions request error: " + err.message);
                this.lastSyncResult = { type: 'error', message: 'Permission request failed: ' + err.message };
            }
        },

        async completeImport(data) {
            console.log("completing backup import");
            try {
                await applyStorageData(data, true);

                // Let background script know custom sites changed
                chrome.runtime.sendMessage({ type: 'custom-sites-updated' });

                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Import successful! Reloading page...' };
                console.log("import complete, reloading");

                this.needsPermissions = false;
                this.pendingImportData = null;
                this.pendingOrigins = [];
                this.pendingCustomSites = [];

                setTimeout(function() {
                    location.reload();
                }, 1500);
            } catch (err) {
                this.syncStatus = 'error';
                console.log("import save error: " + err.message);
                this.lastSyncResult = { type: 'error', message: 'Save failed: ' + err.message };
            }
        },

        cancelImport() {
            console.log("cancelled import");
            this.needsPermissions = false;
            this.pendingImportData = null;
            this.pendingOrigins = [];
            this.pendingCustomSites = [];
            this.syncStatus = 'idle';
            this.lastSyncResult = null;
        },
    }
});
