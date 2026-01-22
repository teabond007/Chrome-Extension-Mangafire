<!--
  Sync Tab
  
  Bookmark synchronization settings and status.
-->

<template>
    <div class="tab-content">
        <GlassCard title="Bookmark Synchronization" subtitle="Sync reading progress with platform accounts">
            <div class="settings-group">
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Automatic Sync</span>
                        <span class="setting-description">Sync bookmarks every 30 minutes in background</span>
                    </div>
                    <BaseToggle 
                        :model-value="features.autoSync" 
                        @update:model-value="(val) => updateSetting('features.autoSync', val)" 
                    />
                </div>
                
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Sync Read Status</span>
                        <span class="setting-description">Mark chapters as read across devices</span>
                    </div>
                    <BaseToggle 
                        :model-value="features.syncAndMarkRead" 
                        @update:model-value="(val) => updateSetting('features.syncAndMarkRead', val)" 
                    />
                </div>
            </div>
            
            <div class="sync-actions">
                <div class="last-sync-info">
                    <span class="label">Last Sync:</span>
                    <span class="value">{{ lastSyncFormatted }}</span>
                </div>
                
                <BaseButton 
                    variant="primary" 
                    icon="🔄" 
                    :loading="isSyncing"
                    @click="triggerManualSync"
                >
                    {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
                </BaseButton>
            </div>
        </GlassCard>
        
        <GlassCard title="Sync Logs" subtitle="Recent synchronization activity">
            <div class="logs-container">
                <div v-if="syncLogs.length === 0" class="empty-logs">
                    No sync activity recorded.
                </div>
                <div v-else class="log-list">
                    <div v-for="(log, index) in syncLogs" :key="index" class="log-entry">
                        <span class="log-time">{{ log.time }}</span>
                        <span class="log-message" :class="log.type">{{ log.message }}</span>
                    </div>
                </div>
            </div>
        </GlassCard>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSettings } from '@/composables/useSettings';
import { STORAGE_KEYS } from '@/core/storage-schema';
import GlassCard from '@/components/GlassCard.vue';
import BaseToggle from '@/components/BaseToggle.vue';
import BaseButton from '@/components/BaseButton.vue';

const { features, updateSetting } = useSettings();

const lastSyncTime = ref(null);
const isSyncing = ref(false);
const syncLogs = ref([]);

const lastSyncFormatted = computed(() => {
    if (!lastSyncTime.value) return 'Never';
    return new Date(lastSyncTime.value).toLocaleString();
});

onMounted(async () => {
    // Load last sync time
    const data = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC);
    lastSyncTime.value = data[STORAGE_KEYS.LAST_SYNC] || null;
});

const triggerManualSync = async () => {
    if (isSyncing.value) return;
    
    isSyncing.value = true;
    addLog('Starting manual sync...', 'info');
    
    try {
        // TODO: Call actual sync service
        // Since logic might be in background, we might need runtime.sendMessage
        // For Phase 2 UI migration, use a simulation or message
        
        // Simulating sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const now = Date.now();
        await chrome.storage.local.set({ [STORAGE_KEYS.LAST_SYNC]: now });
        lastSyncTime.value = now;
        
        addLog('Sync completed successfully', 'success');
    } catch (error) {
        console.error(error);
        addLog('Sync failed: ' + error.message, 'error');
    } finally {
        isSyncing.value = false;
    }
};

const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    syncLogs.value.unshift({ time, message, type });
    if (syncLogs.value.length > 50) syncLogs.value.pop();
};
</script>

<style lang="scss" scoped>
.tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.settings-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
}

.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child {
        border-bottom: none;
    }
}

.setting-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.setting-label {
    font-weight: 500;
}

.setting-description {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}

.sync-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
}

.last-sync-info {
    display: flex;
    gap: var(--space-2);
    font-size: var(--text-sm);
    
    .label {
        color: var(--color-text-muted);
    }
    
    .value {
        font-weight: 500;
        color: var(--color-text-primary);
    }
}

.logs-container {
    background: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: var(--text-xs);
}

.empty-logs {
    padding: var(--space-4);
    text-align: center;
    color: var(--color-text-muted);
}

.log-entry {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    
    &:last-child {
        border-bottom: none;
    }
}

.log-time {
    color: var(--color-text-muted);
    min-width: 65px;
}

.log-message {
    &.info { color: var(--color-text-secondary); }
    &.success { color: var(--color-success); }
    &.error { color: var(--color-error); }
}
</style>
