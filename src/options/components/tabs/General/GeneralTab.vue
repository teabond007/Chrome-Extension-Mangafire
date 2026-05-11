<template>
    <div id="tab-settings" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'settings' }">
        <header class="header">
            <div class="header-text">
                <h1>Settings</h1>
                <p class="subtitle">Configure your custom bookmarks, manage sync, and display preferences.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Row 0: General Preferences -->
            <div class="cards-row">
                <SettingsCard 
                    title="General Preferences" 
                    icon="⚙️" 
                    guide-target="guide-general"
                    full-height
                >
                    <div class="input-group-vertical">
                        <SwitchControl 
                            :id="TOGGLES.QUICK_ACTIONS" 
                            label="Quick Actions Overlay" 
                            sub-label="Show actions on hover (external sites & library)"
                            v-model="quickActions"
                        />

                        <SwitchControl 
                            :id="TOGGLES.FAMILY_FRIENDLY" 
                            label="Family Friendly Mode" 
                            sub-label="Filter out Ecchi and Hentai tags from library"
                            v-model="familyFriendlyEnabled"
                            margin-top
                        />
                        <SwitchControl 
                            :id="TOGGLES.LIBRARY_SHOW_RIBBONS" 
                            label="Show Status Ribbons" 
                            sub-label="Show corner status banners on all platforms"
                            v-model="libraryShowRibbons"
                            margin-top
                        />
                        <SwitchControl 
                            :id="TOGGLES.PROGRESS_TRACKING" 
                            label="Auto-Save Progress" 
                            sub-label="Automatically save chapter progress while reading"
                            v-model="progressTracking"
                            margin-top
                        />

                    </div>
                </SettingsCard>
            </div>
            

            <!-- Card: Custom Statuses -->
            <CustomStatusManager />
        </div>
    </div>
</template>

<script setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import SwitchControl from '../../common/SwitchControl.vue';
import SettingsCard from '../../common/SettingsCard.vue';
import CustomStatusManager from './CustomStatusManager.vue';
import { TOGGLES } from '../../../../config.js';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

const { 
    quickActions, 
    progressTracking,
    familyFriendlyEnabled,
    libraryShowRibbons
} = storeToRefs(settingsStore);

const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => settingsStore.updateSetting(key, newVal));
};

bindSetting(quickActions, 'quickActions');
bindSetting(progressTracking, 'progressTracking');
bindSetting(familyFriendlyEnabled, 'familyFriendlyEnabled');
bindSetting(libraryShowRibbons, 'libraryShowRibbons');
</script>

<style scoped lang="scss">
.cards-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.input-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
</style>
