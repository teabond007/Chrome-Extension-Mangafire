<template>
    <SettingsCard 
        title="Sync Settings" 
        icon="⚙️"
        icon-bg="rgba(117, 81, 255, 0.15)"
        icon-color="var(--accent-primary)"
        guide-target="guide-profile-sync"
        full-height
    >
        <div class="sync-settings" :class="{ disabled: !isSignedIn }">
            <div class="auto-sync-row">
                <SwitchControl 
                    id="AutoSyncStartup"
                    label="Auto-sync on startup" 
                    sub-label="Sync when extension loads"
                    v-model="autoSyncEnabled"
                    :disabled="!isSignedIn"
                />
            </div>
            
            <div v-if="autoSyncEnabled" class="sync-interval-section">
                <div class="interval-input-group">
                    <label for="syncIntervalDays">Sync every</label>
                    <input 
                        type="number" 
                        id="syncIntervalDays" 
                        v-model.number="syncIntervalLocal" 
                        class="interval-input"
                        min="1"
                        max="30"
                        :disabled="!isSignedIn"
                    />
                    <span class="interval-suffix">days</span>
                </div>
                <div class="interval-buttons">
                    <button 
                        class="btn btn-sm" 
                        :class="isSaved ? 'btn-success' : 'btn-primary'"
                        @click="saveSyncInterval" 
                        :disabled="!isSignedIn"
                    >
                        {{ isSaved ? '✓ Saved!' : 'Save' }}
                    </button>
                    <button class="btn btn-sm btn-ghost" @click="resetSyncInterval" :disabled="!isSignedIn">Reset</button>
                </div>
            </div>
            
            <div class="divider-line"></div>
            
            <p class="section-label">Data to sync:</p>
            <div class="sync-checkboxes">
                <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                    <input type="checkbox" v-model="syncLibrary" :disabled="!isSignedIn" />
                    <span class="checkbox-label">📚 Library Entries</span>
                </label>
                <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                    <input type="checkbox" v-model="syncHistory" :disabled="!isSignedIn" />
                    <span class="checkbox-label">📖 Reading History</span>
                </label>
                <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                    <input type="checkbox" v-model="syncPersonal" :disabled="!isSignedIn" />
                    <span class="checkbox-label">🏷️ Tags, Notes & Ratings</span>
                </label>
                <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                    <input type="checkbox" v-model="syncSettings" :disabled="!isSignedIn" />
                    <span class="checkbox-label">⚙️ Settings</span>
                </label>
                <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                    <input type="checkbox" v-model="syncCache" :disabled="!isSignedIn" />
                    <span class="checkbox-label">💾 API Cache</span>
                </label>
            </div>

            <div class="divider-line"></div>
            
            <p class="section-label">External Ecosystems:</p>
            <div class="external-sync-section">
                <!-- AniList -->
                <div class="external-sync-item" :class="{ connected: isAnilistConnected }">
                    <div class="external-info">
                        <img src="https://anilist.co/img/icons/icon.svg" class="external-icon" alt="AniList">
                        <div class="external-text">
                            <span class="external-name">AniList</span>
                            <span class="external-status">{{ isAnilistConnected ? 'Connected' : 'Not Connected' }}</span>
                        </div>
                    </div>
                    <div class="external-actions">
                        <button v-if="!isAnilistConnected" @click="handleConnectAnilist" class="btn btn-sm btn-primary">Connect</button>
                        <template v-else>
                            <SwitchControl 
                                id="SyncAnilist"
                                label="Auto-Sync" 
                                v-model="syncAnilistEnabled"
                                compact
                            />
                            <button @click="profileStore.disconnectAnilist" class="btn btn-sm btn-ghost" title="Disconnect">&times;</button>
                        </template>
                    </div>
                </div>

                <!-- MyAnimeList -->
                <div class="external-sync-item" :class="{ connected: isMalConnected }">
                    <div class="external-info">
                        <img src="https://myanimelist.net/favicon.ico" class="external-icon" alt="MAL">
                        <div class="external-text">
                            <span class="external-name">MyAnimeList</span>
                            <span class="external-status">{{ isMalConnected ? 'Connected' : 'Not Connected' }}</span>
                        </div>
                    </div>
                    <div class="external-actions">
                        <button v-if="!isMalConnected" @click="handleConnectMal" class="btn btn-sm btn-primary">Connect</button>
                        <template v-else>
                            <SwitchControl 
                                id="SyncMal"
                                label="Auto-Sync" 
                                v-model="syncMalEnabled"
                                compact
                            />
                            <button @click="profileStore.disconnectMal" class="btn btn-sm btn-ghost" title="Disconnect">&times;</button>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </SettingsCard>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import SettingsCard from '../../common/SettingsCard.vue';
import SwitchControl from '../../common/SwitchControl.vue';
import { useProfileStore } from '../../../scripts/store/profile.store.js';

const profileStore = useProfileStore();
const { 
    isSignedIn, autoSyncEnabled, syncLibrary, syncHistory, syncPersonal, syncSettings, syncCache, syncInterval,
    syncAnilistEnabled, syncMalEnabled, isAnilistConnected, isMalConnected
} = storeToRefs(profileStore);

const syncIntervalLocal = ref(1);
const isSaved = ref(false);

onMounted(() => {
    syncIntervalLocal.value = syncInterval.value || 1;
});

// Sync local ref when store initializes
watch(syncInterval, (newVal) => {
    if (newVal) syncIntervalLocal.value = newVal;
});

const saveSyncInterval = async () => {
    await profileStore.setSyncInterval(syncIntervalLocal.value);
    
    // Visual feedback
    isSaved.value = true;
    setTimeout(() => {
        isSaved.value = false;
    }, 2000);
};

const resetSyncInterval = () => {
    syncIntervalLocal.value = 1;
    profileStore.setSyncInterval(1);
};

const handleConnectAnilist = async () => {
    try {
        await profileStore.connectAnilist();
    } catch (e) {
        alert('AniList Connection Failed: ' + e.message);
    }
};

const handleConnectMal = async () => {
    try {
        await profileStore.connectMal();
    } catch (e) {
        alert('MyAnimeList Connection Failed: ' + e.message);
    }
};

// Auto-persist other settings when changed
watch([
    autoSyncEnabled, syncLibrary, syncHistory, syncPersonal, syncSettings, syncCache,
    syncAnilistEnabled, syncMalEnabled
], () => {
    profileStore.savePreferences();
});
</script>

<style scoped lang="scss">
/* Sync Settings */
.sync-settings {
    &.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .divider-line {
        height: 1px;
        background: var(--border-color);
        margin: 16px 0;
    }

    .section-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 12px 0;
    }

    .sync-checkboxes {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    /* Sync Interval Section */
    .sync-interval-section {
        margin-top: 12px;
        padding: 12px;
        background: rgba(117, 81, 255, 0.05);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;

        .interval-input-group {
            display: flex;
            align-items: center;
            gap: 8px;

            label {
                font-size: 13px;
                color: var(--text-secondary);
            }

            .interval-input {
                width: 60px;
                padding: 6px 10px;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                background: var(--bg-body);
                color: var(--text-primary);
                font-size: 14px;
                text-align: center;

                &:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                }
            }

            .interval-suffix {
                font-size: 13px;
                color: var(--text-secondary);
            }
        }

        .interval-buttons {
            display: flex;
            gap: 8px;
        }
    }
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    transition: background 0.2s;

    &:hover:not(.disabled) {
        background: rgba(117, 81, 255, 0.05);
    }

    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-primary);
    }

    .checkbox-label {
        font-size: 13px;
        color: var(--text-primary);
    }
}

/* External Sync */
.external-sync-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.external-sync-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    transition: border-color 0.2s;

    &.connected {
        border-color: var(--accent-primary);
        background: rgba(117, 81, 255, 0.02);
    }

    .external-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .external-icon {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            object-fit: contain;
        }

        .external-text {
            display: flex;
            flex-direction: column;

            .external-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
            }

            .external-status {
                font-size: 11px;
                color: var(--text-secondary);
            }
        }
    }

    .external-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }
}

/* Spinner */
.spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
    margin-right: 6px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Button overrides */
.btn-sm {
    padding: 6px 12px;
    font-size: 12px;
}

.btn-primary {
    background: var(--accent-primary);
    color: white;
    border: none;

    &:hover {
        background: var(--accent-hover);
        box-shadow: 0 2px 8px rgba(67, 24, 255, 0.25);
    }
}

.btn-success {
    background: #10b981;
    color: white;
    border: none;
    cursor: default;
}

.btn-secondary {
    background: var(--bg-body);
    border: 1px solid var(--border-color);
    color: var(--text-primary);

    &:hover {
        border-color: var(--accent-primary);
        background: rgba(117, 81, 255, 0.05);
    }
}
</style>
