<template>
    <div id="tab-custom-sites" class="tab-pane fade-in" style="display: none;">
        <header class="header">
            <div class="header-text">
                <h1>Custom Sites</h1>
                <p class="subtitle">Add support for any manga reading site by selecting DOM elements.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Card 1: Add New Site -->
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

            <!-- Card 2: Your Custom Sites -->
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
                    <div 
                        v-for="site in customSitesStore.sites" 
                        :key="site.id"
                        class="site-item"
                        :class="{ disabled: !site.enabled }"
                    >
                        <div class="site-info" @click="openSite(site)">
                            <div class="site-header">
                                <span class="site-name">{{ site.name }}</span>
                                <span class="site-status" :class="getSelectorStatus(site)">
                                    {{ getSelectorStatusText(site) }}
                                </span>
                            </div>
                            <span class="site-hostname">{{ site.url || site.hostname }}</span>
                        </div>
                        <div class="site-actions">
                            <button 
                                class="btn btn-icon" 
                                @click="editSite(site)"
                                title="Edit Selectors"
                            >✏️</button>
                            <button 
                                class="btn btn-icon btn-reader" 
                                @click="editReaderPage(site)"
                                title="Edit Reading Page"
                            >📖</button>
                            <button 
                                class="btn btn-icon" 
                                @click="toggleSite(site.id)"
                                :title="site.enabled ? 'Disable' : 'Enable'"
                            >{{ site.enabled ? '🟢' : '⚫' }}</button>
                            <button 
                                class="btn btn-icon btn-danger" 
                                @click="deleteSite(site.id)"
                                title="Delete"
                            >🗑️</button>
                        </div>
                    </div>
                </div>
            </SettingsCard>

            <!-- Card 3: Import/Export Configs (Full Width) -->
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

        <!-- Site Detail Modal -->
        <div v-if="selectedSite" class="modal-overlay" @click.self="selectedSite = null">
            <div class="modal-panel">
                <div class="modal-header">
                    <h2>{{ selectedSite.name }}</h2>
                    <button class="close-btn" @click="selectedSite = null">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="section">
                        <h3>📍 Selectors</h3>
                        <div class="selector-groups">
                            <div v-for="(group, idx) in normalizedSelectors(selectedSite.selectors)" :key="idx" class="selector-group">
                                <h4 v-if="Array.isArray(selectedSite.selectors) && selectedSite.selectors.length > 1">Variant {{ idx + 1 }}</h4>
                                <div class="selector-grid">
                                    <div class="selector-item">
                                        <label>Card</label>
                                        <code>{{ group.card || '(not set)' }}</code>
                                    </div>
                                    <div class="selector-item">
                                        <label>Title</label>
                                        <code>{{ group.title || '(not set)' }}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h3>📖 Reader Selectors</h3>
                        <p class="section-hint">Used to detect reader pages and extract progress (title + chapter).</p>
                        <div class="selector-grid selector-grid-3">
                            <div class="selector-item">
                                <label>Detect Page</label>
                                <code>{{ selectedSite.readerSelectors?.readerDetect || '(not set)' }}</code>
                            </div>
                            <div class="selector-item">
                                <label>Reader Title</label>
                                <code>{{ selectedSite.readerSelectors?.readerTitle || '(not set)' }}</code>
                            </div>
                            <div class="selector-item">
                                <label>Chapter</label>
                                <code>{{ selectedSite.readerSelectors?.readerChapter || '(not set)' }}</code>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h3>⚡ Custom JavaScript <span class="badge-advanced">Advanced</span></h3>
                        <p class="section-hint">Optional: Custom extraction logic. Function receives card element, must return { id, title, url }.</p>
                        <textarea 
                            v-model="customJsCode"
                            class="code-editor"
                            placeholder="// Example:
function extract(cardEl) {
  return {
    id: cardEl.dataset.mangaId,
    title: cardEl.querySelector('.title')?.textContent,
    url: cardEl.querySelector('a')?.href
  };
}"
                            rows="8"
                        ></textarea>
                        <button class="btn btn-secondary btn-sm" @click="saveCustomJs">
                            💾 Save Custom JS
                        </button>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-primary" @click="editSite(selectedSite)">
                        ✏️ Re-select Elements
                    </button>
                    <button class="btn btn-secondary" @click="selectedSite = null">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
/**
 * @fileoverview Custom Sites management tab.
 * Allows users to add support for any manga reading site via DOM element selection.
 */
import { ref, computed, onMounted } from 'vue';
import SettingsCard from '../common/SettingsCard.vue';
import { useCustomSitesStore } from '../../scripts/store/custom-sites.store.js';

const customSitesStore = useCustomSitesStore();

// Form state
const newSiteUrl = ref('');
const newSiteName = ref('');
const importFileInput = ref(null);

// Modal state
const selectedSite = ref(null);
const customJsCode = ref('');

/**
 * Opens the site detail modal.
 * @param {Object} site - Site config to display
 */
function openSite(site) {
    selectedSite.value = site;
    customJsCode.value = site.customFunction || '';
}

/**
 * Saves the custom JS code to the site config.
 */
async function saveCustomJs() {
    if (!selectedSite.value) return;
    await customSitesStore.updateSite(selectedSite.value.id, {
        customFunction: customJsCode.value
    });
    alert('Custom JS saved!');
}

/** Validate URL format */
const isValidUrl = computed(() => {
    try {
        const url = new URL(newSiteUrl.value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
});

/**
 * Initiates the site addition flow:
 * 1. Request host permission
 * 2. Create pending site config
 * 3. Open site with selector mode enabled
 */
async function startAddSite() {
    if (!isValidUrl.value) return;

    try {
        const url = new URL(newSiteUrl.value);
        const hostname = url.hostname;
        const origin = url.origin + '/*';

        // Request permission for this host
        const granted = await chrome.permissions.request({
            origins: [origin]
        });

        if (!granted) {
            alert('Permission denied. The extension needs access to this site to work.');
            return;
        }

        // Create the site config (selectors will be set in selector mode)
        const site = await customSitesStore.addSite({
            hostname: hostname,
            url: newSiteUrl.value,
            name: newSiteName.value || hostname,
            selectors: [{
                card: '',
                title: ''
            }]
        });

        // Open the site exactly where the user pointed it
        const selectorUrlObj = new URL(newSiteUrl.value);
        selectorUrlObj.searchParams.set('bmh-selector-mode', 'true');
        selectorUrlObj.searchParams.set('bmh-site-id', site.id);
        const selectorUrl = selectorUrlObj.toString();
        
        const tab = await chrome.tabs.create({ url: selectorUrl });

        // Inject the content script via background (since this host isn't in manifest yet)
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

        // Reset form
        newSiteUrl.value = '';
        newSiteName.value = '';

    } catch (err) {
        console.error('[CustomSitesTab] Failed to add site:', err);
        alert('Failed to add site. Check console for details.');
    }
}

/**
 * Get selector configuration status for a site.
 * @param {Object} site - Site config
 * @returns {'complete'|'incomplete'|'empty'}
 */
function getSelectorStatus(site) {
    if (!site.selectors) return 'empty';
    
    // Handle array format (new) vs object format (legacy)
    const selectors = Array.isArray(site.selectors) ? site.selectors : [site.selectors];
    
    if (selectors.length === 0) return 'empty';
    
    // Check if at least one group has a card
    const hasCard = selectors.some(s => s.card);
    if (!hasCard) return 'empty';
    
    // Check if all groups with cards have titles (or at least one valid group?)
    // Let's say: if any group has Card but no Title, it's incomplete.
    const invalidGroup = selectors.find(s => s.card && !s.title);
    if (invalidGroup) return 'incomplete';
    
    return 'complete';
}

function normalizedSelectors(selectors) {
    if (!selectors) return [];
    return Array.isArray(selectors) ? selectors : [selectors];
}

function getSelectorStatusText(site) {
    const status = getSelectorStatus(site);
    switch (status) {
        case 'complete': return '✓ Ready';
        case 'incomplete': return '⚠ Incomplete';
        case 'empty': return '✗ Not configured';
    }
}

async function editSite(site) {
    // Open site exactly where the user originally pointed it to edit listing page selectors
    const baseUrl = site.url || `https://${site.hostname}`;
    const urlObj = new URL(baseUrl);
    urlObj.searchParams.set('bmh-selector-mode', 'true');
    urlObj.searchParams.set('bmh-site-id', site.id);
    const selectorUrl = urlObj.toString();
    const tab = await chrome.tabs.create({ url: selectorUrl });

    injectSelectorToolOnLoad(tab.id);
}

/**
 * Prompts for an example reader page URL, then opens it with the reader-mode selector tool.
 * The user must provide an actual chapter/reader URL so the selector tool has the right DOM to work with.
 * @param {Object} site - Site config to edit reader selectors for
 */
async function editReaderPage(site) {
    const exampleUrl = prompt(
        'Paste an example reader/chapter page URL from this site.\n' +
        'The selector tool needs to be on an actual chapter page to pick the right elements.\n\n' +
        `Example: https://${site.hostname}/manga-name/chapter-1`
    );

    if (!exampleUrl) return;

    // Validate the URL belongs to the same site
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

    // Append reader selector params to the user-provided URL
    const url = new URL(exampleUrl);
    url.searchParams.set('bmh-reader-selector-mode', 'true');
    url.searchParams.set('bmh-site-id', site.id);

    const tab = await chrome.tabs.create({ url: url.toString() });
    injectSelectorToolOnLoad(tab.id);
}

/**
 * Injects the selector tool content script once the tab finishes loading.
 * @param {number} tabId - Chrome tab ID to inject into
 */
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

async function toggleSite(id) {
    await customSitesStore.toggleSite(id);
}

async function deleteSite(id) {
    if (!confirm('Are you sure you want to delete this site configuration?')) return;
    await customSitesStore.removeSite(id);
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

    // Reset input
    event.target.value = '';
}

onMounted(async () => {
    await customSitesStore.loadSites();
});
</script>

<style scoped lang="scss">
/* Add Site Form */
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

/* Sites List */
.sites-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

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
}

/* Share Section */
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

/* States */
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

/* Full Width Card */
.full-width-card {
    grid-column: 1 / -1;
}

/* Spinner */
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

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-panel {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg, 16px);
        width: 90%;
        max-width: 560px;
        max-height: 80vh;
        overflow-y: auto;

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);

            h2 {
                margin: 0;
                font-size: 18px;
                color: var(--text-primary);
            }

            .close-btn {
                background: transparent;
                border: none;
                color: var(--text-secondary);
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.2s;

                &:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
            }
        }

        .modal-body {
            padding: 24px;

            .section {
                margin-bottom: 24px;

                h3 {
                    font-size: 14px;
                    margin: 0 0 12px 0;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .section-hint {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin: 0 0 12px 0;
                }

                .badge-advanced {
                    font-size: 10px;
                    padding: 2px 6px;
                    background: rgba(251, 191, 36, 0.2);
                    color: #FBBF24;
                    border-radius: 4px;
                    font-weight: 500;
                }

                .selector-groups {
                    .selector-group {
                        margin-bottom: 16px;
                        padding-bottom: 16px;
                        border-bottom: 1px dashed var(--border-color);

                        &:last-child {
                            border-bottom: none;
                            margin-bottom: 0;
                            padding-bottom: 0;
                        }

                        h4 {
                            font-size: 11px;
                            margin: 0 0 8px 0;
                            color: var(--text-muted);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                    }
                }

                .selector-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;

                    &.selector-grid-3 {
                        grid-template-columns: 1fr 1fr 1fr;
                    }

                    .selector-item {
                        background: var(--bg-body);
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-sm);
                        padding: 10px 12px;

                        label {
                            display: block;
                            font-size: 11px;
                            font-weight: 600;
                            color: var(--text-secondary);
                            margin-bottom: 4px;
                        }

                        code {
                            font-size: 11px;
                            color: #6AD2FF;
                            word-break: break-all;
                        }
                    }
                }
            }

            .code-editor {
                width: 100%;
                padding: 12px;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 12px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                color: #a5d6ff;
                resize: vertical;
                line-height: 1.5;

                &:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                }
            }

            .btn-sm {
                padding: 8px 12px;
                font-size: 12px;
                margin-top: 12px;
            }
        }

        .modal-footer {
            display: flex;
            gap: 12px;
            padding: 16px 24px;
            border-top: 1px solid var(--border-color);
            justify-content: flex-end;
        }
    }
}
</style>
