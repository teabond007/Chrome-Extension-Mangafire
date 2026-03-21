/**
 * @fileoverview Pinia store for all user settings and custom status management.
 * Centralizes persistence of settings, replacing legacy DOM‑based feature-toggles.js
 * and marker-manager.js modules.
 */
import { defineStore } from 'pinia';
import { STORAGE_KEYS } from '../../../config.js';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        activeTab: 'settings', // Current visible tab in options page
        theme: 'dark',
        isCustomTheme: false,
        customTheme: {
            bg: '#0b1437',
            sidebar: '#111c44',
            accent: '#7551FF',
            text: '#ffffff'
        },
        highlightThickness: 4,     // External websites (CustomBorderSize)
        libraryThickness: 4,       // Internal library entries (LibraryBorderSize)
        borderStyle: 'solid',
        // General Preferences
        libraryBordersEnabled: true,
        libraryHideNoHistory: false,
        libraryUseGlow: false,
        libraryAnimatedBorders: false,
        libraryShowStatusIcon: false,
        libraryShowProgressBar: false,
        libraryViewMode: 'large', // 'compact', 'large', 'list'
        
        // General Preferences
        quickActions: true,
        showReadingBadges: true,
        syncAndMarkRead: true,

        // Reader Enhancements
        autoScroll: false,
        keybinds: false,
        progressTracking: true,

        // Custom Statuses (marker-manager)
        /** @type {Array<{name: string, color: string, style: string}>} */
        customStatuses: [],

        // Initial load state
        isLoaded: false
    }),

    actions: {
        async loadSettings() {
            const data = await chrome.storage.local.get([
                'theme', 
                'isCustomTheme',
                'customThemeData',
                STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS, 
                'LibraryBorderSize',
                'GlobalBorderStyle',
                'GlobalQuickActions',
                'GlobalShowProgress',
                'SyncandMarkRead',
                'AutoScrollEnabled',
                'KeybindsEnabled',
                'ProgressTrackingEnabled',
                'libraryViewMode',
                'libraryHideNoHistory',
                'customBookmarks'
            ]);

            this.theme = data.theme || 'dark';
            this.isCustomTheme = !!data.isCustomTheme;
            if (data.customThemeData) {
                this.customTheme = data.customThemeData;
            }
            this.highlightThickness = parseInt(data[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS]) || 4;
            this.libraryThickness = parseInt(data.LibraryBorderSize) || 4;
            this.borderStyle = data.GlobalBorderStyle || 'solid';
            this.borderStyle = data.GlobalBorderStyle || 'solid';

            this.quickActions = data.GlobalQuickActions !== false;
            this.showReadingBadges = data.GlobalShowProgress !== false;
            this.syncAndMarkRead = data.SyncandMarkRead !== false;
            this.autoScroll = !!data.AutoScrollEnabled;
            this.keybinds = !!data.KeybindsEnabled;
            this.progressTracking = data.ProgressTrackingEnabled !== false;
            
            this.libraryViewMode = data.libraryViewMode || 'large';
            this.libraryHideNoHistory = !!data.libraryHideNoHistory;
            this.customStatuses = Array.isArray(data.customBookmarks) ? data.customBookmarks : [];

            this.isLoaded = true;
        },

        /**
         * Persist any settings field by its store key.
         * Maps camelCase store keys to their legacy chrome.storage keys.
         * @param {string} key - Store state key
         * @param {*} value - New value
         */
        async updateSetting(key, value) {
            if (Object.prototype.hasOwnProperty.call(this.$state, key)) {
                this.$state[key] = value;
            }

            const storagePayload = {};
            switch (key) {
                case 'theme':                 storagePayload.theme = value; break;
                case 'highlightThickness':    storagePayload[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS] = value; break;
                case 'libraryThickness':      storagePayload.LibraryBorderSize = value; break;
                case 'borderStyle':           storagePayload.GlobalBorderStyle = value; break;
                case 'quickActions':          storagePayload.GlobalQuickActions = value; break;
                case 'showReadingBadges':     storagePayload.GlobalShowProgress = value; break;
                case 'syncAndMarkRead':       storagePayload.SyncandMarkRead = value; break;
                case 'autoScroll':            storagePayload.AutoScrollEnabled = value; break;
                case 'keybinds':              storagePayload.KeybindsEnabled = value; break;
                case 'progressTracking':      storagePayload.ProgressTrackingEnabled = value; break;
                case 'libraryBordersEnabled': storagePayload.LibraryBordersEnabled = value; break;
                case 'libraryViewMode':       storagePayload.libraryViewMode = value; break;
                case 'libraryHideNoHistory':  storagePayload.libraryHideNoHistory = value; break;
                case 'isCustomTheme':         storagePayload.isCustomTheme = value; break;
                case 'customTheme':           storagePayload.customThemeData = value; break;
            }

            if (Object.keys(storagePayload).length > 0) {
                await chrome.storage.local.set(storagePayload);
            }
        },

        // ─── Custom Status Management ────────────────────────────────────────

        /**
         * Adds a new custom status and persists to storage.
         * @param {string} name
         * @param {string} color - hex color string
         * @param {string} style - CSS border style
         */
        async addCustomStatus(name, color, style = 'solid') {
            if (!name || !color) return;
            this.customStatuses = [...this.customStatuses, { name, color, style }];
            await chrome.storage.local.set({ customBookmarks: this.customStatuses });
        },

        /**
         * Removes a custom status by its index.
         * @param {number} index
         */
        async removeCustomStatus(index) {
            const updated = this.customStatuses.filter((_, i) => i !== index);
            this.customStatuses = updated;
            await chrome.storage.local.set({ customBookmarks: updated });
        },

        /** Clears all custom statuses. */
        async resetCustomStatuses() {
            this.customStatuses = [];
            await chrome.storage.local.remove('customBookmarks');
        },

        // ─── Cross‑context Sync ───────────────────────────────────────────────

        /**
         * Syncs store state from chrome.storage.onChanged events.
         * @param {Object} changes - chrome.storage onChanged changes map
         */
        syncFromStorage(changes) {
            if (changes.theme)       this.theme = changes.theme.newValue;
            if (changes[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS]) this.highlightThickness = parseInt(changes[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS].newValue);
            if (changes.LibraryBorderSize)  this.libraryThickness = parseInt(changes.LibraryBorderSize.newValue);
            if (changes.GlobalBorderStyle)  this.borderStyle = changes.GlobalBorderStyle.newValue;
            if (changes.GlobalQuickActions) this.quickActions = changes.GlobalQuickActions.newValue;
            if (changes.GlobalShowProgress) this.showReadingBadges = changes.GlobalShowProgress.newValue;
            if (changes.SyncandMarkRead)    this.syncAndMarkRead = changes.SyncandMarkRead.newValue;
            if (changes.AutoScrollEnabled)  this.autoScroll = changes.AutoScrollEnabled.newValue;
            if (changes.KeybindsEnabled)    this.keybinds = changes.KeybindsEnabled.newValue;
            if (changes.ProgressTrackingEnabled) this.progressTracking = changes.ProgressTrackingEnabled.newValue;
            if (changes.customBookmarks)    this.customStatuses = changes.customBookmarks.newValue || [];
        }
    }
});
