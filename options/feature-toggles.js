/**
 * Feature toggle management
 */

export function initFeatureToggles() {
    const features = [
        { id: "MarkHomePage", storageKey: "MarkHomePagefeatureEnabled" },
        { id: "SyncandMarkRead", storageKey: "SyncandMarkReadfeatureEnabled" },
        { id: "CustomBookmarks", storageKey: "CustomBookmarksfeatureEnabled" },
        { id: "AutoSync", storageKey: "AutoSyncfeatureEnabled" },
        { id: "CustomBorderSize", storageKey: "CustomBorderSizefeatureEnabled" },
        { id: "FamilyFriendly", storageKey: "FamilyFriendlyfeatureEnabled" }
    ];

    features.forEach(feature => {
        const toggle = document.getElementById(feature.id);
        if (!toggle) return;

        // Load initial state
        chrome.storage.local.get(feature.storageKey, (data) => {
            toggle.checked = data[feature.storageKey] || false;
        });

        // Listen for changes
        toggle.addEventListener("change", () => {
            const update = {};
            update[feature.storageKey] = toggle.checked;
            chrome.storage.local.set(update);
        });
    });

    // Sync across pages (if popup changes it)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            features.forEach(feature => {
                if (changes[feature.storageKey]) {
                    const toggle = document.getElementById(feature.id);
                    if (toggle) toggle.checked = changes[feature.storageKey].newValue;
                }
            });
        }
    });
}
