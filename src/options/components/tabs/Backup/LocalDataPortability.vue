<template>
    <!-- Local Backup: Export -->
    <SettingsCard 
        title="Local Backup (Export)" 
        icon="icon-backup"
        icon-bg="rgba(67, 24, 255, 0.15)"
        icon-color="var(--accent-primary)"
        guide-target="guide-backup-export"
    >
        <div class="inner-info-card">
            <div class="format-info">
                <span class="label-info">Format: <span class="highlight-text">JSON</span></span>
            </div>
            <button 
                class="btn btn-primary btn-with-icon"
                @click="performLocalExport"
                :disabled="syncStatus === 'syncing'"
            >
                <!-- Show a spinner while exporting, otherwise show the download icon -->
                <span v-if="syncStatus === 'syncing' && syncDirection === 'export'" class="spinner"></span>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Selected
            </button>
        </div>

        <div class="card-footer-info" style="margin-top: 12px; font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            <span class="icon-svg icon-info"></span>
            <span>Last local backup: <span :class="{ 'highlight-text': lastLocalBackup }">{{ lastLocalBackupFormatted }}</span></span>
        </div>
    </SettingsCard>

    <!-- Local Backup: Import -->
    <SettingsCard 
        title="Local Restore (Import)" 
        icon="icon-folder"
        icon-bg="rgba(107, 70, 193, 0.15)"
        icon-color="#6B46C1"
        guide-target="guide-backup-import"
    >
        <!-- Success or Error Feedback Message -->
        <div v-if="lastSyncResult" :class="['status-feedback-box', lastSyncResult.type]">
            <span class="feedback-icon">
                <span class="icon-svg" :class="lastSyncResult.type === 'success' ? 'icon-check' : 'icon-close'"></span>
            </span>
            <span class="feedback-message">{{ lastSyncResult.message }}</span>
        </div>

        <!-- Permission Request Alert Box when custom sites are imported -->
        <div v-if="needsPermissions" class="permission-alert-box">
            <div class="alert-icon">
                <span class="icon-svg icon-warning" style="font-size: 20px;"></span>
            </div>
            <div class="alert-content">
                <h4>Permission Required</h4>
                <p>The imported backup contains custom sites. To let the extension highlight manga cards on these sites, Chrome needs your permission to access their URLs.</p>
                
                <ul class="custom-sites-list">
                    <li v-for="site in pendingCustomSites" :key="site.hostname" style="display: flex; align-items: center; gap: 6px;">
                        <span class="icon-svg icon-globe"></span>
                        <strong>{{ site.name || site.hostname }}</strong> ({{ site.hostname }})
                    </li>
                </ul>

                <div class="alert-buttons">
                    <button class="btn btn-primary btn-with-icon" @click="handleGrantPermissions" :disabled="syncStatus === 'syncing'">
                        <span v-if="syncStatus === 'syncing'" class="spinner"></span>
                        Grant Permissions &amp; Import
                    </button>
                    <button class="btn btn-secondary" @click="handleCancelImport" :disabled="syncStatus === 'syncing'">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <!-- Standard Drag and Drop upload zone -->
        <div 
            v-else
            class="drop-zone-container" 
            :class="{ 'drag-over': isDragging }"
            @click="$refs.fileInput.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
        >
            <!-- Hidden file input, triggered by clicking the zone -->
            <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileSelect" 
                accept=".json" 
                style="display: none;"
            >
            <div class="drop-zone-content">
                <div class="drop-zone-icon">
                    <span class="icon-svg icon-file" style="font-size: 24px;"></span>
                </div>
                <span class="drop-zone-text">Click to upload or drag and drop</span>
                <span class="drop-zone-subtext">Supports .json files (max 10MB)</span>
            </div>
        </div>

        <div v-if="!needsPermissions" class="import-actions-row" style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 16px;">
            <button 
                class="btn btn-primary btn-with-icon"
                @click="$refs.fileInput.click()"
                :disabled="syncStatus === 'syncing'"
            >
                <!-- Show a spinner while importing, otherwise show the upload icon -->
                <span v-if="syncStatus === 'syncing' && syncDirection === 'import'" class="spinner"></span>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Start Import
            </button>
        </div>
    </SettingsCard>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import SettingsCard from '../../common/SettingsCard.vue';
import { useBackupStore } from '../../../scripts/store/backup.store.js';

const backupStore = useBackupStore();
const { 
    syncStatus, 
    lastLocalBackup, 
    needsPermissions, 
    pendingCustomSites, 
    lastSyncResult 
} = storeToRefs(backupStore);

// Tracks which direction the operation is going (export vs import), used for spinner
const syncDirection = ref(null);

// Whether the user is currently dragging a file over the drop zone
const isDragging = ref(false);

// Shows "Never" or a readable date for when we last exported
const lastLocalBackupFormatted = computed(function() {
    if (!lastLocalBackup.value) return 'Never';
    return new Date(lastLocalBackup.value).toLocaleString();
});

/** Called when the user clicks the Export button */
async function performLocalExport() {
    syncDirection.value = 'export';
    await backupStore.exportLocalData();
    syncDirection.value = null;
}

/** Called when the user picks a file using the file dialog */
async function handleFileSelect(event) {
    var file = event.target.files[0];
    if (file) {
        syncDirection.value = 'import';
        await backupStore.importLocalData(file);
        syncDirection.value = null;
        event.target.value = ''; // Reset so the same file can be picked again
    }
}

/** Called when the user drops a file onto the drop zone */
async function handleFileDrop(event) {
    isDragging.value = false;
    var file = event.dataTransfer.files[0];
    if (file) {
        syncDirection.value = 'import';
        await backupStore.importLocalData(file);
        syncDirection.value = null;
    }
}

/** Called when the user clicks "Grant Permissions & Import" */
async function handleGrantPermissions() {
    syncDirection.value = 'import';
    await backupStore.grantPermissionsAndImport();
    syncDirection.value = null;
}

/** Called when the user clicks "Cancel" on the permissions alert */
function handleCancelImport() {
    backupStore.cancelImport();
}
</script>

<style scoped lang="scss">
.inner-info-card {
    background-color: rgba(255, 255, 255, 0.02);
    border: 1px dashed var(--border-color, #2B3674);
    border-radius: var(--radius-md, 8px);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    width: 100%;

    .format-info {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label-info {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);

            .highlight-text {
                color: #4318FF;
                font-weight: 700;
            }
        }
    }
}

.btn-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.drop-zone-container {
    background-color: rgba(255, 255, 255, 0.02);
    border: 2px dashed var(--border-color, #2B3674);
    border-radius: var(--radius-md, 8px);
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 24px;
    width: 100%;

    &:hover, &.drag-over {
        border-color: var(--accent-primary);
        background-color: rgba(67, 24, 255, 0.05);
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 10px 20px -5px rgba(67, 24, 255, 0.15);
    }

    .drop-zone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .drop-zone-icon {
            width: 48px;
            height: 48px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            color: var(--text-secondary);
        }

        .drop-zone-text {
            font-weight: 600;
            color: var(--text-primary);
        }

        .drop-zone-subtext {
            font-size: 12px;
            color: var(--text-secondary);
        }
    }
}

.import-actions-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

/* Success or Error Feedback Message Styling */
.status-feedback-box {
    padding: 12px 16px;
    border-radius: var(--radius-sm, 6px);
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;

    &.success {
        background-color: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: #10b981;
    }

    &.error {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }
}

/* Permission Alert Box Styling */
.permission-alert-box {
    background-color: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.25);
    border-radius: var(--radius-md, 8px);
    padding: 20px;
    margin-bottom: 24px;
    display: flex;
    gap: 16px;
    width: 100%;

    .alert-icon {
        font-size: 24px;
    }

    .alert-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;

        h4 {
            margin: 0;
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 600;
        }

        p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 13px;
            line-height: 1.5;
        }

        .custom-sites-list {
            list-style: none;
            padding: 0;
            margin: 4px 0 12px 0;
            display: flex;
            flex-direction: column;
            gap: 6px;

            li {
                font-size: 12px;
                color: var(--text-primary);
                background-color: rgba(255, 255, 255, 0.02);
                padding: 6px 12px;
                border-radius: var(--radius-sm, 4px);
                border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
                width: fit-content;
            }
        }

        .alert-buttons {
            display: flex;
            gap: 12px;
        }
    }
}

/* Spinning animation for the loading indicator */
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
</style>
