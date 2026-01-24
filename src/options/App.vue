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

import Sidebar from './components/Sidebar.vue';
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