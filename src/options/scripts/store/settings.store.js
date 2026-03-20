import { defineStore } from 'pinia';
import { STORAGE_KEYS } from '../../../config.js';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
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
        syncInterval: 30, // days
        
        // Library view settings
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
        autoScroll: false,        // AutoScrollEnabled
        keybinds: false,          // KeybindsEnabled
        progressTracking: true,   // ProgressTrackingEnabled

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
                'SyncEverySetDate',
                'GlobalQuickActions',
                'GlobalShowProgress',
                'SyncandMarkRead',
                'AutoScrollEnabled',
                'KeybindsEnabled',
                'ProgressTrackingEnabled',
                'libraryViewMode',
                'libraryHideNoHistory'
            ]);

            this.theme = data.theme || 'dark';
            this.isCustomTheme = !!data.isCustomTheme;
            if (data.customThemeData) {
                this.customTheme = data.customThemeData;
            }
            this.highlightThickness = parseInt(data[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS]) || 4;
            this.libraryThickness = parseInt(data.LibraryBorderSize) || 4;
            this.borderStyle = data.GlobalBorderStyle || 'solid';
            this.syncInterval = parseInt(data.SyncEverySetDate) || 30;

            // Hydrate new fields
            this.quickActions = data.GlobalQuickActions !== false;
            this.showReadingBadges = data.GlobalShowProgress !== false;
            this.syncAndMarkRead = data.SyncandMarkRead !== false;
            this.autoScroll = !!data.AutoScrollEnabled;
            this.keybinds = !!data.KeybindsEnabled;
            this.progressTracking = data.ProgressTrackingEnabled !== false;
            
            this.libraryViewMode = data.libraryViewMode || 'large';
            this.libraryHideNoHistory = !!data.libraryHideNoHistory;

            this.isLoaded = true;
        },

        async updateSetting(key, value) {
            // Update local state
            if (this.$state.hasOwnProperty(key)) {
                this.$state[key] = value;
            }

            // Map to legacy storage keys
            const storagePayload = {};
            switch (key) {
                case 'theme': storagePayload.theme = value; break;
                case 'highlightThickness': storagePayload[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS] = value; break;
                case 'libraryThickness': storagePayload.LibraryBorderSize = value; break;
                case 'borderStyle': storagePayload.GlobalBorderStyle = value; break;
                case 'syncInterval': storagePayload.SyncEverySetDate = value; break;
                
                // Mappings
                case 'quickActions': storagePayload.GlobalQuickActions = value; break;
                case 'showReadingBadges': storagePayload.GlobalShowProgress = value; break;
                case 'syncAndMarkRead': storagePayload.SyncandMarkRead = value; break;
                case 'autoScroll': storagePayload.AutoScrollEnabled = value; break;
                case 'keybinds': storagePayload.KeybindsEnabled = value; break;
                case 'progressTracking': storagePayload.ProgressTrackingEnabled = value; break;
                
                // Library specific defaults (can be expanded)
                case 'libraryBordersEnabled': storagePayload.LibraryBordersEnabled = value; break;
                case 'libraryViewMode': storagePayload.libraryViewMode = value; break;
                case 'libraryHideNoHistory': storagePayload.libraryHideNoHistory = value; break;
                case 'isCustomTheme': storagePayload.isCustomTheme = value; break;
                case 'customTheme': storagePayload.customThemeData = value; break;
            }

            if (Object.keys(storagePayload).length > 0) {
                await chrome.storage.local.set(storagePayload);
            }
        },

        // Called by the persistence plugin or onChange listener
        syncFromStorage(changes) {
            if (changes.theme) this.theme = changes.theme.newValue;
            if (changes[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS]) this.highlightThickness = parseInt(changes[STORAGE_KEYS.SETTINGS_HIGHLIGHT_THICKNESS].newValue);
            if (changes.LibraryBorderSize) this.libraryThickness = parseInt(changes.LibraryBorderSize.newValue);
            if (changes.GlobalBorderStyle) this.borderStyle = changes.GlobalBorderStyle.newValue;
            if (changes.SyncEverySetDate) this.syncInterval = parseInt(changes.SyncEverySetDate.newValue);
            if (changes.GlobalQuickActions) this.quickActions = changes.GlobalQuickActions.newValue;
            // ... (Add others for full coverage)
        }
    }
});
