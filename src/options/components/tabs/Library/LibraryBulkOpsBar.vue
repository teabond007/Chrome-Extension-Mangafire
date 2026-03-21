<template>
    <div v-if="isBulkMode" class="bulk-ops-bar standard-card" style="display: flex;">
        <div class="bulk-info">
            <span>{{ selectedCount }} items filtered</span>
        </div>
        <div class="bulk-actions">
            <span>Update All Filtered to:</span>
            <select v-model="bulkStatus" class="select-field sm">
                <option value="Reading">Reading</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Plan to Read">Plan to Read</option>
                <option value="Dropped">Dropped</option>
            </select>
            <button @click="$emit('apply', bulkStatus)" class="btn btn-primary btn-sm">Apply Update</button>
            <button @click="$emit('close')" class="btn btn-ghost btn-sm">&times;</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    isBulkMode: Boolean,
    selectedCount: Number
});

defineEmits(['apply', 'close']);

const bulkStatus = ref('Reading');
</script>

<style scoped lang="scss">
.bulk-ops-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 0.75rem 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: fadeInDown 0.3s ease-out;

    .bulk-info {
        font-weight: 600;
        color: var(--accent-primary);
    }

    .bulk-actions {
        display: flex;
        align-items: center;
        gap: 1rem;

        span {
            font-size: 0.9rem;
            color: var(--text-primary);
        }
    }
}

@keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

.sm {
    height: 32px !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
}
</style>
