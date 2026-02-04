<template>
    <div id="tab-settings" class="tab-pane active fade-in">
        <header class="header">
            <div class="header-text">
                <h1>Settings</h1>
                <p class="subtitle">Configure your custom bookmarks for MangaFire.to, manage sync, and display
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
                            id="MarkHomePage" 
                            label="Mark Homepage" 
                            sub-label="Highlight manga on the homepage"
                            v-model="markHomepage"
                        />
                        <SwitchControl 
                            id="MangaFireQuickActions" 
                            label="Quick Actions Overlay" 
                            sub-label="Show 'Continue', 'Status', 'Rating' on hover"
                            v-model="quickActions"
                            margin-top
                        />
                        <SwitchControl 
                            id="MangaFireShowProgress" 
                            label="Show Reading Badges" 
                            sub-label="Display 'Ch. X/Y' on manga cards"
                            v-model="showReadingBadges"
                            margin-top
                        />
                        <SwitchControl 
                            id="FamilyFriendly" 
                            label="Family Friendly" 
                            sub-label="Hide Ecchi/Adult content" 
                            v-model="familyFriendly"
                            margin-top
                        />
                    </div>
                </SettingsCard>

                <!-- Card 3: Dashboard Settings -->
                <SettingsCard 
                    title="Dashboard Settings" 
                    icon="📊" 
                    guide-target="guide-personalization" 
                    full-height
                >
                    <p class="description compact">Configure the appearance and behavior of your Manga
                        Dashboard.</p>
                    <SwitchControl 
                        id="NewTabDashboard" 
                        label="Enable Dashboard" 
                        sub-label="Replace new tab page"
                        v-model="dashboardEnabled"
                    />
                    <SwitchControl 
                        id="DashboardLayoutStyle" 
                        label="Packed Layout" 
                        sub-label="Show stats and more info" 
                        v-model="dashboardPackedLayout"
                        margin-top
                    />
                </SettingsCard>
            </div>
            
            <!-- Row 1: Smart Automation & Reader Enhancements -->
            <div class="cards-row">
                <SettingsCard 
                    title="Smart Automation" 
                    icon="⚡" 
                    icon-bg="rgba(79, 70, 229, 0.1)"
                    icon-color="var(--primary)"
                    guide-target="guide-smart-automation"
                    full-height
                >
                    <SwitchControl 
                        id="SmartAutoComplete" 
                        label="Smart Auto-Complete" 
                        sub-label="Mark as 'Completed' when reaching last chapter"
                        v-model="smartAutoComplete"
                    />
                    <SwitchControl 
                        id="SmartInactivityFade" 
                        label="Inactivity Dimming" 
                        sub-label="Dim 'Reading' manga untouched for 30+ days"
                        v-model="smartInactivity"
                        margin-top
                    />
                    <SwitchControl 
                        id="SmartResumeLink" 
                        label="Smart Resume" 
                        sub-label="Dashboard opens next chapter (Predictive)"
                        v-model="smartResume"
                        margin-top
                    />

                </SettingsCard>

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

            <!-- Row 2: MangaDex & Webtoons Highlighting -->
            <div class="cards-row">
                <SettingsCard 
                    title="MangaDex Highlighting" 
                    icon="📖" 
                    icon-bg="rgba(255, 103, 64, 0.1)"
                    icon-color="#FF6740"
                    guide-target="guide-general"
                    full-height
                >
                    <SwitchControl 
                        id="MangaDexHighlightEnabled" 
                        label="Enable MangaDex Highlighting" 
                        sub-label="Show colored borders on mangadex.org"
                        v-model="mangaDexEnabled"
                    />
                    <SwitchControl 
                        id="MangaDexShowProgress" 
                        label="Show Reading Progress" 
                        sub-label="Display 'Ch. X/Y' on saved manga cards"
                        v-model="mangaDexShowProgress"
                        margin-top
                    />
                </SettingsCard>

                <SettingsCard 
                    title="Webtoons Highlighting" 
                    icon="📺" 
                    icon-bg="rgba(0, 220, 100, 0.1)"
                    icon-color="#00DC64"
                    guide-target="guide-general"
                    full-height
                >
                    <SwitchControl 
                        id="WebtoonsHighlightEnabled" 
                        label="Enable Webtoons Highlighting" 
                        sub-label="Show colored borders on webtoons.com"
                        v-model="webtoonsEnabled"
                    />
                    <SwitchControl 
                        id="WebtoonsShowProgress" 
                        label="Show Reading Progress" 
                        sub-label="Display 'Ep. X/Y' on saved webtoon cards"
                        v-model="webtoonsShowProgress"
                        margin-top
                    />

                    <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                        <div class="toggle-label-group">
                            <label for="WebtoonsBorderSize" class="toggle-main-label">Border
                                Thickness</label>
                            <span class="toggle-sub-label">Customize highlight border size</span>
                        </div>
                        <ToggleSwitch 
                            id="WebtoonsBorderSizeEnabled" 
                            v-model="webtoonsBorderSizeEnabled"
                            title="Enable Custom Border Size"
                        />
                    </div>
                </SettingsCard>
            </div>


            <!-- Card 1: Custom Markers -->
            <SettingsCard 
                title="Custom Markers" 
                icon="🎨" 
                guide-target="guide-markers"
            >
                <div class="feature-toggle-header">
                    <span class="description" style="margin:0;">Add custom statuses beyond the
                        defaults.</span>
                    <ToggleSwitch 
                        id="CustomBookmarks" 
                        title="Enable Custom Markers"
                    />
                </div>
                <div style="margin-top: 15px;"></div>

                <div class="input-group-row">
                    <div class="input-wrapper flex-grow">
                        <label for="bookmarkName">Marker Name</label>
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
                    <label class="section-label">ACTIVE MARKERS</label>
                    <button id="resetBookmarkButton" class="btn btn-ghost btn-sm">
                        Remove All
                    </button>
                </div>

                <div id="CustomBookmarksContainer" class="markers-container">
                    <!-- Bookmarks will be injected here -->
                </div>
            </SettingsCard>



            <!-- Card 4: Quick Access Shortcuts (Stretched) -->
            <SettingsCard 
                title="Quick Access Shortcuts" 
                icon="🔗" 
                guide-target="guide-quick-access"
            >
                <div class="card-body">
                    <p class="description">Customize the 5 shortcut circles on your Manga Dashboard.</p>
                    <div id="QuickAccessContainer" style="margin-top: 15px;">
                        <!-- Inputs generated by JS -->
                    </div>
                    <p id="logContainerQuickAccess" class="status-text"></p>
                    <div class="button-group" style="margin-top: 20px;">
                        <button id="SaveQuickAccessButton" class="btn btn-primary">Save Shortcuts</button>
                        <button id="ResetQuickAccessButton" class="btn btn-ghost">Reset to Defaults</button>
                    </div>
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
    markHomepage, 
    smartInactivity, 
    syncInterval, 
    highlightThickness,
    quickActions,
    showReadingBadges,
    familyFriendly,
    smartAutoComplete,
    smartResume,

    autoScroll,
    keybinds,
    progressTracking,
    mangaDexEnabled,
    mangaDexShowProgress,
    webtoonsEnabled,
    webtoonsShowProgress,
    webtoonsBorderSizeEnabled,
    webtoonsBorderSize,
    dashboardEnabled,
    dashboardPackedLayout
} = storeToRefs(settingsStore);

// Auto-persist watchers
const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => {
        settingsStore.updateSetting(key, newVal);
    });
};

// Bind all settings
bindSetting(markHomepage, 'markHomepage');
bindSetting(smartInactivity, 'smartInactivity');
bindSetting(quickActions, 'quickActions');
bindSetting(showReadingBadges, 'showReadingBadges');
bindSetting(familyFriendly, 'familyFriendly');
bindSetting(smartAutoComplete, 'smartAutoComplete');
bindSetting(smartResume, 'smartResume');

bindSetting(autoScroll, 'autoScroll');
bindSetting(keybinds, 'keybinds');
bindSetting(progressTracking, 'progressTracking');
bindSetting(mangaDexEnabled, 'mangaDexEnabled');
bindSetting(mangaDexShowProgress, 'mangaDexShowProgress');
bindSetting(webtoonsEnabled, 'webtoonsEnabled');
bindSetting(webtoonsShowProgress, 'webtoonsShowProgress');
bindSetting(webtoonsBorderSizeEnabled, 'webtoonsBorderSizeEnabled');
bindSetting(webtoonsBorderSize, 'webtoonsBorderSize');
bindSetting(dashboardEnabled, 'dashboardEnabled');
bindSetting(dashboardPackedLayout, 'dashboardPackedLayout');

// Sync Interval Logic
// We keep local 'days' binding and save explicitly via button as per original UI design
// But we can ALSO bind it to store if we want auto-save.
// Original UI has "Save Interval" button. Let's keep that behavior for now or simplify?
// User asked for "refactor plan... to pinia". Simplification is good.
</script>

<style scoped>
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
}

.bg-terminal {
    background: #0a0a0a;
    border: 1px solid rgba(0, 255, 0, 0.2);
}
</style>
