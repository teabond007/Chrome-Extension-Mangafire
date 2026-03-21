<template>
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
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import SettingsCard from '../../common/SettingsCard.vue';
import { useProfileStore } from '../../../scripts/store/profile.store.js';

const profileStore = useProfileStore();
const { isSignedIn, userEmail, userAvatar, lastSyncFormatted } = storeToRefs(profileStore);

const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234285F4"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v1h16v-1c0-3-2-6-8-6z"/></svg>';

async function handleSignIn() {
    await profileStore.signIn();
}

async function handleSignOut() {
    await profileStore.signOut();
}
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
</style>
