<template>
    <div id="tab-about" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'about' }">
        <header class="header">
            <div class="header-text">
                <h1>About</h1>
                <p class="subtitle">Information, usage guide, and extension architecture.</p>
            </div>
        </header>

        <div class="content-grid">
            <AboutProjectInfo />
            <AboutUserGuide />
            <SupportDevCard />
        </div>
    </div>
</template>

<script setup>
import AboutProjectInfo from './AboutProjectInfo.vue';
import AboutUserGuide from './AboutUserGuide.vue';
import SupportDevCard from './SupportDevCard.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
</script>

<style scoped lang="scss">
</style>
