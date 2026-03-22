<template>
    <div class="card" :class="{ 'full-height': fullHeight, 'highlight-card': highlight }">
        <div class="card-header">
            <div class="card-icon" :style="iconStyle">{{ icon }}</div>
            <h3>{{ title }}</h3>
            <button 
                v-if="guideTarget" 
                class="info-redirect-btn" 
                :title="guideTitle"
                @click="handleRedirect"
            >
                <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
            </button>
        </div>
        <div class="card-body">
            <slot></slot>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '../../scripts/store/settings.store.js';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '⚙️'
    },
    guideTarget: {
        type: String,
        default: ''
    },
    guideTitle: {
        type: String,
        default: 'More Info'
    },
    fullHeight: {
        type: Boolean,
        default: false
    },
    highlight: {
        type: Boolean,
        default: false
    },
    iconBg: {
        type: String,
        default: ''
    },
    iconColor: {
        type: String,
        default: ''
    }
});

const settingsStore = useSettingsStore();

const iconStyle = computed(() => {
    const style = {};
    if (props.iconBg) style.background = props.iconBg;
    if (props.iconColor) style.color = props.iconColor;
    return style;
});

const handleRedirect = () => {
    if (!props.guideTarget) return;

    // Switch to About tab
    settingsStore.activeTab = 'about';

    // Scroll to target element after a short delay for tab switch
    setTimeout(() => {
        const targetElement = document.getElementById(props.guideTarget);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetElement.classList.add('highlight-pulse');
            setTimeout(() => targetElement.classList.remove('highlight-pulse'), 2000);
        }
    }, 100);
};
</script>
