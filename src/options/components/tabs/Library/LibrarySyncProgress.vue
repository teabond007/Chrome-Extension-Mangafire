<template>
    <div v-if="syncState.isSyncing" class="sync-progress-container fade-in">
        <div class="sync-info">
            <span class="sync-label">
                <span class="sync-spinner"></span>
                Updating Library...
            </span>
            <span class="sync-count">{{ syncState.current }} / {{ syncState.total }}</span>
        </div>
        <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: syncState.percentage + '%' }"></div>
        </div>
        <div class="sync-details">{{ syncState.currentTitle }}</div>
    </div>
</template>

<script setup>
defineProps({
    syncState: {
        type: Object,
        required: true
    }
});
</script>

<style scoped lang="scss">
.sync-progress-container {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);

    .sync-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);

        .sync-label {
            display: flex;
            align-items: center;
            gap: 8px;

            .sync-spinner {
                width: 14px;
                height: 14px;
                border: 2px solid var(--text-secondary);
                border-top-color: var(--accent-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
        }
    }

    .progress-bar-bg {
        height: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 6px;

        .progress-bar-fill {
            height: 100%;
            background: var(--accent-primary);
            transition: width 0.3s ease;
            border-radius: 10px;
        }
    }

    .sync-details {
        font-size: 11px;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
