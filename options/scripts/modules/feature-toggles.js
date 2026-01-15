/**
 * @fileoverview Manages feature toggle switches in the extension options.
 * Handles primary persistence in chrome.storage.local and synchronizes state between 
 * the options page and other extension contexts (like the popup).
 */

/**
 * Initializes all feature toggle switches on the page.
 * Loads their saved state from storage and attaches change listeners to update storage.
 * Also starts a background listener for external storage updates.
 * 
 * @returns {void}
 */
export function initFeatureToggles() {
    /** 
     * @typedef {Object} FeatureDefinition
     * @property {string} id - The DOM ID of the checkbox/toggle input.
     * @property {string} storageKey - The key used in chrome.storage.local for this feature.
     */

    /** @type {FeatureDefinition[]} List of managed toggle features */
    const features = [
        { id: "MarkHomePage", storageKey: "MarkHomePagefeatureEnabled" },
        { id: "SyncandMarkRead", storageKey: "SyncandMarkReadfeatureEnabled" },
        { id: "CustomBookmarks", storageKey: "CustomBookmarksfeatureEnabled" },
        { id: "AutoSync", storageKey: "AutoSyncfeatureEnabled" },
        { id: "CustomBorderSize", storageKey: "CustomBorderSizefeatureEnabled" },
        { id: "FamilyFriendly", storageKey: "FamilyFriendlyfeatureEnabled" },
        { id: "NewTabDashboard", storageKey: "NewTabDashboardfeatureEnabled" },
        { id: "DashboardLayoutStyle", storageKey: "DashboardLayoutStylePacked" },
        { id: "SmartAutoComplete", storageKey: "SmartAutoCompletefeatureEnabled" },
        { id: "SmartInactivityFade", storageKey: "SmartInactivityFadefeatureEnabled" },
        { id: "SmartResumeLink", storageKey: "SmartResumeLinkfeatureEnabled" }
    ];

    features.forEach(feature => {
        const toggle = document.getElementById(feature.id);
        if (!toggle) return;

        // Load current state from storage on initialization.
        // Defaults to 'false' (disabled) if no value is present.
        chrome.storage.local.get(feature.storageKey, (data) => {
            toggle.checked = data[feature.storageKey] || false;
        });

        // Listen for user interaction on the toggle.
        toggle.addEventListener("change", () => {
            const update = {};
            update[feature.storageKey] = toggle.checked;
            chrome.storage.local.set(update);
        });
    });

    /**
     * Cross-context Synchronization listener.
     * Detects when a feature toggle is changed from another page (e.g., the popup)
     * and updates the local UI checkboxes to reflect the new shared state.
     */
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            features.forEach(feature => {
                // If a change occurred specifically for one of our feature keys
                if (changes[feature.storageKey]) {
                    const toggle = document.getElementById(feature.id);
                    if (toggle) {
                        toggle.checked = changes[feature.storageKey].newValue;
                    }
                }
            });
        }
    });
}

