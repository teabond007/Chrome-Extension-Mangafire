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
                    <div class="theme-preview-card active" data-theme="dark">
                        <div class="theme-swatch dark-swatch"></div>
                        <span class="theme-label">Cloudy Dark</span>
                    </div>
                    <div class="theme-preview-card" data-theme="black">
                        <div class="theme-swatch black-swatch"></div>
                        <span class="theme-label">Absolute Black</span>
                    </div>
                    <div class="theme-preview-card" data-theme="light">
                        <div class="theme-swatch light-swatch"></div>
                        <span class="theme-label">Clean Light</span>
                    </div>
                    <div class="theme-preview-card" data-theme="neon">
                        <div class="theme-swatch neon-swatch"></div>
                        <span class="theme-label">Cyber Neon</span>
                    </div>
                    <div class="theme-preview-card" data-theme="glassy">
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
                <div class="card-body"> <!-- nested card-body is handled by SettingsCard slot, but kept here if needed for specific logic/CSS? NO. SettingsCard has its own card-body. -->
                    <p class="description">Create your own personalized appearance by adjusting the colors below.</p>
                    <div class="color-creator-grid">
                        <div class="input-wrapper">
                            <label>Background</label>
                            <input type="color" id="themeColorBg" value="#0b1437">
                        </div>
                        <div class="input-wrapper">
                            <label>Sidebar</label>
                            <input type="color" id="themeColorSidebar" value="#111c44">
                        </div>
                        <div class="input-wrapper">
                            <label>Accent</label>
                            <input type="color" id="themeColorAccent" value="#7551FF">
                        </div>
                        <div class="input-wrapper">
                            <label>Text</label>
                            <input type="color" id="themeColorText" value="#ffffff">
                        </div>
                    </div>
                    <div class="button-group" style="margin-top: 20px;">
                        <button id="ApplyCustomThemeBtn" class="btn btn-primary">Apply Custom Theme</button>
                        <button id="ResetThemeBtn" class="btn btn-ghost">Reset to Default</button>
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
                        <label class="switch small-switch">
                            <input type="checkbox" id="CustomBorderSize">
                            <span class="slider round"></span>
                        </label>
                    </div>

                    <div class="divider"></div>

                    <div class="feature-toggle-wrapper">
                        <label class="feature-label">
                            Border Style
                            <span class="feature-subtitle">Choose line style</span>
                        </label>
                        <select id="GlobalBorderStyle" class="select-field">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                    </div>
                    <div class="divider"></div>
                    <div class="range-header">
                        <label>Highlight Thickness</label>
                        <span id="globalRangeValue" style="color: var(--primary); font-weight: bold;">4px</span>
                    </div>
                    <input type="range" id="GlobalBorderSize" min="1" max="10" value="4"
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
                    />
                    <SwitchControl 
                        id="LibraryHideNoHistory" 
                        label="Only Show with History" 
                        sub-label="Hide entries with no progress" 
                    />

                    <div class="divider"></div>
                    <div class="range-header">
                        <label>Border Thickness</label>
                        <span id="libraryBorderValue"
                            style="color: var(--primary); font-weight: bold;">2px</span>
                    </div>
                    <input type="range" id="LibraryCardBorderThickness" min="1" max="10" value="2"
                        class="range-slider">

                    <div class="divider"></div>
                    <p class="section-label">✨ Visual Effects</p>

                    <SwitchControl 
                        id="LibraryGlowEffect" 
                        label="Glow Effect" 
                        sub-label="Use glow instead of solid borders" 
                    />
                    <SwitchControl 
                        id="LibraryAnimatedBorders" 
                        label="Animated Borders" 
                        sub-label="Pulse animation for 'Reading' status" 
                    />
                    <SwitchControl 
                        id="LibraryStatusIcons" 
                        label="Status Icons" 
                        sub-label="Show emoji overlay on cards" 
                    />
                    <SwitchControl 
                        id="LibraryProgressBars" 
                        label="Progress Bars" 
                        sub-label="Reading progress on card covers" 
                    />
                </SettingsCard>
            </div>
        </div>
    </div>
</template>

<script setup>
import SwitchControl from './common/SwitchControl.vue';
import SettingsCard from './common/SettingsCard.vue';
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
    color: var(--text-white, #fff);
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
