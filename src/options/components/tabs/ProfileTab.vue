<template>
    <div id="tab-profile" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'profile' }">
        <header class="header">
            <div class="header-text">
                <h1>Profile & Sync</h1>
                <p class="subtitle">Sync your manga library across devices with Google Drive. No server required.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Card 1: Google Account Status -->
            <SettingsCard 
                title="Google Account" 
                icon="👤"
                icon-bg="rgba(66, 133, 244, 0.15)"
                icon-color="#4285F4"
                guide-target="guide-profile-account"
                full-height
            >
                <!-- Signed In State -->
                <div v-if="isSignedIn" class="account-section">
                    <div class="account-info">
                        <div class="avatar-wrapper">
                            <img :src="userAvatar || defaultAvatar" class="user-avatar" alt="Profile" />
                            <div class="status-dot online"></div>
                        </div>
                        <div class="account-details">
                            <span class="user-email">{{ userEmail || 'user@gmail.com' }}</span>
                            <span class="sync-status-text">
                                <span class="status-icon">✓</span>
                                Last sync: {{ lastSyncFormatted }}
                            </span>
                        </div>
                    </div>
                    <button class="btn btn-ghost btn-sm" @click="handleSignOut">
                        Sign Out
                    </button>
                </div>

                <!-- Signed Out State -->
                <div v-else class="sign-in-section">
                    <div class="sign-in-info">
                        <p class="info-text">Connect your Google account to sync your library across devices.</p>
                        <ul class="benefit-list">
                            <li>📱 Access on Android app</li>
                            <li>💾 Automatic cloud backup</li>
                            <li>🔒 Data stored in your Drive</li>
                        </ul>
                    </div>
                    <button class="btn btn-google" @click="handleSignIn">
                        <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                    </button>
                </div>
            </SettingsCard>

            <!-- Card 2: Sync Configuration -->
            <SettingsCard 
                title="Sync Settings" 
                icon="⚙️"
                icon-bg="rgba(117, 81, 255, 0.15)"
                icon-color="var(--accent-primary)"
                guide-target="guide-profile-sync"
                full-height
            >
                <div class="sync-settings" :class="{ disabled: !isSignedIn }">
                    <div class="auto-sync-row">
                        <SwitchControl 
                            id="AutoSyncStartup"
                            label="Auto-sync on startup" 
                            sub-label="Sync when extension loads"
                            v-model="autoSyncEnabled"
                            :disabled="!isSignedIn"
                        />
                    </div>
                    
                    <!-- Auto-sync interval -->
                    <div v-if="autoSyncEnabled" class="sync-interval-section">
                        <div class="interval-input-group">
                            <label for="syncIntervalDays">Sync every</label>
                            <input 
                                type="number" 
                                id="syncIntervalDays" 
                                v-model.number="syncIntervalDays" 
                                class="interval-input"
                                min="1"
                                max="30"
                                :disabled="!isSignedIn"
                            />
                            <span class="interval-suffix">days</span>
                        </div>
                        <div class="interval-buttons">
                            <button 
                                class="btn btn-sm btn-primary" 
                                @click="saveSyncInterval"
                                :disabled="!isSignedIn"
                            >
                                Save
                            </button>
                            <button 
                                class="btn btn-sm btn-ghost" 
                                @click="resetSyncInterval"
                                :disabled="!isSignedIn"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                    
                    <div class="divider-line"></div>
                    
                    <p class="section-label">Data to sync:</p>
                    <div class="sync-checkboxes">
                        <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                            <input type="checkbox" v-model="syncLibrary" :disabled="!isSignedIn" />
                            <span class="checkbox-label">📚 Library Entries</span>
                        </label>
                        <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                            <input type="checkbox" v-model="syncHistory" :disabled="!isSignedIn" />
                            <span class="checkbox-label">📖 Reading History</span>
                        </label>
                        <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                            <input type="checkbox" v-model="syncPersonal" :disabled="!isSignedIn" />
                            <span class="checkbox-label">🏷️ Tags, Notes & Ratings</span>
                        </label>
                        <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                            <input type="checkbox" v-model="syncSettings" :disabled="!isSignedIn" />
                            <span class="checkbox-label">⚙️ Settings</span>
                        </label>
                        <label class="checkbox-option" :class="{ disabled: !isSignedIn }">
                            <input type="checkbox" v-model="syncCache" :disabled="!isSignedIn" />
                            <span class="checkbox-label">💾 API Cache</span>
                        </label>
                    </div>
                </div>
            </SettingsCard>

            <!-- Card 3: Cloud Sync Actions -->
            <SettingsCard 
                title="Cloud Sync" 
                icon="☁️"
                icon-bg="rgba(16, 185, 129, 0.15)"
                icon-color="#10b981"
                guide-target="guide-profile-cloud"
                class="sync-actions-card"
            >
                <div :class="{ disabled: !isSignedIn }">
                    <div class="sync-actions-grid">
                        <!-- Upload Action -->
                        <div class="action-card upload-card">
                            <div class="action-icon-wrapper upload-icon">
                                <span>⬆️</span>
                            </div>
                            <div class="action-content">
                                <h4>Backup to Cloud</h4>
                                <p>Upload current library to Google Drive</p>
                            </div>
                            <button 
                                class="btn btn-primary" 
                                @click="performUpload"
                                :disabled="!isSignedIn || syncStatus === 'syncing'"
                            >
                                <span v-if="syncStatus === 'syncing' && syncDirection === 'upload'" class="spinner"></span>
                                {{ syncStatus === 'syncing' && syncDirection === 'upload' ? 'Uploading...' : 'Backup Now' }}
                            </button>
                        </div>

                        <!-- Download Action -->
                        <div class="action-card download-card">
                            <div class="action-icon-wrapper download-icon">
                                <span>⬇️</span>
                            </div>
                            <div class="action-content">
                                <h4>Restore from Cloud</h4>
                                <p>Download and merge with local data</p>
                            </div>
                            <button 
                                class="btn btn-secondary" 
                                @click="performDownload"
                                :disabled="!isSignedIn || syncStatus === 'syncing'"
                            >
                                <span v-if="syncStatus === 'syncing' && syncDirection === 'download'" class="spinner"></span>
                                {{ syncStatus === 'syncing' && syncDirection === 'download' ? 'Restoring...' : 'Restore' }}
                            </button>
                        </div>

                        <!-- Cloud Status -->
                        <div class="action-card status-card">
                            <div class="action-icon-wrapper status-icon">
                                <span>📊</span>
                            </div>
                            <div class="action-content">
                                <h4>Cloud Status</h4>
                                <p v-if="cloudBackupInfo" class="cloud-stats">
                                    {{ cloudBackupInfo.entryCount }} entries • {{ cloudBackupInfo.size }}
                                    <br />
                                    <span class="last-modified">Modified: {{ cloudBackupInfo.lastModified }}</span>
                                </p>
                                <p v-else class="no-backup">No backup found in cloud</p>
                            </div>
                            <button 
                                class="btn btn-ghost btn-sm" 
                                @click="refreshCloudStatus"
                                :disabled="!isSignedIn"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div v-if="syncStatus === 'syncing'" class="sync-progress-section">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" :style="{ width: syncProgress + '%' }"></div>
                        </div>
                        <span class="progress-text">{{ syncStatusMessage }}</span>
                    </div>

                    <!-- Last Sync Result -->
                    <div v-if="lastSyncResult" :class="['sync-result-banner', lastSyncResult.type]">
                        <span class="result-icon">{{ lastSyncResult.type === 'success' ? '✅' : '❌' }}</span>
                        <span class="result-message">{{ lastSyncResult.message }}</span>
                        <button class="dismiss-btn" @click="dismissResult">×</button>
                    </div>
                </div>
            </SettingsCard>

            <!-- Local Backup: Export -->
            <SettingsCard 
                title="Local Backup (Export)" 
                icon="💾"
                icon-bg="rgba(67, 24, 255, 0.15)"
                icon-color="var(--accent-primary)"
                guide-target="guide-profile-export"
            >
                <div class="export-options">
                    <p class="section-label">Include in export:</p>
                    <div class="export-checkboxes">
                        <label class="export-option checkbox-option">
                            <input type="checkbox" id="exportLibrary" checked>
                            <span class="checkbox-label">📚 Library Entries</span>
                        </label>
                        <label class="export-option checkbox-option">
                            <input type="checkbox" id="exportHistory" checked>
                            <span class="checkbox-label">📖 Reading History</span>
                        </label>
                        <label class="export-option checkbox-option">
                            <input type="checkbox" id="exportPersonalData" checked>
                            <span class="checkbox-label">🏷️ Tags, Notes & Ratings</span>
                        </label>
                        <label class="export-option checkbox-option">
                            <input type="checkbox" id="exportSettings" checked>
                            <span class="checkbox-label">⚙️ Settings</span>
                        </label>
                        <label class="export-option checkbox-option">
                            <input type="checkbox" id="exportCache">
                            <span class="checkbox-label">💾 API Cache</span>
                        </label>
                    </div>
                </div>

                <div class="inner-info-card">
                    <div class="format-info">
                        <span class="label-info">Format: <span class="highlight-text">JSON</span></span>
                    </div>
                    <button id="exportDataBtn" class="btn btn-primary btn-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export Selected
                    </button>
                </div>

                <div class="card-footer-info" style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                    <span>ℹ️ Last local backup: <span id="lastBackupDisplay">Never</span></span>
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
                <div class="drop-zone-container" id="dropZone">
                    <input type="file" id="importDataInput" accept=".json,.xml" style="display: none;">
                    <div class="drop-zone-content">
                        <div class="drop-zone-icon" style="font-size: 24px;">📄</div>
                        <span class="drop-zone-text">Click to upload or drag and drop</span>
                        <span class="drop-zone-subtext">Supports .json or .xml files (max 10MB)</span>
                    </div>
                </div>

                <div class="import-actions-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div class="feature-toggle-wrapper">
                        <span class="toggle-main-label" style="font-size: 13px;">Merge with current data</span>
                        <ToggleSwitch id="mergeImportToggle" />
                    </div>
                    <button id="startImportBtn" class="btn btn-primary btn-with-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Start Import
                    </button>
                </div>

                <div class="caution-banner">
                    <div class="caution-icon">⚠️</div>
                    <div class="caution-text">
                        <strong>Caution:</strong> If "Merge with current data" is disabled, all existing data will be overwritten by the imported file. This action cannot be undone.
                    </div>
                </div>
            </SettingsCard>

            <!-- MangaDex MDList Import -->
            <SettingsCard 
                title="Import from MangaDex List" 
                icon="📊"
                icon-bg="rgba(255, 103, 64, 0.15)"
                icon-color="#FF6740"
                guide-target="guide-mangadex-import"
                class="sync-actions-card"
            >
                <div class="inner-info-card" style="flex-direction: column; gap: 12px; width: 100%;">
                    <div class="format-info" style="width: 100%;">
                        <span class="label-info">Paste MDList URL or ID:</span>
                        <p class="sub-description">Example: https://mangadex.org/list/abc123... or just the UUID</p>
                    </div>
                    <div style="display: flex; gap: 10px; width: 100%; align-items: center;">
                        <input type="text" id="mdlistInput" placeholder="https://mangadex.org/list/..." class="input-field" style="flex: 1;">
                        <button id="mdlistImportBtn" class="btn btn-primary btn-with-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Import
                        </button>
                    </div>
                </div>
                <div class="card-footer-info" style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                    <span>📋 Imported manga will be added with "Plan to Read" status</span>
                </div>
            </SettingsCard>

            <!-- Setup Required Banner -->
            <div v-if="!isOAuthConfigured" class="setup-banner">
                <div class="banner-icon">🔧</div>
                <div class="banner-content">
                    <h4>Setup Required</h4>
                    <p>Google Drive sync requires OAuth configuration. See the implementation plan for setup instructions.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
/**
 * @fileoverview Profile & Sync tab component for Google Drive sync.
 * Provides UI for authentication, sync configuration, and cloud backup management.
 */
import { ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import SettingsCard from '../common/SettingsCard.vue';
import SwitchControl from '../common/SwitchControl.vue';
import { useProfileStore } from '../../scripts/store/profile.store.js';
import { useSettingsStore } from '../../scripts/store/settings.store.js';

const profileStore = useProfileStore();
const settingsStore = useSettingsStore();

// Extract reactive refs from store
const {
    isSignedIn,
    userEmail,
    userAvatar,
    syncStatus,
    syncProgress,
    syncStatusMessage,
    lastSyncResult,
    autoSyncEnabled,
    syncLibrary,
    syncHistory,
    syncPersonal,
    syncSettings,
    syncCache,
    cloudBackupInfo,
    isOAuthConfigured,
    lastSyncFormatted
} = storeToRefs(profileStore);

// Default avatar SVG as data URI
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234285F4"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v1h16v-1c0-3-2-6-8-6z"/></svg>';

// Sync interval (in days)
const DEFAULT_SYNC_INTERVAL = 1;
const syncIntervalDays = ref(DEFAULT_SYNC_INTERVAL);

// Track upload vs download for button states
let syncDirection = null;

/**
 * Handles Google sign-in flow.
 */
async function handleSignIn() {
    await profileStore.signIn();
}

/**
 * Handles sign-out.
 */
async function handleSignOut() {
    await profileStore.signOut();
}

/**
 * Performs upload sync to Google Drive.
 */
async function performUpload() {
    syncDirection = 'upload';
    await profileStore.uploadToCloud();
    syncDirection = null;
}

/**
 * Performs download sync from Google Drive.
 */
async function performDownload() {
    syncDirection = 'download';
    await profileStore.downloadFromCloud();
    syncDirection = null;
}

/**
 * Refreshes cloud backup status info.
 */
async function refreshCloudStatus() {
    await profileStore.refreshCloudInfo();
}

/**
 * Saves the sync interval preference.
 */
async function saveSyncInterval() {
    await profileStore.persistPreference('profileSyncIntervalDays', syncIntervalDays.value);
    profileStore.lastSyncResult = { type: 'success', message: `Sync interval set to ${syncIntervalDays.value} day(s)` };
}

/**
 * Resets sync interval to default (1 day).
 */
function resetSyncInterval() {
    syncIntervalDays.value = DEFAULT_SYNC_INTERVAL;
    saveSyncInterval();
}

/**
 * Dismisses the sync result notification.
 */
function dismissResult() {
    profileStore.lastSyncResult = null;
}

// Watch preference changes and persist to storage
watch([autoSyncEnabled, syncLibrary, syncHistory, syncPersonal, syncSettings, syncCache], 
    () => profileStore.savePreferences(),
    { deep: true }
);

onMounted(async () => {
    await profileStore.initialize();
    
    // Load saved sync interval
    const saved = await chrome.storage?.local?.get?.('profileSyncIntervalDays');
    if (saved?.profileSyncIntervalDays) {
        syncIntervalDays.value = saved.profileSyncIntervalDays;
    }
    
    if (profileStore.isSignedIn) {
        await profileStore.refreshCloudInfo();
    }
});
</script>

<style scoped lang="scss">
/* Account Section */
.account-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    .account-info {
        display: flex;
        align-items: center;
        gap: 14px;

        .avatar-wrapper {
            position: relative;

            .user-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 2px solid var(--accent-primary);
                box-shadow: 0 0 12px rgba(117, 81, 255, 0.3);
            }

            .status-dot {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid var(--bg-card);

                &.online {
                    background: #10b981;
                }
            }
        }

        .account-details {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .user-email {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 14px;
            }

            .sync-status-text {
                font-size: 12px;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                gap: 4px;

                .status-icon {
                    color: #10b981;
                }
            }
        }
    }
}

/* Sign In Section */
.sign-in-section {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .sign-in-info {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .info-text {
            color: var(--text-secondary);
            font-size: 14px;
            margin: 0;
        }

        .benefit-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;

            li {
                font-size: 13px;
                color: var(--text-secondary);
            }
        }
    }

    .btn-google {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: white;
        color: #444;
        border: 1px solid #ddd;
        padding: 12px 24px;
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;

        &:hover {
            background: #f8f9fa;
            border-color: #4285F4;
            box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
        }

        .google-icon {
            flex-shrink: 0;
        }
    }
}

/* Sync Settings */
.sync-settings {
    &.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    .divider-line {
        height: 1px;
        background: var(--border-color);
        margin: 16px 0;
    }

    .section-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 0 0 12px 0;
    }

    .sync-checkboxes {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    /* Sync Interval Section */
    .sync-interval-section {
        margin-top: 12px;
        padding: 12px;
        background: rgba(117, 81, 255, 0.05);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;

        .interval-input-group {
            display: flex;
            align-items: center;
            gap: 8px;

            label {
                font-size: 13px;
                color: var(--text-secondary);
            }

            .interval-input {
                width: 60px;
                padding: 6px 10px;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                background: var(--bg-body);
                color: var(--text-primary);
                font-size: 14px;
                text-align: center;

                &:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                }
            }

            .interval-suffix {
                font-size: 13px;
                color: var(--text-secondary);
            }
        }

        .interval-buttons {
            display: flex;
            gap: 8px;
        }
    }
}

.checkbox-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    transition: background 0.2s;

    &:hover:not(.disabled) {
        background: rgba(117, 81, 255, 0.05);
    }

    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-primary);
    }

    .checkbox-label {
        font-size: 13px;
        color: var(--text-primary);
    }
}

/* Sync Actions Card */
.sync-actions-card {
    grid-column: 1 / -1;

    &.disabled {
        opacity: 0.6;
    }

    .sync-actions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;

        .action-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 12px;
            padding: 24px 16px;
            background: var(--bg-body);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            transition: all 0.2s ease;

            &:hover {
                transform: translateY(-2px);
                border-color: var(--accent-primary);
                box-shadow: 0 4px 16px rgba(117, 81, 255, 0.1);
            }

            .action-icon-wrapper {
                width: 56px;
                height: 56px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;

                &.upload-icon { background: rgba(79, 70, 229, 0.15); }
                &.download-icon { background: rgba(16, 185, 129, 0.15); }
                &.status-icon { background: rgba(251, 191, 36, 0.15); }
            }

            .action-content {
                h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .cloud-stats { font-size: 13px !important; }

                .last-modified {
                    font-size: 11px;
                    opacity: 0.7;
                }

                .no-backup {
                    font-style: italic;
                    opacity: 0.6;
                }
            }
        }
    }

    /* Progress Section */
    .sync-progress-section {
        margin-top: 20px;
        padding: 16px;
        background: rgba(117, 81, 255, 0.05);
        border-radius: var(--radius-md);

        .progress-bar-container {
            height: 8px;
            background: var(--border-color);
            border-radius: 4px;
            overflow: hidden;

            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary), #6AD2FF);
                border-radius: 4px;
                transition: width 0.3s ease;
                animation: shimmer 1.5s infinite;
            }
        }

        .progress-text {
            display: block;
            margin-top: 8px;
            font-size: 13px;
            color: var(--text-secondary);
            text-align: center;
        }
    }

    /* Sync Result Banner */
    .sync-result-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 16px;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        font-size: 14px;

        &.success {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
        }

        &.error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }

        .result-message { flex: 1; }

        .dismiss-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.6;
            color: inherit;

            &:hover { opacity: 1; }
        }
    }
}

@keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
}

/* Setup Banner */
.setup-banner {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(255, 171, 0, 0.1) 0%, rgba(255, 171, 0, 0.05) 100%);
    border: 1px solid rgba(255, 171, 0, 0.3);
    border-radius: var(--radius-md);

    .banner-icon { font-size: 32px; }

    .banner-content {
        h4 {
            margin: 0 0 4px 0;
            color: #FFAB00;
            font-size: 16px;
        }

        p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 13px;
        }
    }
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

/* Responsive */
@media (max-width: 900px) {
    .sync-actions-grid {
        grid-template-columns: 1fr;
    }
    
    .sync-checkboxes {
        grid-template-columns: 1fr;
    }
}

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

.caution-banner {
    background-color: rgba(255, 255, 255, 0.02);
    border: 1px dashed var(--border-color, #2B3674);
    border-radius: var(--radius-md, 8px);
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    width: 100%;

    .caution-icon { font-size: 20px; }

    .caution-text {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.5;

        strong { color: var(--warning, #FFB547); }
    }
}

/* Export Options */
.export-options {
    margin-bottom: 20px;
    width: 100%;

    .section-label {
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

            &:hover {
                background: rgba(67, 24, 255, 0.05);
                border-color: rgba(67, 24, 255, 0.2);
            }

            input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: var(--accent-primary);
                cursor: pointer;
            }

            span:first-of-type {
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
        }
    }
}
</style>
