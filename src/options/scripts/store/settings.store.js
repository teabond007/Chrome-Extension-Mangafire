import { defineStore } from 'pinia';
import { storage } from '../core/storage-adapter.js';

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
        markHomepage: true,
        smartInactivity: false,
        
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
        familyFriendly: false,

        // Smart Automation
        smartAutoComplete: false, // SmartAutoComplet
        smartResume: false,       // SmartResumeLink

        // Reader Enhancements
        autoScroll: false,        // AutoScrollEnabled
        keybinds: false,          // KeybindsEnabled
        progressTracking: true,   // ProgressTrackingEnabled

        // Highlights
        mangaDexEnabled: false,       // MangaDexHighlightEnabled
        mangaDexShowProgress: false,  // MangaDexShowProgress
        webtoonsEnabled: false,       // WebtoonsHighlightEnabled
        webtoonsShowProgress: false,  // WebtoonsShowProgress
        webtoonsBorderSizeEnabled: false,
        webtoonsBorderSize: 4,

        // Dashboard
        dashboardEnabled: true,       // NewTabDashboard
        dashboardPackedLayout: false, // DashboardLayoutStyle

        // Initial load state
        isLoaded: false
    }),

    actions: {
        async loadSettings() {
            const data = await storage.get([
                'theme', 
                'isCustomTheme',
                'customThemeData',
                'CustomBorderSize', 
                'LibraryBorderSize',
                'GlobalBorderStyle',
                'SyncEverySetDate',
                'MarkHomepage',
                'SmartInactivity',
                'MangaFireQuickActions',
                'MangaFireShowProgress',
                'SyncandMarkRead',
                'FamilyFriendly',
                'SmartAutoComplete',
                'SmartResumeLink',
                'AutoScrollEnabled',
                'KeybindsEnabled',
                'ProgressTrackingEnabled',
                'MangaDexHighlightEnabled',
                'MangaDexShowProgress',
                'WebtoonsHighlightEnabled',
                'WebtoonsShowProgress',
                'WebtoonsBorderSize',
                'NewTabDashboard',
                'DashboardLayoutStyle',
                'libraryViewMode',
                'libraryHideNoHistory'
            ]);

            this.theme = data.theme || 'dark';
            this.isCustomTheme = !!data.isCustomTheme;
            if (data.customThemeData) {
                this.customTheme = data.customThemeData;
            }
            this.highlightThickness = parseInt(data.CustomBorderSize) || 4;
            this.libraryThickness = parseInt(data.LibraryBorderSize) || 4;
            this.borderStyle = data.GlobalBorderStyle || 'solid';
            this.syncInterval = parseInt(data.SyncEverySetDate) || 30;
            this.markHomepage = data.MarkHomepage !== false;
            this.smartInactivity = !!data.SmartInactivity;

            // Hydrate new fields
            this.quickActions = data.MangaFireQuickActions !== false;
            this.showReadingBadges = data.MangaFireShowProgress !== false;
            this.syncAndMarkRead = data.SyncandMarkRead !== false;
            this.familyFriendly = !!data.FamilyFriendly;
            this.smartAutoComplete = !!data.SmartAutoComplete;
            this.smartResume = !!data.SmartResumeLink;
            this.autoScroll = !!data.AutoScrollEnabled;
            this.keybinds = !!data.KeybindsEnabled;
            this.progressTracking = data.ProgressTrackingEnabled !== false;
            
            this.mangaDexEnabled = !!data.MangaDexHighlightEnabled;
            this.mangaDexShowProgress = !!data.MangaDexShowProgress;
            this.webtoonsEnabled = !!data.WebtoonsHighlightEnabled;
            this.webtoonsShowProgress = !!data.WebtoonsShowProgress;
            this.webtoonsBorderSize = parseInt(data.WebtoonsBorderSize) || 4;

            this.dashboardEnabled = data.NewTabDashboard !== false;
            this.dashboardPackedLayout = !!data.DashboardLayoutStyle;
            
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
                case 'highlightThickness': storagePayload.CustomBorderSize = value; break;
                case 'libraryThickness': storagePayload.LibraryBorderSize = value; break;
                case 'borderStyle': storagePayload.GlobalBorderStyle = value; break;
                case 'syncInterval': storagePayload.SyncEverySetDate = value; break;
                case 'markHomepage': storagePayload.MarkHomepage = value; break;
                case 'smartInactivity': storagePayload.SmartInactivity = value; break;
                
                // Mappings
                case 'quickActions': storagePayload.MangaFireQuickActions = value; break;
                case 'showReadingBadges': storagePayload.MangaFireShowProgress = value; break;
                case 'syncAndMarkRead': storagePayload.SyncandMarkRead = value; break;
                case 'familyFriendly': storagePayload.FamilyFriendly = value; break;
                case 'smartAutoComplete': storagePayload.SmartAutoComplete = value; break;
                case 'smartResume': storagePayload.SmartResumeLink = value; break;
                case 'autoScroll': storagePayload.AutoScrollEnabled = value; break;
                case 'keybinds': storagePayload.KeybindsEnabled = value; break;
                case 'progressTracking': storagePayload.ProgressTrackingEnabled = value; break;
                case 'mangaDexEnabled': storagePayload.MangaDexHighlightEnabled = value; break;
                case 'mangaDexShowProgress': storagePayload.MangaDexShowProgress = value; break;
                case 'webtoonsEnabled': storagePayload.WebtoonsHighlightEnabled = value; break;
                case 'webtoonsShowProgress': storagePayload.WebtoonsShowProgress = value; break;
                case 'webtoonsBorderSize': storagePayload.WebtoonsBorderSize = value; break;
                case 'dashboardEnabled': storagePayload.NewTabDashboard = value; break;
                case 'dashboardPackedLayout': storagePayload.DashboardLayoutStyle = value; break;
                
                // Library specific defaults (can be expanded)
                case 'libraryBordersEnabled': storagePayload.LibraryBordersEnabled = value; break;
                case 'libraryViewMode': storagePayload.libraryViewMode = value; break;
                case 'libraryHideNoHistory': storagePayload.libraryHideNoHistory = value; break;
                case 'isCustomTheme': storagePayload.isCustomTheme = value; break;
                case 'customTheme': storagePayload.customThemeData = value; break;
            }

            if (Object.keys(storagePayload).length > 0) {
                await storage.set(storagePayload);
            }
        },

        // Called by the persistence plugin or onChange listener
        syncFromStorage(changes) {
            if (changes.theme) this.theme = changes.theme.newValue;
            if (changes.CustomBorderSize) this.highlightThickness = parseInt(changes.CustomBorderSize.newValue);
            if (changes.LibraryBorderSize) this.libraryThickness = parseInt(changes.LibraryBorderSize.newValue);
            if (changes.GlobalBorderStyle) this.borderStyle = changes.GlobalBorderStyle.newValue;
            if (changes.SyncEverySetDate) this.syncInterval = parseInt(changes.SyncEverySetDate.newValue);
            if (changes.MarkHomepage) this.markHomepage = changes.MarkHomepage.newValue;
            if (changes.SmartInactivity) this.smartInactivity = changes.SmartInactivity.newValue;
            if (changes.MangaFireQuickActions) this.quickActions = changes.MangaFireQuickActions.newValue;
            // ... (Add others for full coverage)
             if (changes.NewTabDashboard) this.dashboardEnabled = changes.NewTabDashboard.newValue;
        }
    }
});
