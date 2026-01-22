<!--
  General Settings Tab
  
  Contains general extension settings like enable/disable,
  theme selection, and behavior options.
-->

<template>
    <div class="tab-content">
        <GlassCard title="Extension Settings" subtitle="Control how the extension behaves">
            <div class="settings-group">
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Manga Dashboard</span>
                        <span class="setting-description">Replace new tab page with manga dashboard</span>
                    </div>
                    <BaseToggle 
                        :model-value="features.newTabDashboard" 
                        @update:model-value="toggleDashboard" 
                    />
                </div>
                
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Auto-sync Bookmarks</span>
                        <span class="setting-description">Automatically sync with browser bookmarks</span>
                    </div>
                    <BaseToggle 
                        :model-value="features.autoSync" 
                        @update:model-value="toggleAutoSync" 
                    />
                </div>

                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Family Friendly Mode</span>
                        <span class="setting-description">Hide adult content and NSFW titles</span>
                    </div>
                    <BaseToggle 
                        :model-value="features.familyFriendly" 
                        @update:model-value="toggleFamilyFriendly" 
                    />
                </div>
            </div>
        </GlassCard>
        
        <GlassCard title="Notifications" subtitle="Configure notification preferences">
            <div class="settings-group">
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">New Chapter Alerts</span>
                        <span class="setting-description">Get notified when new chapters are available</span>
                    </div>
                    <BaseToggle 
                        :model-value="features.notifications" 
                        @update:model-value="toggleNotifications" 
                    />
                </div>
            </div>
        </GlassCard>
    </div>

</template>

<script setup>
import { useSettings } from '@/composables/useSettings';
import GlassCard from '@/components/GlassCard.vue';
import BaseToggle from '@/components/BaseToggle.vue';
import CrystalSelect from '@/components/CrystalSelect.vue';

const { features, updateSetting } = useSettings();

// Toggle handlers
const toggleDashboard = () => updateSetting('features.newTabDashboard', !features.value.newTabDashboard);
const toggleAutoSync = () => updateSetting('features.autoSync', !features.value.autoSync);
const toggleNotifications = () => updateSetting('features.notifications', !features.value.notifications);
const toggleFamilyFriendly = () => updateSetting('features.familyFriendly', !features.value.familyFriendly);
</script>


<style lang="scss" scoped>
.tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.settings-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child {
        border-bottom: none;
    }
}

.setting-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.setting-label {
    font-weight: 500;
}

.setting-description {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}
</style>
