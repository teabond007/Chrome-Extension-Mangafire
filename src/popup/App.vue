<template>
  <div class="popup-container">

    <header class="popup-header">
      <div class="brand">

        <span class="brand-text" style="color:rgb(153, 197, 197)">Color </span> <span
          class="brand-text header-text-gradient"> Marker</span>
      </div>
      <button id="SyncBtn" class="btn-sync" title="Sync Bookmarks Now">
        <span class="icon-sync">↻</span>
      </button>
    </header>

    <div class="features-list">

      <div class="feature-item">
        <div class="feature-info">
          <span class="feature-name">Auto Sync</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="AutoSync">
          <span class="slider"></span>
        </label>
      </div>

      <div class="feature-item">
        <div class="feature-info">
          <span class="feature-name">Custom Markers</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="CustomBookmarks">
          <span class="slider"></span>
        </label>
      </div>

      <div class="feature-item">
        <div class="feature-info">
          <span class="feature-name">Custom Borders</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="CustomBorderSize">
          <span class="slider"></span>
        </label>
      </div>

      <div class="feature-item">
        <div class="feature-info">
          <span class="feature-name">Mark Homepage</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="MarkHomePage">
          <span class="slider"></span>
        </label>
      </div>

      <div class="feature-item">

        <div class="feature-info">
          <span class="feature-name">Sync History</span>
          <span class="feature-sub">Sync & Mark Read</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="SyncandMarkRead">
          <span class="slider"></span>
        </label>
      </div>

      <div class="feature-item">
        <div class="feature-info">
          <span class="feature-name">Manga Dashboard</span>
          <span class="feature-sub">New Tab Experience</span>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="NewTabDashboard">
          <span class="slider"></span>
        </label>
      </div>

    </div>

    <footer class="popup-footer">
      <button id="oppenSettingsBtn" class="link-btn">
        <span>Open Settings</span>
        &#8594;
      </button>
    </footer>

  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    
    // Open Options Page
    document.getElementById("oppenSettingsBtn").addEventListener("click", () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('src/options/options.html'));
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
        { id: "MarkHomePage", storageKey: "MangaFireHighlightEnabled" },
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
</script>

<style>
:root {
  /* Reuse core variables from options.css */
  --bg-body: #F4F7FE;
  --bg-sidebar: #0B1437;
  --bg-popup: #FFFFFF;
  --text-primary: #1E222D;
  --text-secondary: #8B95A5;
  --accent-primary: #4318FF;
  --accent-hover: #3311CC;
  --border-color: #E0E5F2;
  --danger: #EE5D50;

  /* Toggle Colors */
  --toggle-inactive: #E0E5F2;
  --toggle-active: #4318FF;
  --toggle-thumb: #FFFFFF;

}

/* Text Gradient CSS */
.header-text-gradient {
  color: #82BDF5;
  background-image: linear-gradient(45deg, #82BDF5 27%, #3299D1 44%, #8861FF 83%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

/* Dark Mode Support (if popup background is dark) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-body: #0B1437;
    --bg-popup: #111C44;
    --text-primary: #FFFFFF;
    --text-secondary: #A3AED0;
    --border-color: #2B3674;
    --toggle-inactive: #2B3674;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-body);
  width: 300px;
  height: auto;
  min-height: 400px;
}

.popup-container {
  background-color: var(--bg-popup);
  color: var(--text-primary);
  width: 100%;
  height: 100%;
  /* Removed border-radius */
  display: flex;
  flex-direction: column;
}

/* Header */
.popup-header {
  padding: 20px;
  background-color: var(--bg-sidebar);
  /* Dark Header like sidebar */
  color: #FFFFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-text {
  font-weight: 700;
  font-size: 28px;
  letter-spacing: 0.5px;
  cursor: default;
}

.btn-sync {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFF;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-sync:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(180deg);
}

.icon-sync {
  font-size: 18px;
  line-height: 1;
}

/* Features List */
.features-list {
  padding: 10px 0;
  flex: 1;
}

.feature-item {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  margin: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  background-color: #0b1437b9;
}

.feature-item:hover {
  background-color: #2c4177;

  border: 2px solid rgb(132, 145, 192);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-info {
  display: flex;
  flex-direction: column;
}

.feature-name {
  font-weight: 500;
  font-size: 14px;

}

.feature-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Clean Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--toggle-inactive);
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--toggle-thumb);
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked+.slider {
  background-color: var(--toggle-active);
}

input:checked+.slider:before {
  transform: translateX(20px);
}

/* Footer */
.popup-footer {
  padding: 0;
  /* Remove padding for full button */
  background-color: var(--bg-sidebar);
  /* Match header */
  border-top: none;
}

.link-btn {
  background: var(--bg-sidebar);
  /* Match header */
  border: none;
  color: #FFFFFF;
  /* White text */
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  transition: background 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.link-btn:hover {
  background-color: #2c3142;
  /* Slightly lighter */
  text-decoration: none;
}

.link-btn svg {
  stroke: currentColor;
}
</style>
