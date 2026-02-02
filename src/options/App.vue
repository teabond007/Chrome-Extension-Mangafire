<template>
    <div class="app-container">
        <!-- Sidebar -->
        <Sidebar />

        <!-- Main Content -->
        <main class="main-content">
            <GeneralTab />
            <AppearanceTab />
            <SavedEntriesTab />
            <ImportExportTab />
            <AboutTab />
            <DevOnlyTab />
        </main>
    </div>

    <!-- Scroll to Top Button -->
    <button id="scrollToTopBtn" class="scroll-to-top" title="Go to top">
        <svg class="icon-svg icon-arrow-up"></svg>
    </button>

    <MangaDetailsModal />
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { init } from './scripts/options.js';
import { useSettingsStore } from './scripts/store/settings.store.js';

import Sidebar from './components/Sidebar.vue';
import GeneralTab from './components/GeneralTab.vue';
import AppearanceTab from './components/AppearanceTab.vue';
import SavedEntriesTab from './components/SavedEntriesTab.vue';
import ImportExportTab from './components/ImportExportTab.vue';
import AboutTab from './components/AboutTab.vue';
import DevOnlyTab from './components/DevOnlyTab.vue';
import MangaDetailsModal from './components/MangaDetailsModal.vue';

const settingsStore = useSettingsStore();

const applyTheme = (name) => {
    const html = document.documentElement;
    
    // Clear any inline custom theme styles first
    html.style.removeProperty('--bg-body');
    html.style.removeProperty('--bg-sidebar');
    html.style.removeProperty('--bg-card');
    html.style.removeProperty('--accent-primary');
    html.style.removeProperty('--text-primary');
    
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode', 'glassy-mode');
    
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
    } else if (name === 'glassy') {
        html.classList.add('glassy-mode');
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
    await settingsStore.loadSettings();
    applyTheme(settingsStore.theme);
    init();
});
</script>

<style>
@import './options.scss';
</style>