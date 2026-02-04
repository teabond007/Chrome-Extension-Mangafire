<template>
    <div id="tab-appearance" class="tab-pane fade-in">
        <header class="header">
            <div class="header-text">
                <h1>Appearance</h1>
                <p class="subtitle">Customize the look and feel of your extension and dashboard.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Card: Global Themes -->
            <SettingsCard 
                title="Preset Themes" 
                icon="🎭" 
                guide-target="guide-personalization"
            >
                <div class="theme-grid">
                    <div class="theme-preview-card" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
                        <div class="theme-swatch dark-swatch"></div>
                        <span class="theme-label">Cloudy Dark</span>
                    </div>
                    <div class="theme-preview-card" :class="{ active: theme === 'black' }" @click="setTheme('black')">
                        <div class="theme-swatch black-swatch"></div>
                        <span class="theme-label">Absolute Black</span>
                    </div>
                    <div class="theme-preview-card" :class="{ active: theme === 'light' }" @click="setTheme('light')">
                        <div class="theme-swatch light-swatch"></div>
                        <span class="theme-label">Clean Light</span>
                    </div>
                    <div class="theme-preview-card" :class="{ active: theme === 'neon' }" @click="setTheme('neon')">
                        <div class="theme-swatch neon-swatch"></div>
                        <span class="theme-label">Cyber Neon</span>
                    </div>
                    <div class="theme-preview-card" :class="{ active: theme === 'glassy' }" @click="setTheme('glassy')">
                        <div class="theme-swatch glassy-swatch"></div>
                        <span class="theme-label">Glassy Blue</span>
                    </div>
                </div>
            </SettingsCard>

            <!-- Card: Custom Theme Creator -->
            <SettingsCard 
                title="Theme Creator" 
                icon="✨" 
                guide-target="guide-personalization"
            >
                <div class="card-body"> 
                    <p class="description">Create your own personalized appearance by adjusting the colors below.</p>
                    <div class="color-creator-grid">
                        <div class="input-wrapper">
                            <label>Background</label>
                            <input type="color" v-model="customTheme.bg">
                        </div>
                        <div class="input-wrapper">
                            <label>Sidebar</label>
                            <input type="color" v-model="customTheme.sidebar">
                        </div>
                        <div class="input-wrapper">
                            <label>Accent</label>
                            <input type="color" v-model="customTheme.accent">
                        </div>
                        <div class="input-wrapper">
                            <label>Text</label>
                            <input type="color" v-model="customTheme.text">
                        </div>
                    </div>
                    <div class="button-group" style="margin-top: 20px;">
                        <button @click="applyCustomTheme" class="btn btn-primary">Apply Custom Theme</button>
                        <button @click="resetToDefault" class="btn btn-ghost">Reset to Default</button>
                    </div>
                </div>
            </SettingsCard>

            <!-- Layout for Style Cards (Two Columns) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">

                <!-- Card 2: Highlight Styles (Existing) -->
                <SettingsCard 
                    title="Highlight Styles" 
                    icon="🖼️" 
                    guide-target="guide-personalization"
                    full-height
                >
                    <div class="feature-toggle-wrapper">
                        <div class="toggle-label-group">
                            <label for="CustomBorderSize" class="toggle-main-label">Custom Borders</label>
                            <span class="toggle-sub-label">Enable highlighting on sites</span>
                        </div>
                        <ToggleSwitch 
                            id="CustomBorderSize" 
                        />
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

                <!-- Card 3: Library Styles (NEW) -->
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
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import ToggleSwitch from './common/ToggleSwitch.vue';
import SwitchControl from './common/SwitchControl.vue';
import SettingsCard from './common/SettingsCard.vue';
import { useSettingsStore } from '../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

const { 
    theme,
    isCustomTheme,
    customTheme,
    highlightThickness,
    libraryThickness,
    borderStyle,
    libraryBordersEnabled,
    libraryHideNoHistory,
    libraryUseGlow,
    libraryAnimatedBorders,

    libraryShowProgressBar
} = storeToRefs(settingsStore);

// Helper for simple setting binding
const bindSetting = (refValue, key) => {
    watch(refValue, (newVal) => {
        settingsStore.updateSetting(key, newVal);
    });
};

// Bind Library Settings
bindSetting(libraryBordersEnabled, 'libraryBordersEnabled');
// libraryHideNoHistory is used in Computed usually, but if it's in store we can bind it. 
// I need to add it to store first if it's missing.
bindSetting(libraryUseGlow, 'libraryUseGlow');
bindSetting(libraryAnimatedBorders, 'libraryAnimatedBorders');

bindSetting(libraryShowProgressBar, 'libraryShowProgressBar');

// Theme Logic
const setTheme = (name) => {
    theme.value = name;
    settingsStore.updateSetting('theme', name);
    settingsStore.updateSetting('isCustomTheme', false); // Clear custom theme flag
    
    // Remove custom CSS variables
    const html = document.documentElement;
    html.style.removeProperty('--bg-body');
    html.style.removeProperty('--bg-sidebar');
    html.style.removeProperty('--bg-card');
    html.style.removeProperty('--accent-primary');
    html.style.removeProperty('--text-primary');
    
    // Apply classes to document root for CSS selectors (Cloudy Dark -> dark-mode, etc)
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode', 'glassy-mode');
    
    if (name === 'light') {
        html.classList.add('light-mode');
    } else if (name === 'glassy') {
        html.classList.add('glassy-mode');
    } else {
        html.classList.add(`${name}-mode`);
    }

    document.documentElement.setAttribute('data-theme', name);
};

/**
 * Applies custom theme colors to the document root
 */
const applyCustomTheme = () => {
    const html = document.documentElement;
    
    // Remove preset theme classes
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode', 'glassy-mode');
    html.setAttribute('data-theme', 'custom');
    
    // Apply custom CSS variables
    html.style.setProperty('--bg-body', customTheme.value.bg);
    html.style.setProperty('--bg-sidebar', customTheme.value.sidebar);
    html.style.setProperty('--bg-card', customTheme.value.sidebar);
    html.style.setProperty('--accent-primary', customTheme.value.accent);
    html.style.setProperty('--text-primary', customTheme.value.text);
    
    // Persist to store
    settingsStore.updateSetting('isCustomTheme', true);
    settingsStore.updateSetting('customTheme', { ...customTheme.value });
    theme.value = 'custom';
};

/**
 * Resets theme to default (Cloudy Dark)
 */
const resetToDefault = () => {
    customTheme.value = { bg: '#0b1437', sidebar: '#111c44', accent: '#7551FF', text: '#ffffff' };
    setTheme('dark');
};

// Border Style Logic
const setBorderStyle = (style) => {
    borderStyle.value = style;
    settingsStore.updateSetting('borderStyle', style);
};

// Border Thickness Logic
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

<style scoped>
/* Appearance Tab styles - migrated from _appearance.css */
.theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.theme-preview-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
    border-radius: 16px;
    padding: 1.25rem;
    cursor: pointer;
    transition: var(--transition, all 0.2s);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.theme-preview-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--primary, #7551FF);
}

.theme-preview-card.active {
    border-color: var(--primary, #7551FF);
    background: rgba(117, 81, 255, 0.1);
    box-shadow: 0 0 20px rgba(117, 81, 255, 0.2);
}

.theme-swatch {
    width: 100%;
    height: 80px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-swatch {
    background: linear-gradient(135deg, #0b1437 0%, #111c44 100%);
}

.black-swatch {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
}

.light-swatch {
    background: linear-gradient(135deg, #f4f7fe 0%, #ffffff 100%);
}

.neon-swatch {
    background: linear-gradient(135deg, #030303 0%, #00ff41 100%);
}

.glassy-swatch {
    background: linear-gradient(135deg, rgba(11, 20, 55, 0.8) 0%, rgba(117, 81, 255, 0.4) 100%);
    backdrop-filter: blur(8px);
}

.theme-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-primary);
}

/* Color Creator Grid */
.color-creator-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 1rem;
}

.color-creator-grid .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.color-creator-grid input[type="color"] {
    width: 100%;
    height: 45px;
}

/* Range Display */
.range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}
</style>
