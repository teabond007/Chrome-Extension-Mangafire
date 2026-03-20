<template>
    <div id="tab-settings" class="tab-pane active fade-in">
        <header class="header">
            <div class="header-text">
                <h1>Settings</h1>
                <p class="subtitle">Configure your custom bookmarks, manage sync, and display
                    preferences.</p>
            </div>
        </header>

        <div class="content-grid">

            <!-- Row 0: General Preferences & Dashboard Settings -->
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

            <!-- Card 1: Custom Statuses -->
            <SettingsCard 
                title="Custom Statuses" 
                icon="🎨" 
                guide-target="guide-statuses"
            >
                <div class="feature-toggle-header">
                    <span class="description" style="margin:0;">Add custom statuses beyond the
                        defaults.</span>
                    <ToggleSwitch 
                        id="CustomBookmarks" 
                        title="Enable Custom Statuses"
                    />
                </div>
                <div style="margin-top: 15px;"></div>

                <div class="input-group-row">
                    <div class="input-wrapper flex-grow">
                        <label for="bookmarkName">Status Name</label>
                        <input type="text" id="bookmarkName" placeholder="e.g. Re-reading"
                            class="input-field">
                    </div>
                    <div class="input-wrapper">
                        <label for="colorBookmarks">Color</label>
                        <div class="color-picker-wrapper">
                            <input type="color" id="colorBookmarks" value="#ff0000">
                        </div>
                    </div>
                    <div class="input-wrapper">
                        <label for="customBorderStyleSelect">Border Style</label>
                        <select id="customBorderStyleSelect" class="select-field">
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
                        <button id="addBookmarkButton" class="btn btn-primary btn-input-height">
                            + Add
                        </button>
                    </div>
                </div>

                <div class="active-markers-header">
                    <label class="section-label">ACTIVE STATUSES</label>
                    <button id="resetBookmarkButton" class="btn btn-ghost btn-sm">
                        Remove All
                    </button>
                </div>

                <div id="CustomBookmarksContainer" class="markers-container">
                    <!-- Bookmarks will be injected here -->
                </div>
            </SettingsCard>

        </div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ToggleSwitch from '../common/ToggleSwitch.vue';
import SwitchControl from '../common/SwitchControl.vue';
import SettingsCard from '../common/SettingsCard.vue';
import { useSettingsStore } from '../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

// Direct binding to store refs
// When these are mutated by v-model, Pinia state updates.
// Since we have a watcher in the store or direct actions, we need to ensure
// how the update happens.
// 
// Store Structure Check:
// The store has `updateSetting` action.
// Direct mutation of `const { theme } = storeToRefs(store)` works for local state change,
// BUT if we want to PERSIST to storage adapter, we need to trigger the action 
// OR have a deep watcher in the store (which we haven't implemented yet, 
// strictly speaking we implemented `storage.set` inside `updateSetting`).
//
// So we should use writable computed properties or a watch effect here?
// OR better: Update the store to use `$subscribe` for auto-persistence as planned in Phase 2?
// For now, let's use a helper composable or simple watchers here to call `updateSetting`.

const { 
    syncInterval, 
    highlightThickness,
    quickActions,
    showReadingBadges,

    autoScroll,
    keybinds,
    progressTracking
} = storeToRefs(settingsStore);

// Auto-persist watchers
const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => {
        settingsStore.updateSetting(key, newVal);
    });
};

// Bind all settings
bindSetting(quickActions, 'quickActions');
bindSetting(showReadingBadges, 'showReadingBadges');

bindSetting(autoScroll, 'autoScroll');
bindSetting(keybinds, 'keybinds');
bindSetting(progressTracking, 'progressTracking');

// Sync Interval Logic
// We keep local 'days' binding and save explicitly via button as per original UI design
// But we can ALSO bind it to store if we want auto-save.
// Original UI has "Save Interval" button. Let's keep that behavior for now or simplify?
// User asked for "refactor plan... to pinia". Simplification is good.
</script>

<style scoped lang="scss">
/* GeneralTab scoped styles */
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

.terminal-log {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;
    background: #0a0a0a;

    &.bg-terminal {
        border: 1px solid rgba(0, 255, 0, 0.2);
    }
}
</style>
