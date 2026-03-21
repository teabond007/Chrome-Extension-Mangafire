<template>
    <div id="tab-profile" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'profile' }">
        <header class="header">
            <div class="header-text">
                <h1>Profile & Sync</h1>
                <p class="subtitle">Sync your manga library across devices with Google Drive. No server required.</p>
            </div>
        </header>

        <div class="content-grid">
            <AccountStatusCard />
            <SyncSettingsCard />
            <CloudSyncActions />
            <LocalDataPortability />

            <!-- Setup Required Banner -->
            <div v-if="!isOAuthConfigured" class="setup-banner">
                <div class="banner-icon">🔧</div>
                <div class="banner-content">
                    <h4>Setup Required</h4>
                    <p>Google Drive sync requires OAuth configuration. See the implementation plan for setup instructions.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import AccountStatusCard from './AccountStatusCard.vue';
import SyncSettingsCard from './SyncSettingsCard.vue';
import CloudSyncActions from './CloudSyncActions.vue';
import LocalDataPortability from './LocalDataPortability.vue';
import { useProfileStore } from '../../../scripts/store/profile.store.js';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const profileStore = useProfileStore();
const settingsStore = useSettingsStore();

const { isOAuthConfigured } = storeToRefs(profileStore);
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

/* Base styles are preserved by keeping them in global style if needed,
   or they are inherited since the classes are the same. */
</style>
