/**
 * useSettings Composable
 * 
 * Provides reactive access to extension settings and configuration.
 * Wraps the core Config module with Vue reactivity.
 * 
 * @module composables/useSettings
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { 
    Config, 
    STATUS_COLORS, 
    BORDER_DEFAULTS, 
    FEATURE_DEFAULTS,
    THEMES,
    CARD_SIZES
} from '@/core/config';
import { STORAGE_KEYS } from '@/core/storage-schema';

/**
 * Creates a reactive settings manager.
 * @returns {Object} Settings state and methods
 */
export function useSettings() {
    /** Whether settings have been loaded */
    const isLoaded = ref(false);
    
    /** Loading state */
    const isLoading = ref(true);
    
    /** Current theme name */
    const theme = ref('cloudy-dark');
    
    /** Status colors map */
    const statusColors = ref({ ...STATUS_COLORS });
    
    /** Border configuration */
    const border = ref({ ...BORDER_DEFAULTS });
    
    /** Feature flags */
    const features = ref({ ...FEATURE_DEFAULTS });
    
    /** Card size */
    const cardSize = ref('medium');
    
    /** Custom markers */
    const customMarkers = ref([]);

    /** Platform settings */
    const platforms = ref({});

    /**
     * Current theme configuration object
     */
    const themeConfig = computed(() => THEMES[theme.value] || THEMES['cloudy-dark']);
    
    /**
     * Current card size dimensions
     */
    const cardDimensions = computed(() => CARD_SIZES[cardSize.value] || CARD_SIZES.medium);

    /**
     * Available themes list
     */
    const availableThemes = computed(() => 
        Object.entries(THEMES).map(([key, val]) => ({
            id: key,
            name: val.name
        }))
    );

    /**
     * Monolithic settings object for UI binding
     */
    const settings = ref({
        general: {
            markHomePage: false,
            syncAndMarkRead: false,
            familyFriendly: false
        },
        automation: {
            smartAutoComplete: false, 
            smartInactivityFade: false,
            smartResumeLink: false,
            notificationsEnabled: false
        },
        reader: {
            enhancements: true,
            autoScrollEnabled: false,
            keybindsEnabled: false,
            progressTrackingEnabled: false,
            widthFix: false,
            nextChapter: true
        },
        highlights: {
            // Deprecated in favor of platforms object, but kept for compatibility if needed
            mangadex: true, 
            webtoons: true
        },
        platforms: {
            mangadex: { highlight: true, showProgress: true },
            webtoons: { highlight: true, showProgress: true }
        },
        appearance: {
            theme: 'cloudy-dark',
            accentColor: '',
            libraryData: {
                progressBars: true
            }
        },
        dates: {} 
    });

    /**
     * Loads settings from chrome.storage
     */
    async function loadSettings() {
        isLoading.value = true;
        
        try {
            const data = await chrome.storage.local.get([
                STORAGE_KEYS.THEME,
                STORAGE_KEYS.STATUS_COLORS,
                STORAGE_KEYS.BORDER_STYLE,
                STORAGE_KEYS.BORDER_SIZE,
                STORAGE_KEYS.CUSTOM_MARKERS,
                'features',
                'cardSize',
                'platformSettings'
            ]);

            if (data[STORAGE_KEYS.THEME]) theme.value = data[STORAGE_KEYS.THEME];
            if (data.features) features.value = { ...FEATURE_DEFAULTS, ...data.features };
            if (data.platformSettings) platforms.value = data.platformSettings || {};

            // Populate monolithic settings
            settings.value.general.markHomePage = features.value.markHomePage;
            settings.value.general.syncAndMarkRead = features.value.syncAndMarkRead;
            settings.value.general.familyFriendly = features.value.familyFriendly;

            settings.value.automation.smartAutoComplete = features.value.smartAutoComplete;
            settings.value.automation.smartInactivityFade = features.value.smartInactivityDim;
            settings.value.automation.smartResumeLink = features.value.smartResume;
            settings.value.automation.notificationsEnabled = features.value.notifications;

            settings.value.reader.enhancements = features.value.readerEnhancements;
            settings.value.reader.widthFix = features.value.readerWidthFix;
            settings.value.reader.nextChapter = features.value.readerNextChapter;
            settings.value.reader.autoScrollEnabled = features.value.autoScroll;
            settings.value.reader.keybindsEnabled = features.value.keyboardShortcuts;
            settings.value.reader.progressTrackingEnabled = features.value.progressBadges; // Reuse existing flag or add new one? Mapping to progressBadges for now as it seems visual-related in UI context

            // Highlights (Legacy/Simple)
            settings.value.highlights.mangadex = features.value.mangadexHighlight;
            settings.value.highlights.webtoons = features.value.webtoonsHighlight;

            // Platforms (Detailed) - Default init if empty
            if (!platforms.value.mangadex) platforms.value.mangadex = { highlight: features.value.mangadexHighlight, showProgress: true };
            if (!platforms.value.webtoons) platforms.value.webtoons = { highlight: features.value.webtoonsHighlight, showProgress: true };
            
            settings.value.platforms = JSON.parse(JSON.stringify(platforms.value)); // Deep copy to break ref for simpler v-model, or sync manually. Let's sync manually.
            settings.value.platforms.mangadex.highlight = platforms.value.mangadex.highlight ?? true;
            settings.value.platforms.mangadex.showProgress = platforms.value.mangadex.showProgress ?? true;
            settings.value.platforms.webtoons.highlight = platforms.value.webtoons.highlight ?? true;
            settings.value.platforms.webtoons.showProgress = platforms.value.webtoons.showProgress ?? true;

            settings.value.appearance.theme = theme.value;
            settings.value.appearance.libraryData.progressBars = features.value.progressBadges;

            isLoaded.value = true;
            console.log('[useSettings] ✓ Settings loaded');
        } catch (error) {
            console.error('[useSettings] Failed to load settings:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Updates settings from the monolithic object
     * @param {Object} newSettings 
     */
    async function updateSettings(newSettings) {
        // Update flat refs
        features.value.markHomePage = newSettings.general.markHomePage;
        features.value.syncAndMarkRead = newSettings.general.syncAndMarkRead;
        features.value.familyFriendly = newSettings.general.familyFriendly;
        
        features.value.smartAutoComplete = newSettings.automation.smartAutoComplete;
        features.value.smartInactivityDim = newSettings.automation.smartInactivityFade;
        features.value.smartResume = newSettings.automation.smartResumeLink;
        features.value.notifications = newSettings.automation.notificationsEnabled;

        features.value.readerEnhancements = newSettings.reader.enhancements;
        features.value.readerWidthFix = newSettings.reader.widthFix;
        features.value.readerNextChapter = newSettings.reader.nextChapter;
        features.value.autoScroll = newSettings.reader.autoScrollEnabled;
        features.value.keyboardShortcuts = newSettings.reader.keybindsEnabled;
        // features.value.progressBadges = newSettings.reader.progressTrackingEnabled; // Conflict with appearance?

        features.value.mangadexHighlight = newSettings.highlights.mangadex;
        features.value.webtoonsHighlight = newSettings.highlights.webtoons;

        features.value.progressBadges = newSettings.appearance.libraryData.progressBars;

        // Platform settings
        platforms.value.mangadex = newSettings.platforms.mangadex;
        platforms.value.webtoons = newSettings.platforms.webtoons;
        
        // Also sync simple flags
        features.value.mangadexHighlight = newSettings.platforms.mangadex.highlight;
        features.value.webtoonsHighlight = newSettings.platforms.webtoons.highlight;

        theme.value = newSettings.appearance.theme;

        // Save to storage
        await saveSettings();
    }

    /**
     * Saves all settings to chrome.storage
     */
    async function saveSettings() {
        try {
            await chrome.storage.local.set({
                [STORAGE_KEYS.THEME]: theme.value,
                [STORAGE_KEYS.STATUS_COLORS]: statusColors.value,
                [STORAGE_KEYS.BORDER_STYLE]: border.value.style,
                [STORAGE_KEYS.BORDER_SIZE]: border.value.size,
                [STORAGE_KEYS.CUSTOM_MARKERS]: customMarkers.value,
                features: features.value, // This saves all feature flags
                cardSize: cardSize.value,
                platformSettings: platforms.value
            });
            console.log('[useSettings] ✓ Settings saved');
        } catch (error) {
            console.error('[useSettings] Failed to save settings:', error);
        }
    }

    // ... (keep updateSetting, getStatusColor, etc) ...
    /**
     * Updates a single setting and saves
     * @param {string} key - Setting key path (e.g., 'theme', 'border.size')
     * @param {*} value - New value
     */
    async function updateSetting(key, value) {
        // ... (keep existing logic) ...
         const parts = key.split('.');
        
        if (parts.length === 1) {
            // Top-level setting
            if (key === 'theme') theme.value = value;
            else if (key === 'cardSize') cardSize.value = value;
        } else if (parts[0] === 'border') {
            border.value[parts[1]] = value;
        } else if (parts[0] === 'features') {
            features.value[parts[1]] = value;
        } else if (parts[0] === 'statusColors') {
            statusColors.value[parts[1]] = value;
        } else if (parts[0] === 'platforms') {
            if (parts.length === 3) {
                // platforms.mangafire.enabled = true
                if (!platforms.value[parts[1]]) platforms.value[parts[1]] = {};
                platforms.value[parts[1]][parts[2]] = value;
            }
        }
        
        await saveSettings();
    }

    /**
     * Gets the color for a status
     * @param {string} status - Status name
     * @returns {string} Hex color
     */
    function getStatusColor(status) {
        return statusColors.value[status] || 'transparent';
    }

    /**
     * Checks if a feature is enabled
     * @param {string} featureName - Feature name
     * @returns {boolean}
     */
    function isFeatureEnabled(featureName) {
        return features.value[featureName] ?? false;
    }

    /**
     * Toggles a feature on/off
     * @param {string} featureName - Feature name
     */
    async function toggleFeature(featureName) {
        features.value[featureName] = !features.value[featureName];
        await saveSettings();
    }

    /**
     * Adds a custom marker
     * @param {string} name - Marker name
     * @param {string} color - Hex color
     */
    async function addCustomMarker(name, color) {
        customMarkers.value.push({ name, color });
        await saveSettings();
    }

    /**
     * Removes a custom marker
     * @param {string} name - Marker name
     */
    async function removeCustomMarker(name) {
        customMarkers.value = customMarkers.value.filter(m => m.name !== name);
        await saveSettings();
    }

    /**
     * Applies theme CSS variables to the document
     */
    function applyTheme() {
        const config = themeConfig.value;
        const root = document.documentElement;
        
        root.style.setProperty('--color-bg-body', config.bgBody);
        root.style.setProperty('--color-bg-sidebar', config.bgSidebar);
        root.style.setProperty('--color-bg-surface', config.bgSurface);
        root.style.setProperty('--color-bg-elevated', config.bgElevated);
        root.style.setProperty('--color-primary', config.accentPrimary);
        root.style.setProperty('--color-accent', config.accentSecondary);
        root.style.setProperty('--color-text-primary', config.textPrimary);
        root.style.setProperty('--color-text-secondary', config.textSecondary);
        root.style.setProperty('--color-text-muted', config.textMuted);
        root.style.setProperty('--color-border', config.border);
    }

    /**
     * Resets all settings to defaults
     */
    async function resetToDefaults() {
        theme.value = 'cloudy-dark';
        statusColors.value = { ...STATUS_COLORS };
        border.value = { ...BORDER_DEFAULTS };
        features.value = { ...FEATURE_DEFAULTS };
        cardSize.value = 'medium';
        customMarkers.value = [];
        
        await saveSettings();
        applyTheme();
    }

    // Handle storage changes from other contexts
    function handleStorageChange(changes, areaName) {
        if (areaName !== 'local') return;
        
        if (changes[STORAGE_KEYS.THEME]) {
            theme.value = changes[STORAGE_KEYS.THEME].newValue;
            applyTheme();
        }
        if (changes[STORAGE_KEYS.STATUS_COLORS]) {
            statusColors.value = changes[STORAGE_KEYS.STATUS_COLORS].newValue;
        }
        if (changes.features) {
            features.value = changes.features.newValue;
        }
    }

    // Watch theme changes and apply
    watch(theme, () => {
        applyTheme();
    });

    // Lifecycle
    onMounted(async () => {
        await loadSettings();
        applyTheme();
        chrome.storage.onChanged.addListener(handleStorageChange);
    });

    onUnmounted(() => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
    });

    return {
        // State
        settings, // Added
        isLoaded,
        isLoading,
        theme,
        statusColors,
        border,
        features,
        cardSize,
        customMarkers,
        platforms,
        
        // Computed
        themeConfig,
        cardDimensions,
        availableThemes,
        
        // Methods
        loadSettings,
        saveSettings,
        updateSettings, // Added
        updateSetting,
        getStatusColor,
        isFeatureEnabled,
        toggleFeature,
        addCustomMarker,
        removeCustomMarker,
        applyTheme,
        resetToDefaults
    };
}
