<template>
    <div id="tab-backup" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'backup' }">
        <header class="header">
            <div class="header-text">
                <h1>Backup</h1>
                <p class="subtitle">Save your manga library to a file, or load it back from one.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- The only component here is for local file export and import -->
            <LocalDataPortability />
        </div>
    </div>
</template>

<script setup>
import LocalDataPortability from './LocalDataPortability.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
</script>

<style scoped lang="scss">
.profile-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
}
</style>
