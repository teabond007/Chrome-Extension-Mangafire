/**
 * @fileoverview Pinia store for all user settings and custom status management.
 * This file keeps track of things like theme, border thickness, and your custom status markers.

 */
import { defineStore } from 'pinia';
import { TOGGLES, SETTINGS, DATA, BORDER_DEFAULTS } from '../../../config.js';

export const useSettingsStore = defineStore('settings', {
    state: function() {
        return {
            activeTab: 'settings', // Current visible tab in options page
            theme: 'dark',
            isCustomTheme: false,
            customTheme: {
                bg: '#0b1437',
                sidebar: '#111c44',
                accent: '#7551FF',
                text: '#ffffff'
            },
            highlightThickness: 4,     // External websites
            libraryThickness: 4,       // Internal library entries
            borderStyle: 'solid',
            highlightEnabled: true,
            libraryBordersEnabled: true,
            libraryHideNoHistory: false,
            cardViewSize: 'large',     // 'compact', 'large', 'list'
            quickActions: true,
            libraryShowRibbons: true,
            syncAndMarkRead: true,
            progressTracking: true,
            familyFriendlyEnabled: false,
            customStatuses: [],
            customStatusEnabled: false,
            isLoaded: false
        };
    },

    actions: {
        /**
         * Loads all settings from the browser's storage.
         */
        async loadSettings() {
            console.log("loading settings");
            try {
                // All the keys we want to get from storage
                var keys = [
                    SETTINGS.THEME, 
                    TOGGLES.IS_CUSTOM_THEME,
                    SETTINGS.CUSTOM_THEME_DATA,
                    SETTINGS.HIGHLIGHT_THICKNESS, 
                    SETTINGS.LIBRARY_THICKNESS,
                    SETTINGS.BORDER_STYLE,
                    TOGGLES.QUICK_ACTIONS,
                    TOGGLES.HISTORY_TRACKING,
                    TOGGLES.PROGRESS_TRACKING,
                    SETTINGS.VIEW_MODE,
                    TOGGLES.LIBRARY_HIDE_NO_HISTORY,
                    DATA.CUSTOM_STATUSES,
                    TOGGLES.CUSTOM_STATUS_ENABLED,
                    TOGGLES.LIBRARY_BORDERS,
                    TOGGLES.FAMILY_FRIENDLY,
                    TOGGLES.LIBRARY_SHOW_RIBBONS
                ];

                // Make sure we only use keys that are actually defined
                var cleanKeys = [];
                for (var i = 0; i < keys.length; i++) {
                    if (keys[i] != undefined) {
                        cleanKeys.push(keys[i]);
                    }
                }

                console.log("getting local data keys");
                var data = await chrome.storage.local.get(cleanKeys);

                // Set the store values to what we found (or use defaults)
                this.theme = data[SETTINGS.THEME] || 'dark';
                this.isCustomTheme = data[TOGGLES.IS_CUSTOM_THEME] == true;
                
                if (data[SETTINGS.CUSTOM_THEME_DATA]) {
                    this.customTheme = data[SETTINGS.CUSTOM_THEME_DATA];
                }
                
                this.highlightThickness = parseInt(data[SETTINGS.HIGHLIGHT_THICKNESS]) || 4;
                this.libraryThickness = parseInt(data[SETTINGS.LIBRARY_THICKNESS]) || 4;
                this.borderStyle = data[SETTINGS.BORDER_STYLE] || BORDER_DEFAULTS.style;

                this.quickActions = data[TOGGLES.QUICK_ACTIONS] !== false;
                this.syncAndMarkRead = data[TOGGLES.HISTORY_TRACKING] !== false;
                this.progressTracking = data[TOGGLES.PROGRESS_TRACKING] !== false;
                
                this.cardViewSize = data[SETTINGS.VIEW_MODE] || 'large';
                this.libraryHideNoHistory = data[TOGGLES.LIBRARY_HIDE_NO_HISTORY] == true;
                
                if (Array.isArray(data[DATA.CUSTOM_STATUSES])) {
                    this.customStatuses = data[DATA.CUSTOM_STATUSES];
                } else {
                    this.customStatuses = [];
                }
                
                this.customStatusEnabled = data[TOGGLES.CUSTOM_STATUS_ENABLED] == true;
                this.highlightEnabled = data[TOGGLES.LIBRARY_BORDERS] !== false;
                this.familyFriendlyEnabled = data[TOGGLES.FAMILY_FRIENDLY] == true;
                this.libraryShowRibbons = data[TOGGLES.LIBRARY_SHOW_RIBBONS] !== false;

                this.isLoaded = true;
                console.log("settings loaded successfully");
            } catch (err) {
                console.log("load settings error: " + err);
            }
        },

        async updateSetting(key, value) {
            console.log("updating setting: " + key);
            try {
                // Update the local state first
                this[key] = value;

                // Figure out which storage key to use
                var sKey = null;
                if (key == 'theme') sKey = SETTINGS.THEME;
                else if (key == 'highlightThickness') sKey = SETTINGS.HIGHLIGHT_THICKNESS;
                else if (key == 'libraryThickness') sKey = SETTINGS.LIBRARY_THICKNESS;
                else if (key == 'borderStyle') sKey = SETTINGS.BORDER_STYLE;
                else if (key == 'quickActions') sKey = TOGGLES.QUICK_ACTIONS;
                else if (key == 'syncAndMarkRead') sKey = TOGGLES.HISTORY_TRACKING;
                else if (key == 'progressTracking') sKey = TOGGLES.PROGRESS_TRACKING;
                else if (key == 'libraryBordersEnabled') sKey = TOGGLES.LIBRARY_BORDERS;
                else if (key == 'cardViewSize') sKey = SETTINGS.VIEW_MODE;
                else if (key == 'libraryHideNoHistory') sKey = TOGGLES.LIBRARY_HIDE_NO_HISTORY;
                else if (key == 'isCustomTheme') sKey = TOGGLES.IS_CUSTOM_THEME;
                else if (key == 'customTheme') sKey = SETTINGS.CUSTOM_THEME_DATA;
                else if (key == 'customStatusEnabled') sKey = TOGGLES.CUSTOM_STATUS_ENABLED;
                else if (key == 'highlightEnabled') sKey = TOGGLES.LIBRARY_BORDERS;
                else if (key == 'familyFriendlyEnabled') sKey = TOGGLES.FAMILY_FRIENDLY;
                else if (key == 'libraryShowRibbons') sKey = TOGGLES.LIBRARY_SHOW_RIBBONS;

                if (sKey != null) {
                    var saveObj = {};
                    
                    if (typeof value == 'object' && value != null) {
                        saveObj[sKey] = JSON.parse(JSON.stringify(value));
                    } else {
                        saveObj[sKey] = value;
                    }
                    
                    console.log('saving ' + sKey + ' to storage');
                    await chrome.storage.local.set(saveObj);
                    console.log("saved successfully");
                }
            } catch (err) {
                console.log("error saving setting: " + err);
            }
        },

        async addCustomStatus(name, color, style) {
            console.log("adding custom status: " + name);
            try {
                if (name == "" || color == "") return;
                
                var current = [];
                if (Array.isArray(this.customStatuses)) {
                    current = this.customStatuses;
                }
                
                var newStatus = {
                    name: name,
                    color: color,
                    style: style || BORDER_DEFAULTS.style
                };
                
                var updated = [];
                for (var i = 0; i < current.length; i++) {
                    updated.push(current[i]);
                }
                updated.push(newStatus);
                
                this.customStatuses = updated;
                
                var saveObj = {};
                saveObj[DATA.CUSTOM_STATUSES] = JSON.parse(JSON.stringify(updated));
                await chrome.storage.local.set(saveObj);
                console.log("added successfully");
            } catch (err) {
                console.log("error adding status: " + err);
            }
        },

        async removeCustomStatus(index) {
            console.log("removing custom status at: " + index);
            try {
                if (!Array.isArray(this.customStatuses)) return;
                
                var updated = [];
                for (var i = 0; i < this.customStatuses.length; i++) {
                    if (i != index) {
                        updated.push(this.customStatuses[i]);
                    }
                }
                
                this.customStatuses = updated;
                
                var saveObj = {};
                saveObj[DATA.CUSTOM_STATUSES] = JSON.parse(JSON.stringify(updated));
                await chrome.storage.local.set(saveObj);
                console.log("removed successfully");
            } catch (err) {
                console.log("error removing status: " + err);
            }
        },

        async resetCustomStatuses() {
            console.log("resetting custom statuses");
            try {
                this.customStatuses = [];
                await chrome.storage.local.remove(DATA.CUSTOM_STATUSES);
                console.log("reset successful");
            } catch (err) {
                console.log("error resetting: " + err);
            }
        },

        /**
         * Keeps the store in sync if you change settings in another window.
         */
        syncFromStorage(changes) {
            for (var storageKey in changes) {
                var newVal = changes[storageKey].newValue;
                
                if (storageKey == SETTINGS.THEME) this.theme = newVal;
                else if (storageKey == SETTINGS.HIGHLIGHT_THICKNESS) this.highlightThickness = parseInt(newVal);
                else if (storageKey == SETTINGS.LIBRARY_THICKNESS) this.libraryThickness = parseInt(newVal);
                else if (storageKey == SETTINGS.BORDER_STYLE) this.borderStyle = newVal;
                else if (storageKey == TOGGLES.QUICK_ACTIONS) this.quickActions = newVal;
                else if (storageKey == TOGGLES.HISTORY_TRACKING) this.syncAndMarkRead = newVal;
                else if (storageKey == TOGGLES.PROGRESS_TRACKING) this.progressTracking = newVal;
                else if (storageKey == DATA.CUSTOM_STATUSES) {
                    if (Array.isArray(newVal)) this.customStatuses = newVal;
                    else this.customStatuses = [];
                }
                else if (storageKey == TOGGLES.CUSTOM_STATUS_ENABLED) this.customStatusEnabled = newVal;
                else if (storageKey == TOGGLES.LIBRARY_BORDERS) this.highlightEnabled = newVal;
                else if (storageKey == TOGGLES.FAMILY_FRIENDLY) this.familyFriendlyEnabled = newVal;
                else if (storageKey == TOGGLES.LIBRARY_SHOW_RIBBONS) this.libraryShowRibbons = newVal;
                else if (storageKey == SETTINGS.VIEW_MODE) this.cardViewSize = newVal;
            }
        }
    }
});
