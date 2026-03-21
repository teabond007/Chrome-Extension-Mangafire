<template>
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
</template>

<script setup>
import { storeToRefs } from 'pinia';
import SettingsCard from '../../common/SettingsCard.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
const { theme, customTheme } = storeToRefs(settingsStore);

const applyCustomTheme = () => {
    const html = document.documentElement;
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode');
    html.setAttribute('data-theme', 'custom');
    
    html.style.setProperty('--bg-body', customTheme.value.bg);
    html.style.setProperty('--bg-sidebar', customTheme.value.sidebar);
    html.style.setProperty('--bg-card', customTheme.value.sidebar);
    html.style.setProperty('--accent-primary', customTheme.value.accent);
    html.style.setProperty('--text-primary', customTheme.value.text);
    
    settingsStore.updateSetting('isCustomTheme', true);
    settingsStore.updateSetting('customTheme', { ...customTheme.value });
    theme.value = 'custom';
};

const resetToDefault = () => {
    customTheme.value = { bg: '#0b1437', sidebar: '#111c44', accent: '#7551FF', text: '#ffffff' };
    
    theme.value = 'dark';
    settingsStore.updateSetting('theme', 'dark');
    settingsStore.updateSetting('isCustomTheme', false);
    
    const html = document.documentElement;
    html.style.removeProperty('--bg-body');
    html.style.removeProperty('--bg-sidebar');
    html.style.removeProperty('--bg-card');
    html.style.removeProperty('--accent-primary');
    html.style.removeProperty('--text-primary');
    
    html.classList.remove('black-mode', 'neon-mode', 'light-mode');
    html.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
};
</script>

<style scoped lang="scss">
.color-creator-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 1rem;

    .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        input[type="color"] {
            width: 100%;
            height: 45px;
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            background: transparent;
        }
    }
}

.button-group {
    display: flex;
    gap: 15px;
}
</style>
