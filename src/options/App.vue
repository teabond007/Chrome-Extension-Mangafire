<template>
    <div class="app-container">
        <!-- Sidebar -->
        <Sidebar />

        <!-- Main Content -->
        <main class="main-content">
            <GeneralTab v-show="settingsStore.activeTab === 'settings'" />
            <AppearanceTab v-show="settingsStore.activeTab === 'appearance'" />
            <LibraryTab v-show="settingsStore.activeTab === 'saved-entries'" />
            <AboutTab v-show="settingsStore.activeTab === 'about'" />
            <CustomSitesTab v-show="settingsStore.activeTab === 'custom-sites'" />
            <BackupTab v-show="settingsStore.activeTab === 'backup'" />
        </main>
    </div>

    <!-- Scroll to Top Button -->
    <button 
        id="scrollToTopBtn" 
        class="scroll-to-top" 
        :class="{ visible: showScrollTop }"
        title="Go to top"
    >
        <svg class="icon-svg icon-arrow-up"></svg>
    </button>

    <MangaDetailsModal />
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { useSettingsStore } from './scripts/store/settings.store.js';
import { useLibraryStore } from './scripts/store/library.store.js';

import Sidebar from './components/Sidebar.vue';
import GeneralTab from './components/tabs/General/GeneralTab.vue';
import AppearanceTab from './components/tabs/Appearance/AppearanceTab.vue';
import LibraryTab from './components/tabs/Library/LibraryTab.vue';
import AboutTab from './components/tabs/About/AboutTab.vue';
import CustomSitesTab from './components/tabs/CustomSites/CustomSitesTab.vue';
import BackupTab from './components/tabs/Backup/BackupTab.vue';
import MangaDetailsModal from './components/tabs/Library/MangaDetailsModal.vue';
import { useBackupStore } from './scripts/store/backup.store.js';

const settingsStore = useSettingsStore();
const backupStore = useBackupStore();
const libraryStore = useLibraryStore();

const showScrollTop = ref(false);

const applyTheme = (name) => {
    const html = document.documentElement;
    
    // Clear any inline custom theme styles first
    html.style.removeProperty('--bg-body');
    html.style.removeProperty('--bg-sidebar');
    html.style.removeProperty('--bg-card');
    html.style.removeProperty('--accent-primary');
    html.style.removeProperty('--text-primary');
    
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode');
    
    if (name === 'custom' && settingsStore.isCustomTheme) {
        // Apply custom theme CSS variables
        const ct = settingsStore.customTheme;
        html.style.setProperty('--bg-body', ct.bg);
        html.style.setProperty('--bg-sidebar', ct.sidebar);
        html.style.setProperty('--bg-card', ct.sidebar);
        html.style.setProperty('--accent-primary', ct.accent);
        html.style.setProperty('--text-primary', ct.text);
        html.setAttribute('data-theme', 'custom');
    } else if (name === 'light') {
        html.classList.add('light-mode');
        html.setAttribute('data-theme', name);
    } else {
        html.classList.add(`${name}-mode`);
        html.setAttribute('data-theme', name);
    }
};

// Global theme watcher
watch(() => settingsStore.theme, (newTheme) => {
    applyTheme(newTheme);
});

watch(() => settingsStore.isCustomTheme, (val) => {
    if (val) {
        applyTheme('custom');
    }
});

onMounted(async () => {
    // 1. Load basic settings & backup info
    await settingsStore.loadSettings();
    await backupStore.initialize();
    applyTheme(settingsStore.theme);

    // 2. Load Library (Async)
    await libraryStore.loadLibrary();

    // 3. Handle deep linking from URL Hash
    handleUrlParams();

    // 4. Setup Global Listeners
    setupMessageListeners();
    setupStorageListener();
    setupScrollTopListener();
});

/**
 * Handle deep linking params (e.g. #library?showDetails=...)
 */
const handleUrlParams = () => {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash.includes('library') || hash.includes('saved-entries')) {
        settingsStore.activeTab = 'saved-entries';
    }

    if (hash.includes('showDetails=')) {
        try {
            const parts = hash.split('showDetails=');
            if (parts.length > 1) {
                const title = decodeURIComponent(parts[1].split('&')[0]);
                libraryStore.showEntryDetails(title);
            }
        } catch (e) {
            console.error("[App] Error parsing URL params:", e);
        }
    }
};

/**
 * Handle runtime messages for navigation and logging
 */
const setupMessageListeners = () => {
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "showMangaDetails") {
            settingsStore.activeTab = 'saved-entries';
            libraryStore.showEntryDetails(msg.title);
        } else if (msg.type === "log") {
            console.log("[Background LOG]", msg.text);
        }
    });
};

/**
 * Sync stores when storage changes in another context
 */
const setupStorageListener = () => {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            settingsStore.syncFromStorage(changes);
            libraryStore.syncFromStorage(changes);
        }
    });
};

/**
 * Handle scroll top button visibility and container scrolling
 */
const setupScrollTopListener = () => {
    const container = document.querySelector(".main-content");
    if (!container) return;

    container.addEventListener("scroll", () => {
        showScrollTop.value = container.scrollTop > 300;
    });

    const btn = document.getElementById("scrollToTopBtn");
    if (btn) {
        btn.onclick = () => {
            container.scrollTo({ top: 0, behavior: "smooth" });
        };
    }
};


</script>

<style lang="scss">
@import './options.scss';
</style>
