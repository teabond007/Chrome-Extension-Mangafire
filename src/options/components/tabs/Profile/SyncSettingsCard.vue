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
    isSignedIn, autoSyncEnabled, syncLibrary, syncHistory, syncPersonal, syncSettings, syncCache, syncInterval
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

// Auto-persist other settings when changed
watch([autoSyncEnabled, syncLibrary, syncHistory, syncPersonal, syncSettings, syncCache], () => {
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
