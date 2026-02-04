<template>
    <div id="tab-import-export" class="tab-pane fade-in" style="display: none;">
        <header class="header">
            <div class="header-text">
                <h1>Import & Export</h1>
                <p class="subtitle">Manage your manga bookmarks and reading history. Keep
                    your
                    data safe
                    or
                    transfer it to another machine.</p>
            </div>
        </header>

        <div class="content-grid export-import-grid">
            <!-- Export Card -->
            <div class="card secondary-bg-card">
                <div class="card-header">
                    <div class="card-icon blue-icon">
                        <svg class="icon-svg icon-export" style="width: 20px; height: 20px;"></svg>
                    </div>
                    <div class="card-title-group">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>Export Data</h3>
                            <button class="info-redirect-btn" data-target="guide-backup"
                                title="About Backup & Restore">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                        <p class="description compact">Generate a backup of your library and settings.</p>
                    </div>
                </div>

                <!-- Export Options -->
                <div class="export-options">
                    <p class="section-label">Include in export:</p>
                    <div class="export-checkboxes">
                        <label class="export-option">
                            <input type="checkbox" id="exportLibrary" checked>
                            <span>📚 Library Entries</span>
                            <span class="export-count" id="exportLibraryCount">(0)</span>
                        </label>
                        <label class="export-option">
                            <input type="checkbox" id="exportHistory" checked>
                            <span>📖 Reading History</span>
                            <span class="export-count" id="exportHistoryCount">(0)</span>
                        </label>
                        <label class="export-option">
                            <input type="checkbox" id="exportSettings" checked>
                            <span>⚙️ Settings</span>
                        </label>
                        <label class="export-option">
                            <input type="checkbox" id="exportPersonalData" checked>
                            <span>🏷️ Tags, Notes & Ratings</span>
                            <span class="export-count" id="exportPersonalCount">(0)</span>
                        </label>
                        <label class="export-option">
                            <input type="checkbox" id="exportCache">
                            <span>💾 AniList Cache</span>
                            <span class="export-count" id="exportCacheCount">(0 KB)</span>
                        </label>
                    </div>
                </div>

                <div class="inner-info-card">
                    <div class="format-info">
                        <span class="label-info">Format: <span class="highlight-text">JSON</span></span>
                    </div>
                    <button id="exportDataBtn" class="btn btn-primary btn-with-icon">
                        <svg class="icon-svg icon-export" style="width: 16px; height: 16px;"></svg>
                        Export Selected
                    </button>
                </div>

                <div class="card-footer-info">
                    <span class="status-icon">ℹ️</span>
                    <span class="status-text-muted">Last backup: <span
                            id="lastBackupDisplay">Never</span></span>
                </div>
            </div>

            <!-- Import Card -->
            <div class="card secondary-bg-card">
                <div class="card-header">
                    <div class="card-icon purple-icon">
                        <svg class="icon-svg icon-import" style="width: 20px; height: 20px;"></svg>
                    </div>
                    <div class="card-title-group">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>Import Data</h3>
                            <button class="info-redirect-btn" data-target="guide-backup"
                                title="About Backup & Restore">
                                <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                            </button>
                        </div>
                        <p class="description compact">Restore your data from a previously
                            exported
                            file.
                        </p>
                    </div>
                </div>

                <div class="drop-zone-container" id="dropZone">
                    <input type="file" id="importDataInput" accept=".json,.xml" style="display: none;">
                    <div class="drop-zone-content">
                        <div class="drop-zone-icon">
                            <svg class="icon-svg icon-file" style="width: 24px; height: 24px;"></svg>
                        </div>
                        <span class="drop-zone-text">Click to upload or drag and drop</span>
                        <span class="drop-zone-subtext">Supports .json or .xml files (max
                            10MB)</span>
                    </div>
                </div>

                <div class="import-actions-row">
                    <div class="feature-toggle-wrapper">
                        <div class="toggle-label-group">
                            <span class="toggle-main-label">Merge with current data</span>
                        </div>
                        <ToggleSwitch 
                            id="mergeImportToggle" 
                        />
                    </div>
                    <button id="startImportBtn" class="btn btn-primary btn-with-icon">
                        <svg class="icon-svg icon-plus" style="width: 16px; height: 16px;"></svg>
                        Start Import
                    </button>
                </div>

                <div class="caution-banner">
                    <div class="caution-icon">⚠️</div>
                    <div class="caution-text">
                        <strong>Caution:</strong> If "Merge with current data" is disabled,
                        all
                        existing
                        bookmarks will be overwritten by the imported file. This action
                        cannot
                        be
                        undone.
                    </div>
                </div>
            </div>

            <!-- MangaDex MDList Import Card -->
            <div class="card secondary-bg-card" style="grid-column: 1 / -1;">
                <div class="card-header">
                    <div class="card-icon" style="background: rgba(255, 103, 64, 0.1);">
                        <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="#FF6740"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <div class="card-title-group">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>Import from MangaDex List</h3>
                            <button class="info-redirect-btn" data-target="guide-mangadex-import"
                                title="About MangaDex Import">
                                <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                            </button>
                        </div>
                        <p class="description compact">Import manga from a public MangaDex reading list
                            (MDList).</p>
                    </div>
                </div>

                <!-- Info Guide Card -->


                <div class="inner-info-card" style="flex-direction: column; gap: 12px;">
                    <div class="format-info" style="width: 100%;">
                        <span class="label-info">Paste MDList URL or ID:</span>
                        <p class="sub-description">Example: https://mangadex.org/list/abc123... or just the UUID
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; width: 100%; align-items: center;">
                        <input type="text" id="mdlistInput" placeholder="https://mangadex.org/list/..."
                            class="input-field" style="flex: 1;">
                        <button id="mdlistImportBtn" class="btn btn-primary btn-with-icon">
                            <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Import
                        </button>
                    </div>
                </div>

                <div class="card-footer-info">
                    <span class="status-icon">📋</span>
                    <span class="status-text-muted">Imported manga will be added with "Plan to Read"
                        status</span>
                </div>
            </div>


        </div>
    </div>
</template>

<script setup>
import ToggleSwitch from '../common/ToggleSwitch.vue';

</script>

<style scoped>
/* Import & Export Tab Styles - migrated from _import-export.css */
.export-import-grid {
    width: 100%;
}

.secondary-bg-card {
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-title-group {
    display: flex;
    flex-direction: column;
}

.description.compact {
    margin-bottom: 0;
    margin-top: 4px;
    font-size: 13px;
}

.blue-icon {
    background-color: rgba(67, 24, 255, 0.1);
    color: var(--accent-primary);
}

.purple-icon {
    background-color: rgba(107, 70, 193, 0.1);
    color: #6B46C1;
}

.inner-info-card {
    background-color: rgba(255, 255, 255, 0.02);
    border: 1px dashed var(--border-color, #2B3674);
    border-radius: var(--radius-md, 8px);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.format-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.label-info {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
}

.highlight-text {
    color: #4318FF;
    font-weight: 700;
}

.sub-description {
    font-size: 11px;
    color: var(--text-secondary);
    font-style: italic;
}

.btn-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.card-footer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.status-text-muted {
    color: var(--text-secondary);
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
}

.drop-zone-container:hover,
.drop-zone-container.drag-over {
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
}

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

.import-actions-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.caution-banner {
    background-color: rgba(255, 181, 71, 0.05);
    border: 1px solid rgba(255, 181, 71, 0.2);
    border-radius: var(--radius-sm, 6px);
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.caution-icon {
    font-size: 20px;
}

.caution-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
}

.caution-text strong {
    color: var(--warning, #FFB547);
}

/* Export Options */
.export-options {
    margin-bottom: 20px;
}

.export-options .section-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.export-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm, 6px);
    cursor: pointer;
    transition: all 0.15s ease;
}

.export-option:hover {
    background: rgba(67, 24, 255, 0.05);
    border-color: rgba(67, 24, 255, 0.2);
}

.export-option input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent-primary);
    cursor: pointer;
}

.export-option span:first-of-type {
    flex: 1;
    font-size: 13px;
    color: var(--text-primary);
}

.export-count {
    font-size: 11px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 10px;
}

/* Import Preview */
.import-preview-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.import-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.import-stat {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm, 6px);
    padding: 16px;
    text-align: center;
}

.import-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--accent-primary);
}

.import-stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 4px;
}
</style>
