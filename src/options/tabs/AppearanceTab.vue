<!--
  Appearance Settings Tab
  
  Controls for visual customization including themes,
  highlight colors, and card styles.
-->

<template>
    <div class="tab-content">
        <!-- Theme Settings -->
        <GlassCard title="Theme & UI" subtitle="Customize the extension's look and feel">
            <div class="settings-group">
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Theme</span>
                        <span class="setting-description">Choose a color scheme</span>
                    </div>
                    <div class="setting-control">
                        <CrystalSelect
                            :model-value="theme"
                            :options="themeOptions"
                            @update:model-value="updateTheme"
                            class="theme-select"
                        />
                    </div>
                </div>

                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Card Size</span>
                        <span class="setting-description">Size of manga cards in the library</span>
                    </div>
                    <div class="setting-control">
                        <CrystalSelect
                            :model-value="cardSize"
                            :options="cardSizeOptions"
                            @update:model-value="(val) => updateSetting('cardSize', val)"
                            class="size-select"
                        />
                    </div>
                </div>
            </div>
        </GlassCard>
        
        <!-- Highlight Styles -->
        <GlassCard title="Highlight Styles" subtitle="Customize card borders and status colors">
            <div class="settings-group">
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Border Style</span>
                        <span class="setting-description">Line style for status borders</span>
                    </div>
                    <div class="setting-control">
                        <CrystalSelect
                            :model-value="border.style"
                            :options="borderStyleOptions"
                            @update:model-value="(val) => updateSetting('border.style', val)"
                            class="style-select"
                        />
                    </div>
                </div>
                
                <div class="setting-row">
                    <div class="setting-info">
                        <span class="setting-label">Border Thickness</span>
                        <span class="setting-description">{{ border.size }}px</span>
                    </div>
                    <div class="setting-control range-control">
                        <input 
                            type="range" 
                            min="1" 
                            max="8" 
                            step="1" 
                            :value="border.size"
                            @input="(e) => updateSetting('border.size', parseInt(e.target.value))"
                            class="range-input"
                        >
                    </div>
                </div>

                <div class="colors-grid">
                    <div v-for="(color, status) in statusColors" :key="status" class="color-item">
                        <div class="color-preview" :style="{ backgroundColor: color, borderStyle: border.style, borderWidth: border.size + 'px' }"></div>
                        <div class="color-info">
                            <span class="status-name">{{ status }}</span>
                            <div class="color-input-wrapper">
                                <input 
                                    type="color" 
                                    :value="color"
                                    @input="(e) => updateSetting(`statusColors.${status}`, e.target.value)"
                                >
                                <span class="color-value">{{ color.toUpperCase() }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettings } from '@/composables/useSettings';
import GlassCard from '@/components/GlassCard.vue';
import CrystalSelect from '@/components/CrystalSelect.vue';
import { BORDER_STYLES } from '@/core/config';

const { 
    theme, 
    statusColors, 
    border, 
    cardSize,
    availableThemes, 
    updateSetting 
} = useSettings();

const themeOptions = computed(() => availableThemes.value.map(t => ({
    label: t.name,
    value: t.id
})));

const cardSizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' }
];

const borderStyleOptions = BORDER_STYLES.map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: s
}));

const updateTheme = (newTheme) => {
    updateSetting('theme', newTheme);
};
</script>

<style lang="scss" scoped>
.tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.settings-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child {
        border-bottom: none;
    }
}

.setting-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.setting-label {
    font-weight: 500;
}

.setting-description {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}

.setting-control {
    width: 200px;
    
    &.range-control {
        display: flex;
        align-items: center;
    }
}

.range-input {
    width: 100%;
    accent-color: var(--color-primary);
}

.colors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);
    margin-top: var(--space-4);
}

.color-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
}

.color-preview {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    border-color: rgba(255, 255, 255, 0.2); /* Fallback */
}

.color-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.status-name {
    font-size: var(--text-sm);
    font-weight: 500;
}

.color-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    
    input[type="color"] {
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        
        &::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        
        &::-webkit-color-swatch {
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
        }
    }
}

.color-value {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-family: monospace;
}
</style>
