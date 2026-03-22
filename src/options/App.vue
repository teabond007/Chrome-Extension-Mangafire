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
            <ProfileTab v-show="settingsStore.activeTab === 'profile'" />
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
import ProfileTab from './components/tabs/Profile/ProfileTab.vue';
import MangaDetailsModal from './components/tabs/Library/MangaDetailsModal.vue';
import { useProfileStore } from './scripts/store/profile.store.js';

const settingsStore = useSettingsStore();
const profileStore = useProfileStore();
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
    // 1. Load basic settings & profile
    await settingsStore.loadSettings();
    await profileStore.initialize();
    applyTheme(settingsStore.theme);

    // 2. Load Library (Async)
    await libraryStore.loadLibrary();

    // 3. Handle deep linking from URL Hash
    handleUrlParams();

    // 4. Setup Global Listeners
    setupMessageListeners();
    setupStorageListener();
    setupScrollTopListener();

    // 5. Initial Animation
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.tab-pane.active .card',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutExpo'
        });
    }
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

/**
 * Trigger manual sync process via background script
 */
const triggerManualSync = () => {
    console.log("[App] Requesting bookmark sync...");
    chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("[App] Sync Error: " + chrome.runtime.lastError.message);
        }
    });
};

// Expose globally for legacy HTML buttons if any remain
window.triggerManualSync = triggerManualSync;
</script>

<style lang="scss">
@import './options.scss';
</style>
