<template>
    <div id="tab-custom-sites" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'custom-sites' }">
        <header class="header">
            <div class="header-text">
                <h1>Custom Sites</h1>
                <p class="subtitle">Add support for any manga reading site by selecting DOM elements.</p>
            </div>
        </header>

        <div class="content-grid">
            <AddSiteForm />

            <SettingsCard 
                title="Your Custom Sites" 
                icon="📋"
                icon-bg="rgba(117, 81, 255, 0.15)"
                icon-color="var(--accent-primary)"
                guide-target="guide-custom-list"
                full-height
            >
                <div v-if="customSitesStore.isLoading" class="loading-state">
                    <span class="spinner"></span> Loading...
                </div>
                <div v-else-if="customSitesStore.sites.length === 0" class="empty-state">
                    <span class="empty-icon">🌐</span>
                    <p>No custom sites yet.</p>
                    <p class="empty-hint">Add your first site using the form above!</p>
                </div>
                <div v-else class="sites-list">
                    <CustomSiteItem 
                        v-for="site in customSitesStore.sites" 
                        :key="site.id"
                        :site="site"
                        @open="openSite"
                        @edit="editSite"
                        @edit-reader="editReaderPage"
                    />
                </div>
            </SettingsCard>

            <SettingsCard 
                title="Share Configurations" 
                icon="📤"
                icon-bg="rgba(251, 191, 36, 0.15)"
                icon-color="#FBBF24"
                guide-target="guide-custom-share"
                class="full-width-card"
            >
                <div class="share-actions">
                    <div class="share-action">
                        <h4>Export Your Sites</h4>
                        <p>Share your site configurations with others.</p>
                        <button class="btn btn-secondary" @click="exportConfigs">
                            📥 Export JSON
                        </button>
                    </div>
                    <div class="share-action">
                        <h4>Import Sites</h4>
                        <p>Add site configurations shared by others.</p>
                        <input 
                            type="file" 
                            ref="importFileInput"
                            accept=".json"
                            @change="handleImport"
                            style="display: none"
                        />
                        <button class="btn btn-secondary" @click="triggerImport">
                            📤 Import JSON
                        </button>
                    </div>
                </div>
            </SettingsCard>
        </div>

        <SiteDetailModal 
            v-if="selectedSite" 
            :site="selectedSite" 
            @close="selectedSite = null" 
            @edit="editSite"
        />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SettingsCard from '../../common/SettingsCard.vue';
import AddSiteForm from './AddSiteForm.vue';
import CustomSiteItem from './CustomSiteItem.vue';
import SiteDetailModal from './SiteDetailModal.vue';
import { useCustomSitesStore } from '../../../scripts/store/custom-sites.store.js';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const customSitesStore = useCustomSitesStore();
const settingsStore = useSettingsStore();
const importFileInput = ref(null);
const selectedSite = ref(null);

function openSite(site) {
    selectedSite.value = site;
}

function injectSelectorToolOnLoad(tabId) {
    if (!tabId) return;
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (updatedTabId === tabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.runtime.sendMessage({
                type: 'inject-selector-tool',
                tabId: tabId
            });
        }
    });
}

async function editSite(site) {
    const baseUrl = site.url || `https://${site.hostname}`;
    const exampleUrl = prompt(
        'Enter the URL of the page you want to pick manga cards from (homepage, latest releases, etc).\n\n' +
        'Original site link will not be updated.',
        baseUrl
    );

    if (!exampleUrl) return;

    try {
        const urlObj = new URL(exampleUrl);
        
        // Warn if domain differs
        const host = urlObj.hostname.replace('www.', '');
        const targetHost = site.hostname.replace('www.', '');
        if (!host.includes(targetHost) && !targetHost.includes(host)) {
            if (!confirm(`The URL host "${urlObj.hostname}" looks different from "${site.hostname}". Proceed anyway?`)) {
                return;
            }
        }

        urlObj.searchParams.set('bmh-selector-mode', 'true');
        urlObj.searchParams.set('bmh-site-id', site.id);
        const tab = await chrome.tabs.create({ url: urlObj.toString() });
        injectSelectorToolOnLoad(tab.id);
    } catch {
        alert('Invalid URL. Please enter a valid URL starting with http:// or https://');
    }
}

async function editReaderPage(site) {
    const exampleUrl = prompt(
        'Paste an example reader/chapter page URL from this site.\n' +
        'The selector tool needs to be on an actual chapter page to pick the right elements.\n\n' +
        `Example: https://${site.hostname}/manga-name/chapter-1`
    );

    if (!exampleUrl) return;

    try {
        const parsed = new URL(exampleUrl);
        if (!parsed.hostname.includes(site.hostname)) {
            alert(`That URL doesn't belong to ${site.hostname}. Please use a URL from the same site.`);
            return;
        }
    } catch {
        alert('Invalid URL. Please paste a valid chapter page URL.');
        return;
    }

    const url = new URL(exampleUrl);
    url.searchParams.set('bmh-reader-selector-mode', 'true');
    url.searchParams.set('bmh-site-id', site.id);

    const tab = await chrome.tabs.create({ url: url.toString() });
    injectSelectorToolOnLoad(tab.id);
}

function exportConfigs() {
    const json = customSitesStore.exportSites();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-manga-sites.json';
    a.click();
    URL.revokeObjectURL(url);
}

function triggerImport() {
    importFileInput.value?.click();
}

async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const text = await file.text();
        const count = await customSitesStore.importSites(text);
        alert(`Successfully imported ${count} site(s).`);
    } catch (err) {
        alert('Failed to import: ' + err.message);
    }
    event.target.value = '';
}

onMounted(async () => {
    await customSitesStore.loadSites();
});
</script>

<style scoped lang="scss">
.sites-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.share-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    .share-action {
        padding: 20px;
        background: var(--bg-body);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);

        h4 {
            margin: 0 0 8px 0;
            font-size: 15px;
            color: var(--text-primary);
        }

        p {
            margin: 0 0 16px 0;
            font-size: 13px;
            color: var(--text-secondary);
        }
    }
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);

    .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .empty-hint {
        font-size: 13px;
        color: var(--text-muted);
    }
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px;
    color: var(--text-secondary);
}

.full-width-card {
    grid-column: 1 / -1;
}

.spinner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
