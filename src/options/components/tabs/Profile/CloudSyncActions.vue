<template>
    <SettingsCard 
        title="Cloud Sync" 
        icon="☁️"
        icon-bg="rgba(16, 185, 129, 0.15)"
        icon-color="#10b981"
        guide-target="guide-profile-sync"
        class="sync-actions-card"
    >
        <div :class="{ disabled: !isSignedIn }">
            <div class="sync-actions-grid">
                <!-- Upload Action -->
                <div class="action-card upload-card">
                    <div class="action-icon-wrapper upload-icon">
                        <span>⬆️</span>
                    </div>
                    <div class="action-content">
                        <h4>Backup to Cloud</h4>
                        <p>Upload current library to Google Drive</p>
                    </div>
                    <button class="btn btn-primary" @click="performUpload" :disabled="!isSignedIn || syncStatus === 'syncing'">
                        <span v-if="syncStatus === 'syncing' && syncDirection === 'upload'" class="spinner"></span>
                        {{ syncStatus === 'syncing' && syncDirection === 'upload' ? 'Uploading...' : 'Backup Now' }}
                    </button>
                </div>

                <!-- Download Action -->
                <div class="action-card download-card">
                    <div class="action-icon-wrapper download-icon">
                        <span>⬇️</span>
                    </div>
                    <div class="action-content">
                        <h4>Restore from Cloud</h4>
                        <p>Download and merge with local data</p>
                    </div>
                    <button class="btn btn-secondary" @click="performDownload" :disabled="!isSignedIn || syncStatus === 'syncing'">
                        <span v-if="syncStatus === 'syncing' && syncDirection === 'download'" class="spinner"></span>
                        {{ syncStatus === 'syncing' && syncDirection === 'download' ? 'Restoring...' : 'Restore' }}
                    </button>
                </div>

                <!-- Cloud Status -->
                <div class="action-card status-card">
                    <div class="action-icon-wrapper status-icon">
                        <span>📊</span>
                    </div>
                    <div class="action-content">
                        <h4>Cloud Status</h4>
                        <p v-if="cloudBackupInfo" class="cloud-stats">
                            {{ cloudBackupInfo.entryCount }} entries • {{ cloudBackupInfo.size }}
                            <br />
                            <span class="last-modified">Modified: {{ cloudBackupInfo.lastModified }}</span>
                        </p>
                        <p v-else class="no-backup">No backup found in cloud</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" @click="refreshCloudStatus" :disabled="!isSignedIn">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <!-- Progress Bar -->
            <div v-if="syncStatus === 'syncing'" class="sync-progress-section">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" :style="{ width: syncProgress + '%' }"></div>
                </div>
                <span class="progress-text">{{ syncStatusMessage }}</span>
            </div>

            <!-- Last Sync Result -->
            <div v-if="lastSyncResult" :class="['sync-result-banner', lastSyncResult.type]">
                <span class="result-icon">{{ lastSyncResult.type === 'success' ? '✅' : '❌' }}</span>
                <span class="result-message">{{ lastSyncResult.message }}</span>
                <button class="dismiss-btn" @click="dismissResult">×</button>
            </div>
        </div>
    </SettingsCard>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import SettingsCard from '../../common/SettingsCard.vue';
import { useProfileStore } from '../../../scripts/store/profile.store.js';

const profileStore = useProfileStore();
const { 
    isSignedIn, syncStatus, syncProgress, syncStatusMessage, lastSyncResult, cloudBackupInfo
} = storeToRefs(profileStore);

const syncDirection = ref(null);

async function performUpload() {
    syncDirection.value = 'upload';
    await profileStore.uploadToCloud();
    syncDirection.value = null;
}

async function performDownload() {
    syncDirection.value = 'download';
    await profileStore.downloadFromCloud();
    syncDirection.value = null;
}

async function refreshCloudStatus() {
    await profileStore.updateCloudBackupInfo();
}

const dismissResult = () => {
    profileStore.clearSyncResult();
};
</script>

<style scoped lang="scss">
/* Sync Actions Card */
.sync-actions-card {
    grid-column: 1 / -1;

    &.disabled {
        opacity: 0.6;
    }

    .sync-actions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;

        .action-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
            padding: 24px 16px;
            background: var(--bg-body);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            transition: all 0.2s ease;

            &:hover {
                transform: translateY(-2px);
                border-color: var(--accent-primary);
                box-shadow: 0 4px 16px rgba(117, 81, 255, 0.1);
            }

            .action-icon-wrapper {
                width: 56px;
                height: 56px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;

                &.upload-icon { background: rgba(79, 70, 229, 0.15); }
                &.download-icon { background: rgba(16, 185, 129, 0.15); }
                &.status-icon { background: rgba(251, 191, 36, 0.15); }
            }

            .action-content {
                h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .cloud-stats { font-size: 13px !important; }

                .last-modified {
                    font-size: 11px;
                    opacity: 0.7;
                }

                .no-backup {
                    font-style: italic;
                    opacity: 0.6;
                }
            }
        }
    }

    /* Progress Section */
    .sync-progress-section {
        margin-top: 20px;
        padding: 16px;
        background: rgba(117, 81, 255, 0.05);
        border-radius: var(--radius-md);

        .progress-bar-container {
            height: 8px;
            background: var(--border-color);
            border-radius: 4px;
            overflow: hidden;

            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary), #6AD2FF);
                border-radius: 4px;
                transition: width 0.3s ease;
                animation: shimmer 1.5s infinite;
            }
        }

        .progress-text {
            display: block;
            margin-top: 8px;
            font-size: 13px;
            color: var(--text-secondary);
            text-align: center;
        }
    }

    /* Sync Result Banner */
    .sync-result-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        font-size: 14px;

        &.success {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
        }

        &.error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }

        .result-message { flex: 1; }

        .dismiss-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.6;
            color: inherit;

            &:hover { opacity: 1; }
        }
    }
}

@keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
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

.btn-secondary {
    background: var(--bg-body);
    border: 1px solid var(--border-color);
    color: var(--text-primary);

    &:hover {
        border-color: var(--accent-primary);
        background: rgba(117, 81, 255, 0.05);
    }
}

/* Responsive */
@media (max-width: 900px) {
    .sync-actions-grid {
        grid-template-columns: 1fr;
    }
}
</style>
