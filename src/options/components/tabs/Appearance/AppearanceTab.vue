<template>
    <div id="tab-appearance" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'appearance' }">
        <header class="header">
            <div class="header-text">
                <h1>Appearance</h1>
                <p class="subtitle">Customize the look and feel of your extension and dashboard.</p>
            </div>
        </header>

        <div class="content-grid">
            <ThemeSelector />
            <ThemeCreator />

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <SettingsCard 
                    title="Highlight Styles" 
                    icon="🖼️" 
                    guide-target="guide-styles"
                    full-height
                >
                    <div class="feature-toggle-wrapper">
                        <div class="toggle-label-group">
                            <label for="CustomBorderSize" class="toggle-main-label">Custom Borders</label>
                            <span class="toggle-sub-label">Enable highlighting on sites</span>
                        </div>
                        <ToggleSwitch id="CustomBorderSize" v-model="highlightEnabled" />
                    </div>

                    <div class="divider"></div>

                    <div class="feature-toggle-wrapper">
                        <label class="feature-label">
                            Border Style
                            <span class="feature-subtitle">Choose line style</span>
                        </label>
                        <select :value="borderStyle" @change="setBorderStyle($event.target.value)" class="select-field">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                    </div>
                    <div class="divider"></div>
                    <div class="range-header">
                        <label>Highlight Thickness</label>
                        <span id="globalRangeValue" style="color: var(--primary); font-weight: bold;">{{ highlightThickness }}px</span>
                    </div>
                    <input type="range" :value="highlightThickness" @input="updateHighlightThickness" min="1" max="10"
                        class="range-slider">
                </SettingsCard>

                <SettingsCard 
                    title="Library Styles" 
                    icon="📚" 
                    guide-target="guide-personalization"
                    full-height
                >
                    <SwitchControl 
                        id="LibraryCardBordersEnabled" 
                        label="Show Status Borders" 
                        sub-label="Color borders in library" 
                        v-model="libraryBordersEnabled"
                    />
                    <SwitchControl 
                        id="LibraryHideNoHistory" 
                        label="Only Show with History" 
                        sub-label="Hide entries with no progress" 
                        v-model="libraryHideNoHistory"
                    />

                    <div class="divider"></div>
                    <div class="range-header">
                        <label>Border Thickness</label>
                        <span id="libraryBorderValue"
                            style="color: var(--primary); font-weight: bold;">{{ libraryThickness }}px</span>
                    </div>
                    <input type="range" :value="libraryThickness" @input="updateLibraryThickness" min="1" max="10"
                        class="range-slider">

                    <div class="divider"></div>
                    <p class="section-label">✨ Visual Effects</p>

                    <SwitchControl 
                        id="LibraryGlowEffect" 
                        label="Glow Effect" 
                        sub-label="Use glow instead of solid borders" 
                        v-model="libraryUseGlow"
                    />
                    <SwitchControl 
                        id="LibraryAnimatedBorders" 
                        label="Animated Borders" 
                        sub-label="Pulse animation for 'Reading' status" 
                        v-model="libraryAnimatedBorders"
                    />
                    <SwitchControl 
                        id="LibraryProgressBars" 
                        label="Progress Bars" 
                        sub-label="Reading progress on card covers" 
                        v-model="libraryShowProgressBar"
                    />
                </SettingsCard>
            </div>
        </div>
    </div>
</template>

<script setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import SwitchControl from '../../common/SwitchControl.vue';
import SettingsCard from '../../common/SettingsCard.vue';
import ThemeSelector from './ThemeSelector.vue';
import ThemeCreator from './ThemeCreator.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

const { 
    highlightThickness,
    libraryThickness,
    borderStyle,
    libraryBordersEnabled,
    libraryHideNoHistory,
    libraryUseGlow,
    libraryAnimatedBorders,
    libraryShowProgressBar,
    highlightEnabled
} = storeToRefs(settingsStore);

const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => {
        settingsStore.updateSetting(key, newVal);
    });
};

bindSetting(libraryBordersEnabled, 'libraryBordersEnabled');
bindSetting(libraryUseGlow, 'libraryUseGlow');
bindSetting(libraryAnimatedBorders, 'libraryAnimatedBorders');
bindSetting(libraryShowProgressBar, 'libraryShowProgressBar');
bindSetting(libraryHideNoHistory, 'libraryHideNoHistory');
bindSetting(highlightEnabled, 'highlightEnabled');

const setBorderStyle = (style) => {
    borderStyle.value = style;
    settingsStore.updateSetting('borderStyle', style);
};

const updateHighlightThickness = (e) => {
    const val = parseInt(e.target.value);
    highlightThickness.value = val;
    settingsStore.updateSetting('highlightThickness', val);
};

const updateLibraryThickness = (e) => {
    const val = parseInt(e.target.value);
    libraryThickness.value = val;
    settingsStore.updateSetting('libraryThickness', val);
};
</script>

<style scoped lang="scss">
.range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}
</style>
