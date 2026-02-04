<template>
    <div id="tab-dev-only" class="tab-pane fade-in" style="display: none;">
        <header class="header">
            <div class="header-text">
                <h1>Dev Only</h1>
                <p class="subtitle">TOS-sensitive features and developer tools. Use with caution.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Card: Dev Preferences -->
            <SettingsCard 
                title="Dev Preferences" 
                icon="🛠️" 
            >
                <div class="input-group-row">
                    <SwitchControl 
                        id="SyncandMarkRead" 
                        label="Sync & Mark Read" 
                        sub-label="Sync history and mark as read" 
                        v-model="syncAndMarkRead"
                    />
                </div>
            </SettingsCard>

            <div class="cards-row">
                <!-- Card: Auto Sync -->
                <SettingsCard 
                    title="Auto Sync" 
                    icon="🔄" 
                    full-height
                >
                    <div class="feature-toggle-header">
                        <span class="description" style="margin:0">Automatically update bookmarks on site visit.</span>
                        <ToggleSwitch 
                            id="AutoSync" 
                            title="Enable Auto Sync"
                        />
                    </div>
                    <div style="margin-top: 15px;"></div>

                    <div class="input-wrapper">
                        <label for="AutoSyncSetDays">Sync Interval (Days)</label>
                        <div class="input-with-button">
                            <input type="number" id="AutoSyncSetDays" v-model="syncInterval" class="input-field">
                        </div>
                    </div>

                    <div class="button-group bottom-align">
                        <button id="AutoSyncSetDaysButton" class="btn btn-primary">Save Interval</button>
                        <button id="AutoSyncSetDaysButtonReset" class="btn btn-ghost">Reset Default</button>
                    </div>
                </SettingsCard>

                <!-- Card: Manual Synchronization -->
                <SettingsCard 
                    title="Manual Synchronization" 
                    icon="⚠️" 
                    icon-bg="rgba(255, 171, 0, 0.1)"
                    icon-color="var(--warning)"
                    highlight
                    full-height
                >
                    <div class="card-body flex-row-center" style="padding-top: 0;">
                        <div class="info-section">
                            <ul class="info-list">
                                <li>Requires you to be logged into MangaFire.to</li>
                                <li>Saves your read history and highlights</li>
                                <li>Disabling sync prevents read status saving</li>
                            </ul>
                        </div>
                        <div class="action-section">
                            <button id="sendMessageBtnSyncBookmarks" class="btn btn-warning-large">
                                ⚡ Sync Bookmarks Now
                            </button>
                            <p class="tiny-text">Last synced: Check logs below</p>
                        </div>
                    </div>
                </SettingsCard>
            </div>

            <!-- Log Container -->
            <div class="card bg-terminal" style="padding: 0;">
                <div class="card-header"
                    style="padding: 12px 20px; margin-bottom: 0; border-bottom: 1px solid rgba(0, 255, 0, 0.1);">
                    <div class="card-icon"
                        style="background: rgba(0, 255, 0, 0.1); color: #00FF00; width: 30px; height: 30px; font-size: 16px;">
                        🔍</div>
                    <h3 style="font-size: 14px; color: #00FF00; margin: 0;">Debug Logs</h3>
                </div>
                <div id="logContainer" class="terminal-log"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import ToggleSwitch from '../common/ToggleSwitch.vue';
import SwitchControl from '../common/SwitchControl.vue';
import SettingsCard from '../common/SettingsCard.vue';
import { useSettingsStore } from '../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
const { 
    syncAndMarkRead,
    syncInterval
} = storeToRefs(settingsStore);

// Auto-persist watchers
const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => {
        settingsStore.updateSetting(key, newVal);
    });
};

bindSetting(syncAndMarkRead, 'syncAndMarkRead');
// syncInterval is handled by legacy button in options.js but we bind it for consistency
bindSetting(syncInterval, 'syncInterval');

</script>

<style scoped>
.cards-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.input-group-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.feature-toggle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

.terminal-log {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
    background: #0a0a0a;
    color: #00FF00;
}

.bg-terminal {
    background: #0a0a0a;
    border: 1px solid rgba(0, 255, 0, 0.2);
}

.flex-row-center {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.tiny-text {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.info-list {
    padding-left: 20px;
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.info-list li {
    margin-bottom: 5px;
}
</style>
