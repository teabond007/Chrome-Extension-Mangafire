<template>
    <div class="site-item" :class="{ disabled: !site.enabled }">
        <div class="site-info">
            <div class="site-header" style="display: flex; align-items: center; gap: 10px;">
                <span class="site-name">{{ site.name }}</span>
                <span class="site-status" :class="cardStatus" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span class="icon-svg" :class="cardStatus === 'complete' ? 'icon-check' : (cardStatus === 'incomplete' ? 'icon-warning' : 'icon-close')" style="font-size: 10px;"></span>
                    {{ cardStatusText }}
                </span>
                <span class="site-status" :class="readerStatus" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span class="icon-svg" :class="readerStatus === 'complete' ? 'icon-check' : (readerStatus === 'incomplete' ? 'icon-warning' : 'icon-close')" style="font-size: 10px;"></span>
                    {{ readerStatusText }}
                </span>
            </div>
            <span class="site-hostname">{{ site.url || site.hostname }}</span>
        </div>
        <div class="site-actions">
            <button 
                class="btn btn-icon" 
                @click="$emit('edit', site)"
                title="Edit Card Selectors"
            >
                <span class="icon-svg icon-settings" style="width: 14px; height: 14px; display: inline-block;"></span>
            </button>
            <button 
                class="btn btn-icon btn-reader" 
                @click="$emit('edit-reader', site)"
                title="Edit Reader Selectors"
            >
                <span class="icon-svg icon-book-open" style="width: 14px; height: 14px; display: inline-block;"></span>
            </button>
            <button 
                class="btn btn-icon" 
                @click="toggleSite"
                :title="site.enabled ? 'Disable' : 'Enable'"
                :style="{ color: site.enabled ? '#10b981' : 'var(--text-muted)' }"
            >
                <span class="icon-svg" :class="site.enabled ? 'icon-check' : 'icon-close'" style="width: 14px; height: 14px; display: inline-block;"></span>
            </button>
            <button 
                class="btn btn-icon btn-danger" 
                @click="deleteSite"
                title="Delete"
            >
                <span class="icon-svg icon-trash" style="width: 14px; height: 14px; display: inline-block;"></span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCustomSitesStore } from '../../../scripts/store/custom-sites.store.js';

const props = defineProps({
    site: Object
});

const emit = defineEmits(['edit', 'edit-reader']);
const customSitesStore = useCustomSitesStore();

const cardStatus = computed(() => {
    console.log("checking card status");
    var site = props.site;
    if (!site.selectors) {
        return 'empty';
    }
    
    var selectors = [];
    if (Array.isArray(site.selectors)) {
        for (var i = 0; i < site.selectors.length; i++) {
            selectors.push(site.selectors[i]);
        }
    } else {
        selectors.push(site.selectors);
    }
    
    if (selectors.length === 0) {
        return 'empty';
    }
    
    var hasCard = false;
    for (var j = 0; j < selectors.length; j++) {
        if (selectors[j] && selectors[j].card) {
            hasCard = true;
            break;
        }
    }
    
    if (hasCard == false) {
        return 'empty';
    }
    
    var hasIncomplete = false;
    for (var k = 0; k < selectors.length; k++) {
        var s = selectors[k];
        if (s && s.card && !s.title) {
            hasIncomplete = true;
            break;
        }
    }
    
    if (hasIncomplete == true) {
        return 'incomplete';
    }
    
    return 'complete';
});

const cardStatusText = computed(() => {
    console.log("getting card status text: " + cardStatus.value);
    if (cardStatus.value === 'complete') {
        return 'Card Selectors';
    }
    if (cardStatus.value === 'incomplete') {
        return 'Incomplete Cards';
    }
    if (cardStatus.value === 'empty') {
        return 'Missing Card Selectors';
    }
    return '';
});

/**
 * Determines configuration status of reader selectors
 */
const readerStatus = computed(() => {
    console.log("checking reader status");
    var site = props.site;
    if (!site.readerSelectors) {
        return 'empty';
    }
    
    var r = site.readerSelectors;
    var hasDetect = r.readerDetect != undefined && r.readerDetect != "";
    var hasTitle = r.readerTitle != undefined && r.readerTitle != "";
    var hasChapter = r.readerChapter != undefined && r.readerChapter != "";
    
    if (hasDetect == false && hasTitle == false && hasChapter == false) {
        return 'empty';
    }
    if (hasDetect == false || hasTitle == false || hasChapter == false) {
        return 'incomplete';
    }
    
    return 'complete';
});

const readerStatusText = computed(() => {
    console.log("getting reader status text: " + readerStatus.value);
    if (readerStatus.value === 'complete') {
        return 'Reader Selectors';
    }
    if (readerStatus.value === 'incomplete') {
        return 'Incomplete Reader';
    }
    if (readerStatus.value === 'empty') {
        return 'Missing Reader Selectors';
    }
    return '';
});

const toggleSite = async () => {
    console.log("toggling site: " + props.site.name);
    try {
        await customSitesStore.toggleSite(props.site.id);
    } catch (err) {
        console.log("error toggling: " + err);
    }
};

const deleteSite = async () => {
    console.log("deleting site: " + props.site.name);
    try {
        var ok = confirm('Are you sure you want to delete this site configuration?');
        if (ok == true) {
            await customSitesStore.removeSite(props.site.id);
        }
    } catch (err) {
        console.log("error deleting: " + err);
    }
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
