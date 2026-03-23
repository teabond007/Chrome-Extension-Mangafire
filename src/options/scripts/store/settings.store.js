/**
 * @fileoverview Pinia store for all user settings and custom status management.
 * Centralizes persistence of settings, replacing legacy DOM‑based feature-toggles.js
 * and marker-manager.js modules.
 */
import { defineStore } from 'pinia';
import { TOGGLES, SETTINGS, DATA, BORDER_DEFAULTS } from '../../../config.js';

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
        highlightEnabled: true,
        // General Preferences
        libraryBordersEnabled: true,
        libraryHideNoHistory: false,
        libraryUseGlow: false,
        libraryAnimatedBorders: false,
        libraryShowStatusIcon: false,
        cardViewSize: 'large', // 'compact', 'large', 'list'
        
        // General Preferences
        quickActions: true,
        showReadingBadges: true,
        libraryShowRibbons: true,
        syncAndMarkRead: true,

        // Custom Sites (Card Enhancer)
        customSiteShowRibbons: true,
        customSiteUseGlow: false,

        // Reader Enhancements
        autoScroll: false,
        keybinds: false,
        progressTracking: true,
        familyFriendlyEnabled: false,
        autoReadStale: false,

        // Custom Statuses (marker-manager)
        /** @type {Array<{name: string, color: string, style: string}>} */
        customStatuses: [],
        customStatusEnabled: false,

        // Initial load state
        isLoaded: false
    }),

    actions: {
        async loadSettings() {
            const data = await chrome.storage.local.get([
                SETTINGS.THEME, 
                TOGGLES.IS_CUSTOM_THEME,
                SETTINGS.CUSTOM_THEME_DATA,
                SETTINGS.HIGHLIGHT_THICKNESS, 
                SETTINGS.LIBRARY_THICKNESS,
                SETTINGS.BORDER_STYLE,
                TOGGLES.QUICK_ACTIONS,
                TOGGLES.SHOW_READING_BADGES,
                TOGGLES.HISTORY_TRACKING,
                TOGGLES.AUTO_SCROLL,
                TOGGLES.KEYBINDS_ENABLED,
                TOGGLES.PROGRESS_TRACKING,
                SETTINGS.VIEW_MODE,
                TOGGLES.LIBRARY_HIDE_NO_HISTORY,
                DATA.CUSTOM_STATUSES,
                TOGGLES.CUSTOM_STATUS_ENABLED,
                TOGGLES.LIBRARY_GLOW_EFFECT,
                TOGGLES.LIBRARY_ANIMATED_BORDERS,
                TOGGLES.LIBRARY_PROGRESS_BARS,
                TOGGLES.CUSTOM_SITE_HIGHLIGHT,
                TOGGLES.FAMILY_FRIENDLY,
                TOGGLES.AUTO_READ_STALE,
                TOGGLES.LIBRARY_SHOW_RIBBONS,
                TOGGLES.CUSTOM_SITE_SHOW_RIBBONS,
                TOGGLES.CUSTOM_SITE_GLOW_EFFECT
            ]);

            this.theme = data[SETTINGS.THEME] || 'dark';
            this.isCustomTheme = !!data[TOGGLES.IS_CUSTOM_THEME];
            if (data[SETTINGS.CUSTOM_THEME_DATA]) {
                this.customTheme = data[SETTINGS.CUSTOM_THEME_DATA];
            }
            this.highlightThickness = parseInt(data[SETTINGS.HIGHLIGHT_THICKNESS]) || 4;
            this.libraryThickness = parseInt(data[SETTINGS.LIBRARY_THICKNESS]) || 4;
            this.borderStyle = data[SETTINGS.BORDER_STYLE] || BORDER_DEFAULTS.style;

            this.quickActions = data[TOGGLES.QUICK_ACTIONS] !== false;
            this.showReadingBadges = data[TOGGLES.SHOW_READING_BADGES] !== false;
            this.syncAndMarkRead = data[TOGGLES.HISTORY_TRACKING] !== false;
            this.autoScroll = !!data[TOGGLES.AUTO_SCROLL];
            this.keybinds = !!data[TOGGLES.KEYBINDS_ENABLED];
            this.progressTracking = data[TOGGLES.PROGRESS_TRACKING] !== false;
            
            this.cardViewSize = data[SETTINGS.VIEW_MODE] || 'large';
            this.libraryHideNoHistory = !!data[TOGGLES.LIBRARY_HIDE_NO_HISTORY];
            this.customStatuses = Array.isArray(data[DATA.CUSTOM_STATUSES]) ? data[DATA.CUSTOM_STATUSES] : [];
            this.customStatusEnabled = !!data[TOGGLES.CUSTOM_STATUS_ENABLED];
            
            this.libraryUseGlow = !!data[TOGGLES.LIBRARY_GLOW_EFFECT];
            this.libraryAnimatedBorders = !!data[TOGGLES.LIBRARY_ANIMATED_BORDERS];
            this.libraryShowStatusIcon = !!data[TOGGLES.LIBRARY_STATUS_ICONS];
            this.highlightEnabled = data[TOGGLES.CUSTOM_SITE_HIGHLIGHT] !== false;
            this.familyFriendlyEnabled = !!data[TOGGLES.FAMILY_FRIENDLY];
            this.autoReadStale = !!data[TOGGLES.AUTO_READ_STALE];
            this.libraryShowRibbons = data[TOGGLES.LIBRARY_SHOW_RIBBONS] !== false;
            this.customSiteShowRibbons = data[TOGGLES.CUSTOM_SITE_SHOW_RIBBONS] !== false;
            this.customSiteUseGlow = !!data[TOGGLES.CUSTOM_SITE_GLOW_EFFECT];

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
                case 'theme':                 storagePayload[SETTINGS.THEME] = value; break;
                case 'highlightThickness':    storagePayload[SETTINGS.HIGHLIGHT_THICKNESS] = value; break;
                case 'libraryThickness':      storagePayload[SETTINGS.LIBRARY_THICKNESS] = value; break;
                case 'borderStyle':           storagePayload[SETTINGS.BORDER_STYLE] = value; break;
                case 'quickActions':          storagePayload[TOGGLES.QUICK_ACTIONS] = value; break;
                case 'showReadingBadges':     storagePayload[TOGGLES.SHOW_READING_BADGES] = value; break;
                case 'syncAndMarkRead':       storagePayload[TOGGLES.HISTORY_TRACKING] = value; break;
                case 'autoScroll':            storagePayload[TOGGLES.AUTO_SCROLL] = value; break;
                case 'keybinds':              storagePayload[TOGGLES.KEYBINDS_ENABLED] = value; break;
                case 'progressTracking':      storagePayload[TOGGLES.PROGRESS_TRACKING] = value; break;
                case 'libraryBordersEnabled': storagePayload[TOGGLES.LIBRARY_BORDERS] = value; break;
                case 'cardViewSize':          storagePayload[SETTINGS.VIEW_MODE] = value; break;
                case 'libraryHideNoHistory':  storagePayload[TOGGLES.LIBRARY_HIDE_NO_HISTORY] = value; break;
                case 'isCustomTheme':         storagePayload[TOGGLES.IS_CUSTOM_THEME] = value; break;
                case 'customTheme':           storagePayload[SETTINGS.CUSTOM_THEME_DATA] = value; break;
                case 'customStatusEnabled':   storagePayload[TOGGLES.CUSTOM_STATUS_ENABLED] = value; break;
                case 'libraryUseGlow':        storagePayload[TOGGLES.LIBRARY_GLOW_EFFECT] = value; break;
                case 'libraryAnimatedBorders': storagePayload[TOGGLES.LIBRARY_ANIMATED_BORDERS] = value; break;
                case 'libraryShowStatusIcon':  storagePayload[TOGGLES.LIBRARY_STATUS_ICONS] = value; break;
                case 'highlightEnabled':      storagePayload[TOGGLES.CUSTOM_SITE_HIGHLIGHT] = value; break;
                case 'familyFriendlyEnabled': storagePayload[TOGGLES.FAMILY_FRIENDLY] = value; break;
                case 'autoReadStale':         storagePayload[TOGGLES.AUTO_READ_STALE] = value; break;
                case 'libraryShowRibbons':    storagePayload[TOGGLES.LIBRARY_SHOW_RIBBONS] = value; break;
                case 'customSiteShowRibbons': storagePayload[TOGGLES.CUSTOM_SITE_SHOW_RIBBONS] = value; break;
                case 'customSiteUseGlow':     storagePayload[TOGGLES.CUSTOM_SITE_GLOW_EFFECT] = value; break;
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
        async addCustomStatus(name, color, style = BORDER_DEFAULTS.style) {
            if (!name || !color) return;
            this.customStatuses = [...this.customStatuses, { name, color, style }];
            await chrome.storage.local.set({ [DATA.CUSTOM_STATUSES]: this.customStatuses });
        },

        /**
         * Removes a custom status by its index.
         * @param {number} index
         */
        async removeCustomStatus(index) {
            const updated = this.customStatuses.filter((_, i) => i !== index);
            this.customStatuses = updated;
            await chrome.storage.local.set({ [DATA.CUSTOM_STATUSES]: updated });
        },

        /** Clears all custom statuses. */
        async resetCustomStatuses() {
            this.customStatuses = [];
            await chrome.storage.local.remove(DATA.CUSTOM_STATUSES);
        },

        // ─── Cross‑context Sync ───────────────────────────────────────────────

        /**
         * Syncs store state from chrome.storage.onChanged events.
         * @param {Object} changes - chrome.storage onChanged changes map
         */
        syncFromStorage(changes) {
            if (changes[SETTINGS.THEME])       this.theme = changes[SETTINGS.THEME].newValue;
            if (changes[SETTINGS.HIGHLIGHT_THICKNESS]) this.highlightThickness = parseInt(changes[SETTINGS.HIGHLIGHT_THICKNESS].newValue);
            if (changes[SETTINGS.LIBRARY_THICKNESS])  this.libraryThickness = parseInt(changes[SETTINGS.LIBRARY_THICKNESS].newValue);
            if (changes[SETTINGS.BORDER_STYLE])  this.borderStyle = changes[SETTINGS.BORDER_STYLE].newValue;
            if (changes[TOGGLES.QUICK_ACTIONS]) this.quickActions = changes[TOGGLES.QUICK_ACTIONS].newValue;
            if (changes[TOGGLES.SHOW_READING_BADGES]) this.showReadingBadges = changes[TOGGLES.SHOW_READING_BADGES].newValue;
            if (changes[TOGGLES.HISTORY_TRACKING])    this.syncAndMarkRead = changes[TOGGLES.HISTORY_TRACKING].newValue;
            if (changes[TOGGLES.AUTO_SCROLL])  this.autoScroll = changes[TOGGLES.AUTO_SCROLL].newValue;
            if (changes[TOGGLES.KEYBINDS_ENABLED])    this.keybinds = changes[TOGGLES.KEYBINDS_ENABLED].newValue;
            if (changes[TOGGLES.PROGRESS_TRACKING]) this.progressTracking = changes[TOGGLES.PROGRESS_TRACKING].newValue;
            if (changes[DATA.CUSTOM_STATUSES])    this.customStatuses = changes[DATA.CUSTOM_STATUSES].newValue || [];
            if (changes[TOGGLES.CUSTOM_STATUS_ENABLED]) this.customStatusEnabled = changes[TOGGLES.CUSTOM_STATUS_ENABLED].newValue;
            if (changes[TOGGLES.LIBRARY_GLOW_EFFECT]) this.libraryUseGlow = changes[TOGGLES.LIBRARY_GLOW_EFFECT].newValue;
            if (changes[TOGGLES.LIBRARY_ANIMATED_BORDERS]) this.libraryAnimatedBorders = changes[TOGGLES.LIBRARY_ANIMATED_BORDERS].newValue;
            if (changes[TOGGLES.LIBRARY_STATUS_ICONS]) this.libraryShowStatusIcon = changes[TOGGLES.LIBRARY_STATUS_ICONS].newValue;
            if (changes[TOGGLES.CUSTOM_SITE_HIGHLIGHT]) this.highlightEnabled = changes[TOGGLES.CUSTOM_SITE_HIGHLIGHT].newValue;
            if (changes[TOGGLES.FAMILY_FRIENDLY]) this.familyFriendlyEnabled = changes[TOGGLES.FAMILY_FRIENDLY].newValue;
            if (changes[TOGGLES.AUTO_READ_STALE]) this.autoReadStale = changes[TOGGLES.AUTO_READ_STALE].newValue;
            if (changes[TOGGLES.LIBRARY_SHOW_RIBBONS]) this.libraryShowRibbons = changes[TOGGLES.LIBRARY_SHOW_RIBBONS].newValue;
            if (changes[TOGGLES.CUSTOM_SITE_SHOW_RIBBONS]) this.customSiteShowRibbons = changes[TOGGLES.CUSTOM_SITE_SHOW_RIBBONS].newValue;
            if (changes[TOGGLES.CUSTOM_SITE_GLOW_EFFECT]) this.customSiteUseGlow = changes[TOGGLES.CUSTOM_SITE_GLOW_EFFECT].newValue;
            if (changes[SETTINGS.VIEW_MODE]) this.cardViewSize = changes[SETTINGS.VIEW_MODE].newValue;
        }
    }
});
