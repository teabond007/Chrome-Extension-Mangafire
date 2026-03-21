<template>
    <div class="site-item" :class="{ disabled: !site.enabled }">
        <div class="site-info" @click="$emit('open', site)">
            <div class="site-header">
                <span class="site-name">{{ site.name }}</span>
                <span class="site-status" :class="statusClass">
                    {{ statusText }}
                </span>
            </div>
            <span class="site-hostname">{{ site.url || site.hostname }}</span>
        </div>
        <div class="site-actions">
            <button 
                class="btn btn-icon" 
                @click="$emit('edit', site)"
                title="Edit Selectors"
            >✏️</button>
            <button 
                class="btn btn-icon btn-reader" 
                @click="$emit('edit-reader', site)"
                title="Edit Reading Page"
            >📖</button>
            <button 
                class="btn btn-icon" 
                @click="toggleSite"
                :title="site.enabled ? 'Disable' : 'Enable'"
            >{{ site.enabled ? '🟢' : '⚫' }}</button>
            <button 
                class="btn btn-icon btn-danger" 
                @click="deleteSite"
                title="Delete"
            >🗑️</button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCustomSitesStore } from '../../../scripts/store/custom-sites.store.js';

const props = defineProps({
    site: Object
});

const emit = defineEmits(['open', 'edit', 'edit-reader']);
const customSitesStore = useCustomSitesStore();

const selectorStatus = computed(() => {
    const site = props.site;
    if (!site.selectors) return 'empty';
    
    const selectors = Array.isArray(site.selectors) ? site.selectors : [site.selectors];
    if (selectors.length === 0) return 'empty';
    
    const hasCard = selectors.some(s => s.card);
    if (!hasCard) return 'empty';
    
    const invalidGroup = selectors.find(s => s.card && !s.title);
    if (invalidGroup) return 'incomplete';
    
    return 'complete';
});

const statusClass = computed(() => selectorStatus.value);
const statusText = computed(() => {
    switch (selectorStatus.value) {
        case 'complete': return '✓ Ready';
        case 'incomplete': return '⚠ Incomplete';
        case 'empty': return '✗ Not configured';
        default: return '';
    }
});

const toggleSite = async () => {
    await customSitesStore.toggleSite(props.site.id);
};

const deleteSite = async () => {
    if (!confirm('Are you sure you want to delete this site configuration?')) return;
    await customSitesStore.removeSite(props.site.id);
};
</script>

<style scoped lang="scss">
.site-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: var(--bg-body);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    transition: all 0.2s;

    &:hover {
        border-color: var(--accent-primary);
        transform: translateY(-1px);
    }

    &.disabled {
        opacity: 0.5;
    }

    .site-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        cursor: pointer;

        .site-header {
            display: flex;
            align-items: center;
            gap: 10px;

            .site-name {
                font-weight: 600;
                color: var(--text-primary);
            }

            .site-status {
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 10px;

                &.complete {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }

                &.incomplete {
                    background: rgba(251, 191, 36, 0.15);
                    color: #FBBF24;
                }

                &.empty {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                }
            }
        }

        .site-hostname {
            font-size: 12px;
            color: var(--text-muted);
        }
    }

    .site-actions {
        display: flex;
        gap: 8px;

        .btn-icon {
            padding: 8px;
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: rgba(117, 81, 255, 0.1);
                border-color: var(--accent-primary);
            }

            &.btn-danger:hover {
                background: rgba(239, 68, 68, 0.1);
                border-color: #ef4444;
            }

            &.btn-reader:hover {
                background: rgba(16, 185, 129, 0.1);
                border-color: #10b981;
            }
        }
    }
}
</style>
