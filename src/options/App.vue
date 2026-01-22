<template>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-icon">
                    <span class="icon-svg icon-brand"></span>
                </div>
                <span class="brand-name header-text-gradient">Color Marker</span>
            </div>

            <nav class="nav-menu">
                <a href="#" class="nav-item active" data-tab="settings">
                    <span class="nav-icon">⚙️</span>
                    General Settings
                </a>
                <a href="#" class="nav-item" data-tab="saved-entries">
                    <span class="nav-icon">&#128218;</span>
                    Saved Entries
                </a>
                <a href="#" class="nav-item" data-tab="import-export">
                    <span class="nav-icon">&#128194;</span>
                    Import & Export
                </a>
                <a href="#" class="nav-item" data-tab="appearance">
                    <span class="nav-icon">🎨</span>
                    Appearance
                </a>
                <a href="#" class="nav-item" data-tab="about">
                    <span class="nav-icon">ℹ️</span>
                    About
                </a>
                <div class="nav-indicator"></div>
            </nav>

            <div class="sidebar-footer">
                <a href="https://www.buymeacoffee.com" target="_blank" class="sidebar-btn support-sidebar-btn"
                    title="Support Developer">
                    <span class="icon">☕</span>
                    <span class="label">Support Dev</span>
                </a>
                <div class="version-info">Version 3.7.0</div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <GeneralTab />
            <AppearanceTab />
            <SavedEntriesTab />
            <ImportExportTab />
            <AboutTab />
        </main>
    </div>

    <!-- Scroll to Top Button -->
    <button id="scrollToTopBtn" class="scroll-to-top" title="Go to top">
        <svg class="icon-svg icon-arrow-up"></svg>
    </button>

    <MangaDetailsModal />
</template>

<script setup>
import { onMounted } from 'vue';
import { init } from './scripts/options.js';

import GeneralTab from './components/GeneralTab.vue';
import AppearanceTab from './components/AppearanceTab.vue';
import SavedEntriesTab from './components/SavedEntriesTab.vue';
import ImportExportTab from './components/ImportExportTab.vue';
import AboutTab from './components/AboutTab.vue';
import MangaDetailsModal from './components/MangaDetailsModal.vue';

onMounted(() => {
    init();
});
</script>

<style>
@import './options.scss';
</style>