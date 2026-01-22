<!--
  Popup App Component - Legacy Style
  
  Quick-access panel for the extension with feature toggles.
  Exact copy of legacy popup.html/popup.css styling.
-->

<template>
    <div class="popup-container">
        <!-- Header with Brand and Sync Button -->
        <header class="popup-header">
            <div class="brand">
                <span class="brand-text" style="color: rgb(153, 197, 197)">Color </span>
                <span class="brand-text header-text-gradient">Marker</span>
            </div>
            <button class="btn-sync" title="Sync Bookmarks Now" @click="triggerSync">
                <span class="icon-sync" :class="{ 'spinning': isSyncing }">↻</span>
            </button>
        </header>

        <!-- Features List -->
        <div class="features-list">
            <!-- Auto Sync Toggle -->
            <div class="feature-item" @click="toggleFeature('autoSync')">
                <div class="feature-info">
                    <span class="feature-name">Auto Sync</span>
                </div>
                <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="featureToggles.autoSync" @change="saveFeature('autoSync')">
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Custom Markers Toggle -->
            <div class="feature-item" @click="toggleFeature('customBookmarks')">
                <div class="feature-info">
                    <span class="feature-name">Custom Markers</span>
                </div>
                <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="featureToggles.customBookmarks" @change="saveFeature('customBookmarks')">
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Custom Borders Toggle -->
            <div class="feature-item" @click="toggleFeature('customBorderSize')">
                <div class="feature-info">
                    <span class="feature-name">Custom Borders</span>
                </div>
                <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="featureToggles.customBorderSize" @change="saveFeature('customBorderSize')">
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Mark Homepage Toggle -->
            <div class="feature-item" @click="toggleFeature('markHomePage')">
                <div class="feature-info">
                    <span class="feature-name">Mark Homepage</span>
                </div>
                <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="featureToggles.markHomePage" @change="saveFeature('markHomePage')">
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Sync History Toggle -->
            <div class="feature-item" @click="toggleFeature('syncAndMarkRead')">
                <div class="feature-info">
                    <span class="feature-name">Sync History</span>
                    <span class="feature-sub">Sync & Mark Read</span>
                </div>
                <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="featureToggles.syncAndMarkRead" @change="saveFeature('syncAndMarkRead')">
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Manga Dashboard Toggle -->
            <div class="feature-item" @click="toggleFeature('newTabDashboard')">
                <div class="feature-info">
                    <span class="feature-name">Manga Dashboard</span>
                    <span class="feature-sub">New Tab Experience</span>
                </div>
                <label class="toggle-switch" @click.stop>
                    <input type="checkbox" v-model="featureToggles.newTabDashboard" @change="saveFeature('newTabDashboard')">
                    <span class="slider"></span>
                </label>
            </div>
        </div>

        <!-- Footer -->
        <footer class="popup-footer">
            <button class="link-btn" @click="openOptions">
                <span>Open Settings</span>
                &#8594;
            </button>
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

/** Feature toggle state mapping to legacy storage keys */
const featureToggles = ref({
    autoSync: false,
    customBookmarks: false,
    customBorderSize: false,
    markHomePage: false,
    syncAndMarkRead: false,
    newTabDashboard: false
});

/** Sync animation state */
const isSyncing = ref(false);

/** Maps Vue keys to legacy storage keys */
const storageKeyMap = {
    autoSync: 'AutoSyncfeatureEnabled',
    customBookmarks: 'CustomBookmarksfeatureEnabled',
    customBorderSize: 'CustomBorderSizefeatureEnabled',
    markHomePage: 'MarkHomePagefeatureEnabled',
    syncAndMarkRead: 'SyncandMarkReadfeatureEnabled',
    newTabDashboard: 'NewTabDashboardfeatureEnabled'
};

/**
 * Loads feature toggle states from chrome.storage.local
 */
async function loadFeatures() {
    const keys = Object.values(storageKeyMap);
    const data = await chrome.storage.local.get(keys);
    
    Object.entries(storageKeyMap).forEach(([vueKey, storageKey]) => {
        featureToggles.value[vueKey] = data[storageKey] ?? false;
    });
}

/**
 * Saves a single feature toggle to storage
 * @param {string} key - The Vue key for the feature
 */
function saveFeature(key) {
    const storageKey = storageKeyMap[key];
    const value = featureToggles.value[key];
    chrome.storage.local.set({ [storageKey]: value });
}

/**
 * Toggles a feature via clicking the row
 * @param {string} key - The Vue key for the feature
 */
function toggleFeature(key) {
    featureToggles.value[key] = !featureToggles.value[key];
    saveFeature(key);
}

/**
 * Opens the options/settings page
 */
function openOptions() {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options/index.html'));
    }
}

/**
 * Triggers a manual bookmark sync via message to background script
 */
function triggerSync() {
    isSyncing.value = true;
    chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
    
    // Reset animation after 2 seconds
    setTimeout(() => {
        isSyncing.value = false;
    }, 2000);
}

/**
 * Handles storage changes from options page
 */
function handleStorageChange(changes, area) {
    if (area === 'local') {
        Object.entries(storageKeyMap).forEach(([vueKey, storageKey]) => {
            if (changes[storageKey]) {
                featureToggles.value[vueKey] = changes[storageKey].newValue;
            }
        });
    }
}

onMounted(() => {
    loadFeatures();
    chrome.storage.onChanged.addListener(handleStorageChange);
});

onUnmounted(() => {
    chrome.storage.onChanged.removeListener(handleStorageChange);
});
</script>

<style scoped>
/* Exact copy of legacy popup.css */
:root {
    --bg-body: #F4F7FE;
    --bg-sidebar: #0B1437;
    --bg-popup: #FFFFFF;
    --text-primary: #1E222D;
    --text-secondary: #A3AED0;
    --accent-primary: #4318FF;
    --accent-hover: #3311CC;
    --border-color: #2B3674;
    --toggle-inactive: #2B3674;
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

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.popup-container {
    width: 300px;
    min-height: 400px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #111C44;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
}

/* Header */
.popup-header {
    padding: 20px;
    background-color: #0B1437;
    color: #FFFFFF;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.brand {
    display: flex;
    align-items: center;
    gap: 4px;
}

.brand-text {
    font-weight: 700;
    font-size: 24px;
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

.icon-sync.spinning {
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Features List */
.features-list {
    padding: 10px 0;
    flex: 1;
    overflow-y: auto;
    background-color: #111C44;
}

.feature-item {
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10px;
    border-radius: 8px;
    border: 1px solid #2B3674;
    cursor: pointer;
    background-color: rgba(11, 20, 55, 0.72);
    transition: all 0.2s ease;
}

.feature-item:hover {
    background-color: #2c4177;
    border: 2px solid rgb(132, 145, 192);
}

.feature-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.feature-name {
    font-weight: 500;
    font-size: 14px;
    color: #FFFFFF;
}

.feature-sub {
    font-size: 11px;
    color: #A3AED0;
}

/* Toggle Switch */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
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
    background-color: #2B3674;
    transition: 0.4s;
    border-radius: 34px;
}

.slider::before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: #FFFFFF;
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
    background-color: #4318FF;
}

input:checked + .slider::before {
    transform: translateX(20px);
}

/* Footer */
.popup-footer {
    padding: 0;
    background-color: #0B1437;
    border-top: none;
}

.link-btn {
    background: #0B1437;
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
