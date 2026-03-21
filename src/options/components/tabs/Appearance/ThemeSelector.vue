<template>
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
        </div>
    </SettingsCard>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import SettingsCard from '../../common/SettingsCard.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
const { theme } = storeToRefs(settingsStore);

const setTheme = (name) => {
    theme.value = name;
    settingsStore.updateSetting('theme', name);
    settingsStore.updateSetting('isCustomTheme', false);
    
    const html = document.documentElement;
    html.style.removeProperty('--bg-body');
    html.style.removeProperty('--bg-sidebar');
    html.style.removeProperty('--bg-card');
    html.style.removeProperty('--accent-primary');
    html.style.removeProperty('--text-primary');
    
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode');
    
    if (name === 'light') {
        html.classList.add('light-mode');
    } else {
        html.classList.add(`${name}-mode`);
    }

    document.documentElement.setAttribute('data-theme', name);
};
</script>

<style scoped lang="scss">
.theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;

    .theme-preview-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.25rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        &:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--accent-primary);
        }

        &.active {
            border-color: var(--accent-primary);
            background: rgba(117, 81, 255, 0.1);
            box-shadow: 0 0 20px rgba(117, 81, 255, 0.2);
        }

        .theme-swatch {
            width: 100%;
            height: 80px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);

            &.dark-swatch { background: linear-gradient(135deg, #0b1437 0%, #111c44 100%); }
            &.black-swatch { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); }
            &.light-swatch { background: linear-gradient(135deg, #f4f7fe 0%, #ffffff 100%); }
            &.neon-swatch { background: linear-gradient(135deg, #030303 0%, #00ff41 100%); }
        }

        .theme-label {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-primary);
        }
    }
}
</style>
