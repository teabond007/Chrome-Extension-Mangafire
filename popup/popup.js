

document.addEventListener('DOMContentLoaded', () => {
    
    // Open Options Page
    document.getElementById("oppenSettingsBtn").addEventListener("click", () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options/options.html'));
        }
    });

    // Manual Sync Button
    document.getElementById("SyncBtn").addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
        
        // Visual feedback
        const btn = document.getElementById("SyncBtn");
        btn.style.transform = "rotate(360deg)";
        setTimeout(() => btn.style.transform = "none", 500);
    });

    // Feature Toggles Logic
    const features = [
        { id: "AutoSync", storageKey: "AutoSyncfeatureEnabled" },
        { id: "CustomBookmarks", storageKey: "CustomBookmarksfeatureEnabled" },
        { id: "CustomBorderSize", storageKey: "CustomBorderSizefeatureEnabled" },
        { id: "MarkHomePage", storageKey: "MarkHomePagefeatureEnabled" },
        { id: "SyncandMarkRead", storageKey: "SyncandMarkReadfeatureEnabled" },
        { id: "NewTabDashboard", storageKey: "NewTabDashboardfeatureEnabled" },
        { id: "WebtoonsHighlight", storageKey: "WebtoonsHighlightfeatureEnabled", defaultValue: true }
    ];

    features.forEach(feature => {
        const toggle = document.getElementById(feature.id);
        if(!toggle) return;

        // Load initial state with defaultValue support
        chrome.storage.local.get(feature.storageKey, (data) => {
            const defaultVal = feature.defaultValue !== undefined ? feature.defaultValue : false;
            toggle.checked = data[feature.storageKey] !== undefined ? data[feature.storageKey] : defaultVal;
        });

        // Listen for changes
        toggle.addEventListener("change", () => {
             const update = {};
             update[feature.storageKey] = toggle.checked;
             chrome.storage.local.set(update);
        });
    });

    // Optional: Listen for changes from Options page if valid
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            features.forEach(feature => {
                if (changes[feature.storageKey]) {
                    const toggle = document.getElementById(feature.id);
                    if(toggle) toggle.checked = changes[feature.storageKey].newValue;
                }
            });
        }
    });

});


