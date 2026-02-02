<template>
  <div class="popup-container">

    <header class="popup-header">
      <div class="brand">
        <span class="brand-text" style="color:rgb(153, 197, 197)">Color </span> <span
          class="brand-text header-text-gradient"> Marker</span>
      </div>
      <button id="SyncBtn" class="btn-sync" title="Sync Bookmarks Now" @click="handleSync">
        <span class="icon-sync">↻</span>
      </button>
    </header>

    <div class="features-list">
      
      <!-- Feature Items -->
      <div 
        v-for="feature in features" 
        :key="feature.id"
        class="feature-item"
        @click="toggleFeature(feature)"
      >
        <div class="feature-info">
          <span class="feature-name">{{ feature.label }}</span>
          <span v-if="feature.subLabel" class="feature-sub">{{ feature.subLabel }}</span>
        </div>
        
        <ToggleSwitch 
            :id="feature.id"
            :model-value="feature.value"
            @update:model-value="val => updateFeature(feature, val)"
            @click.stop
        />
      </div>

    </div>

    <footer class="popup-footer">
      <button id="oppenSettingsBtn" class="link-btn" @click="openSettings">
        <span>Open Settings</span>
        &#8594;
      </button>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ToggleSwitch from '../options/components/common/ToggleSwitch.vue';

// State
const features = ref([
    { id: "AutoSync", storageKey: "AutoSyncfeatureEnabled", label: "Auto Sync", value: false },
    { id: "CustomBookmarks", storageKey: "CustomBookmarksfeatureEnabled", label: "Custom Markers", value: false },
    { id: "CustomBorderSize", storageKey: "CustomBorderSizefeatureEnabled", label: "Custom Borders", value: false },
    { id: "MarkHomePage", storageKey: "MangaFireHighlightEnabled", label: "Mark Homepage", value: false },
    { id: "SyncandMarkRead", storageKey: "SyncandMarkReadfeatureEnabled", label: "Sync History", subLabel: "Sync & Mark Read", value: false },
    { id: "NewTabDashboard", storageKey: "NewTabDashboardfeatureEnabled", label: "Manga Dashboard", subLabel: "New Tab Experience", value: false }
]);

// Methods
const handleSync = () => {
    chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
    
    // Visual feedback
    const btn = document.getElementById("SyncBtn");
    if(btn) {
        btn.style.transform = "rotate(360deg)";
        setTimeout(() => btn.style.transform = "none", 500);
    }
};

const openSettings = () => {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('src/options/options.html'));
    }
};

const toggleFeature = (feature) => {
    feature.value = !feature.value;
    saveFeature(feature);
};

const updateFeature = (feature, newVal) => {
    feature.value = newVal;
    saveFeature(feature);
};

const saveFeature = (feature) => {
    const update = {};
    update[feature.storageKey] = feature.value;
    chrome.storage.local.set(update);
};

// Lifecycle
onMounted(() => {
    const keys = features.value.map(f => f.storageKey);
    
    // Initial Load
    chrome.storage.local.get(keys, (data) => {
        features.value.forEach(f => {
            if (data[f.storageKey] !== undefined) {
                f.value = data[f.storageKey];
            } else if (f.storageKey === "WebtoonsHighlightfeatureEnabled") {
                f.value = true; // Default true logic example if needed
            }
        });
    });

    // Storage Listener
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            optionsFeaturesUpdate(changes);
        }
    });
});

const optionsFeaturesUpdate = (changes) => {
    features.value.forEach(f => {
        if (changes[f.storageKey]) {
            f.value = changes[f.storageKey].newValue;
        }
    });
};
</script>

<style>
:root {
  /* Reuse core variables (matching options.css usually) */
  --bg-body: #F4F7FE;
  --bg-sidebar: #0B1437;
  --bg-popup: #FFFFFF;
  --text-primary: #1E222D;
  --text-secondary: #8B95A5;
  --accent-primary: #4318FF;
  --accent-hover: #3311CC;
  --border-color: #E0E5F2;
  --danger: #EE5D50;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-body: #0B1437;
    --bg-popup: #111C44;
    --text-primary: #FFFFFF;
    --text-secondary: #A3AED0;
    --border-color: #2B3674;
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
  width: 320px;
  min-height: 400px;
}

.popup-container {
  background-color: var(--bg-popup);
  color: var(--text-primary);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.popup-header {
  padding: 20px;
  background-color: var(--bg-sidebar);
  color: #FFFFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-text {
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.5px;
  cursor: default;
}

.header-text-gradient {
  color: #82BDF5;
  background-image: linear-gradient(45deg, #82BDF5 27%, #3299D1 44%, #8861FF 83%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
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
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-body); /* Using simplistic bg */
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent; /* Prepare for border transition */
}

/* Dark mode override for feature item bg */
@media (prefers-color-scheme: dark) {
    .feature-item {
        background-color: #1B254B;
    }
}

.feature-item:hover {
  background-color: rgba(67, 24, 255, 0.05); /* Light primary tint */
}

@media (prefers-color-scheme: dark) {
    .feature-item:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }
}

.feature-info {
  display: flex;
  flex-direction: column;
}

.feature-name {
  font-weight: 600;
  font-size: 14px;
}

.feature-sub {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Footer */
.popup-footer {
  padding: 0;
  background-color: var(--bg-sidebar);
}

.link-btn {
  background: var(--bg-sidebar);
  border: none;
  color: #FFFFFF;
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
}
</style>
