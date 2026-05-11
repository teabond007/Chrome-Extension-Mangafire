<template>
    <!-- Local Backup: Export -->
    <SettingsCard 
        title="Local Backup (Export)" 
        icon="💾"
        icon-bg="rgba(67, 24, 255, 0.15)"
        icon-color="var(--accent-primary)"
        guide-target="guide-profile-export"
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
                <span v-if="syncStatus === 'syncing' && syncDirection === 'export'" class="spinner"></span>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Selected
            </button>
        </div>

        <div class="card-footer-info" style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
            <span>ℹ️ Last local backup: <span :class="{ 'highlight-text': lastLocalBackup }">{{ lastLocalBackupFormatted }}</span></span>
        </div>
    </SettingsCard>

    <!-- Local Backup: Import -->
    <SettingsCard 
        title="Local Restore (Import)" 
        icon="📂"
        icon-bg="rgba(107, 70, 193, 0.15)"
        icon-color="#6B46C1"
        guide-target="guide-profile-import"
    >
        <div 
            class="drop-zone-container" 
            :class="{ 'drag-over': isDragging }"
            @click="$refs.fileInput.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
        >
            <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileSelect" 
                accept=".json" 
                style="display: none;"
            >
            <div class="drop-zone-content">
                <div class="drop-zone-icon" style="font-size: 24px;">📄</div>
                <span class="drop-zone-text">Click to upload or drag and drop</span>
                <span class="drop-zone-subtext">Supports .json files (max 10MB)</span>
            </div>
        </div>

        <div class="import-actions-row" style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 16px;">
            <button 
                class="btn btn-primary btn-with-icon"
                @click="$refs.fileInput.click()"
                :disabled="syncStatus === 'syncing'"
            >
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
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { useProfileStore } from '../../../scripts/store/profile.store.js';

const profileStore = useProfileStore();
const { 
    syncStatus, lastLocalBackup 
} = storeToRefs(profileStore);

const syncDirection = ref(null);
const isDragging = ref(false);
const fileInput = ref(null);

const lastLocalBackupFormatted = computed(() => {
    if (!lastLocalBackup.value) return 'Never';
    return new Date(lastLocalBackup.value).toLocaleString();
});

async function performLocalExport() {
    syncDirection.value = 'export';
    await profileStore.exportLocalData();
    syncDirection.value = null;
}

const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
        syncDirection.value = 'import';
        await profileStore.importLocalData(file, true);
        syncDirection.value = null;
        event.target.value = '';
    }
};

const handleFileDrop = async (event) => {
    isDragging.value = false;
    const file = event.dataTransfer.files[0];
    if (file) {
        syncDirection.value = 'import';
        await profileStore.importLocalData(file, true);
        syncDirection.value = null;
    }
};

</script>

<style scoped lang="scss">
/* Local Backup: Export & Import Styles */
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

        .sub-description {
            font-size: 11px;
            color: var(--text-secondary);
            font-style: italic;
        }
    }
}

.btn-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* Import Drop Zone */
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
</style>
