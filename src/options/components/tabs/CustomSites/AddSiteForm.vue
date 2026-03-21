<template>
    <SettingsCard 
        title="Add New Site" 
        icon="➕"
        icon-bg="rgba(16, 185, 129, 0.15)"
        icon-color="#10b981"
        guide-target="guide-custom-add"
    >
        <div class="add-site-form">
            <div class="form-group">
                <label for="newSiteUrl">Website URL</label>
                <input 
                    type="url" 
                    id="newSiteUrl" 
                    v-model="newSiteUrl" 
                    placeholder="https://example-manga.com"
                    class="input-field"
                />
                <span class="form-hint">Enter the homepage of the manga site you want to add.</span>
            </div>
            <div class="form-group">
                <label for="newSiteName">Display Name</label>
                <input 
                    type="text" 
                    id="newSiteName" 
                    v-model="newSiteName" 
                    placeholder="Example Manga Site"
                    class="input-field"
                />
            </div>
            <button 
                class="btn btn-primary"
                @click="startAddSite"
                :disabled="!isValidUrl"
            >
                <span>🔍</span> Open & Select Elements
            </button>
        </div>
    </SettingsCard>
</template>

<script setup>
import { ref, computed } from 'vue';
import SettingsCard from '../../common/SettingsCard.vue';
import { useCustomSitesStore } from '../../../scripts/store/custom-sites.store.js';

const customSitesStore = useCustomSitesStore();
const newSiteUrl = ref('');
const newSiteName = ref('');

const isValidUrl = computed(() => {
    try {
        const url = new URL(newSiteUrl.value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
});

async function startAddSite() {
    if (!isValidUrl.value) return;

    try {
        const url = new URL(newSiteUrl.value);
        const hostname = url.hostname;
        const origin = url.origin + '/*';

        const granted = await chrome.permissions.request({
            origins: [origin]
        });

        if (!granted) {
            alert('Permission denied. The extension needs access to this site to work.');
            return;
        }

        const site = await customSitesStore.addSite({
            hostname: hostname,
            url: newSiteUrl.value,
            name: newSiteName.value || hostname,
            selectors: [{
                card: '',
                title: ''
            }]
        });

        const selectorUrlObj = new URL(newSiteUrl.value);
        selectorUrlObj.searchParams.set('bmh-selector-mode', 'true');
        selectorUrlObj.searchParams.set('bmh-site-id', site.id);
        
        const tab = await chrome.tabs.create({ url: selectorUrlObj.toString() });

        if (tab.id) {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.runtime.sendMessage({
                        type: 'inject-selector-tool',
                        tabId: tab.id
                    });
                }
            });
        }

        newSiteUrl.value = '';
        newSiteName.value = '';

    } catch (err) {
        console.error('[AddSiteForm] Failed to add site:', err);
        alert('Failed to add site. Check console for details.');
    }
}
</script>

<style scoped lang="scss">
.add-site-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
        }

        .form-hint {
            font-size: 12px;
            color: var(--text-muted);
        }
    }
}

.input-field {
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--bg-body);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.2s;

    &:focus {
        outline: none;
        border-color: var(--accent-primary);
    }
}
</style>
