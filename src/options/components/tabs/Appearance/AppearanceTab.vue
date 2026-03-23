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
                        <ToggleSwitch :id="TOGGLES.CUSTOM_SITE_HIGHLIGHT" v-model="highlightEnabled" />
                    </div>

                    <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                        <div class="toggle-label-group">
                            <label class="toggle-main-label">Glow Effect</label>
                            <span class="toggle-sub-label">Use status glow for custom sites</span>
                        </div>
                        <ToggleSwitch :id="TOGGLES.CUSTOM_SITE_GLOW_EFFECT" v-model="customSiteUseGlow" />
                    </div>

                    <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                        <div class="toggle-label-group">
                            <label class="toggle-main-label">Status Ribbons</label>
                            <span class="toggle-sub-label">Show status corner ribbons</span>
                        </div>
                        <ToggleSwitch :id="TOGGLES.CUSTOM_SITE_SHOW_RIBBONS" v-model="customSiteShowRibbons" />
                    </div>

                    <div class="divider"></div>


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
                        :id="TOGGLES.LIBRARY_BORDERS" 
                        label="Show Status Borders" 
                        sub-label="Color borders in library" 
                        v-model="libraryBordersEnabled"
                    />
                    <SwitchControl 
                        :id="TOGGLES.LIBRARY_HIDE_NO_HISTORY" 
                        label="Only Show with History" 
                        sub-label="Hide entries with no progress" 
                        v-model="libraryHideNoHistory"
                    />



                    <div class="divider"></div>
                    <p class="section-label">✨ Visual Effects</p>

                    <SwitchControl 
                        :id="TOGGLES.LIBRARY_GLOW_EFFECT" 
                        label="Glow Effect" 
                        sub-label="Use glow instead of solid borders" 
                        v-model="libraryUseGlow"
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
import { TOGGLES, SETTINGS } from '../../../../config.js';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

const { 
    highlightThickness,
    borderStyle,
    libraryBordersEnabled,
    libraryHideNoHistory,
    libraryUseGlow,
    libraryAnimatedBorders,
    libraryShowProgressBar,
    highlightEnabled,
    customSiteShowRibbons,
    customSiteUseGlow
} = storeToRefs(settingsStore);

const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => {
        settingsStore.updateSetting(key, newVal);
    });
};

bindSetting(libraryBordersEnabled, 'libraryBordersEnabled');
bindSetting(libraryUseGlow, 'libraryUseGlow');
bindSetting(libraryAnimatedBorders, 'libraryAnimatedBorders');

bindSetting(libraryHideNoHistory, 'libraryHideNoHistory');
bindSetting(highlightEnabled, 'highlightEnabled');
bindSetting(customSiteShowRibbons, 'customSiteShowRibbons');
bindSetting(customSiteUseGlow, 'customSiteUseGlow');



const updateHighlightThickness = (e) => {
    const val = parseInt(e.target.value);
    highlightThickness.value = val;
    settingsStore.updateSetting('highlightThickness', val);
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
