<template>
    <div id="tab-settings" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'settings' }">
        <header class="header">
            <div class="header-text">
                <h1>Settings</h1>
                <p class="subtitle">Configure your custom bookmarks, manage sync, and display
                    preferences.</p>
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
                            id="QuickActions" 
                            label="Quick Actions Overlay" 
                            sub-label="Show 'Continue', 'Status', 'Rating' on hover"
                            v-model="quickActions"
                        />
                        <SwitchControl 
                            id="ShowProgress" 
                            label="Show Reading Badges" 
                            sub-label="Display 'Ch. X/Y' on manga cards"
                            v-model="showReadingBadges"
                            margin-top
                        />
                    </div>
                </SettingsCard>
            </div>
            
            <!-- Row 1: Reader Enhancements -->
            <div class="cards-row">
                <SettingsCard 
                    title="Reader Enhancements" 
                    icon="📚" 
                    icon-bg="rgba(16, 185, 129, 0.1)"
                    icon-color="#10b981"
                    guide-target="guide-reader"
                    full-height
                >
                    <SwitchControl 
                        id="AutoScrollEnabled" 
                        label="Auto-Scroll Panel" 
                        sub-label="Show floating auto-scroll controls on reader pages"
                        v-model="autoScroll"
                    />
                    <SwitchControl 
                        id="KeybindsEnabled" 
                        label="Keyboard Shortcuts" 
                        sub-label="Arrow keys, Space (auto-scroll), F (fullscreen)"
                        v-model="keybinds"
                        margin-top
                    />
                    <SwitchControl 
                        id="ProgressTrackingEnabled" 
                        label="Auto-Save Progress" 
                        sub-label="Automatically save chapter progress while reading"
                        v-model="progressTracking"
                        margin-top
                    />
                </SettingsCard>
            </div>

            <!-- Card: Custom Statuses -->
            <SettingsCard 
                title="Custom Statuses" 
                icon="🎨" 
                guide-target="guide-statuses"
            >
                <div class="feature-toggle-header">
                    <span class="description" style="margin:0;">Add custom statuses beyond the
                        defaults.</span>
                    <!-- Toggle bound directly to store via SwitchControl -->
                    <SwitchControl
                        id="CustomBookmarks"
                        label=""
                        v-model="customStatusEnabled"
                    />
                </div>
                <div style="margin-top: 15px;"></div>

                <div class="input-group-row">
                    <div class="input-wrapper flex-grow">
                        <label for="bookmarkName">Status Name</label>
                        <input type="text" id="bookmarkName" v-model="newStatusName" placeholder="e.g. Re-reading"
                            class="input-field">
                    </div>
                    <div class="input-wrapper">
                        <label for="colorBookmarks">Color</label>
                        <div class="color-picker-wrapper">
                            <input type="color" id="colorBookmarks" v-model="newStatusColor">
                        </div>
                    </div>
                    <div class="input-wrapper">
                        <label for="customBorderStyleSelect">Border Style</label>
                        <select id="customBorderStyleSelect" v-model="newStatusStyle" class="select-field">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="double">Double</option>
                            <option value="groove">Groove</option>
                            <option value="ridge">Ridge</option>
                            <option value="inset">Inset</option>
                            <option value="outset">Outset</option>
                        </select>
                    </div>
                    <div class="input-wrapper input-button-wrapper">
                        <button id="addBookmarkButton" class="btn btn-primary btn-input-height" @click="handleAddStatus">
                            + Add
                        </button>
                    </div>
                </div>

                <div class="active-markers-header">
                    <label class="section-label">ACTIVE STATUSES</label>
                    <button id="resetBookmarkButton" class="btn btn-ghost btn-sm" @click="handleResetStatuses">
                        Remove All
                    </button>
                </div>

                <!-- Reactive status pills rendered by Vue -->
                <div id="CustomBookmarksContainer" class="markers-container">
                    <span v-if="settingsStore.customStatuses.length === 0" class="description" style="margin:0;">
                        No active statuses.
                    </span>
                    <div 
                        v-for="(status, index) in settingsStore.customStatuses" 
                        :key="index"
                        class="marker-pill"
                        :style="{
                            backgroundColor: status.color + '33',
                            border: `2px ${status.style || 'solid'} ${status.color}CC`
                        }"
                        :title="`Click to remove '${status.name}'`"
                        @click="handleRemoveStatus(index, status.name)"
                    >
                        {{ status.name }}
                    </div>
                </div>
            </SettingsCard>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import SwitchControl from '../common/SwitchControl.vue';
import SettingsCard from '../common/SettingsCard.vue';
import { useSettingsStore } from '../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

const { 
    quickActions, 
    showReadingBadges,
    autoScroll,
    keybinds,
    progressTracking
} = storeToRefs(settingsStore);

/** Custom status feature toggle — mapped to CustomBookmarksfeatureEnabled in storage. */
const customStatusEnabled = computed({
    get: () => settingsStore.customStatusEnabled ?? false,
    set: (val) => settingsStore.updateSetting('customStatusEnabled', val)
});

// New status form inputs
const newStatusName = ref('');
const newStatusColor = ref('#ff0000');
const newStatusStyle = ref('solid');

// Auto-persist watchers for toggle settings
const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => settingsStore.updateSetting(key, newVal));
};

bindSetting(quickActions, 'quickActions');
bindSetting(showReadingBadges, 'showReadingBadges');
bindSetting(autoScroll, 'autoScroll');
bindSetting(keybinds, 'keybinds');
bindSetting(progressTracking, 'progressTracking');

/** Adds a new custom status via the store action. */
async function handleAddStatus() {
    const name = newStatusName.value.trim();
    if (!name) {
        alert('Please enter a name for the status.');
        return;
    }
    await settingsStore.addCustomStatus(name, newStatusColor.value, newStatusStyle.value);
    newStatusName.value = '';
}

/** Removes a status by index after confirmation. */
async function handleRemoveStatus(index, name) {
    if (confirm(`Remove status "${name}"?`)) {
        await settingsStore.removeCustomStatus(index);
    }
}

/** Resets all custom statuses after confirmation. */
async function handleResetStatuses() {
    if (confirm('Are you sure you want to remove all custom statuses?')) {
        await settingsStore.resetCustomStatuses();
    }
}
</script>

<style scoped lang="scss">
.cards-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.input-group-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.input-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.feature-toggle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}
</style>
