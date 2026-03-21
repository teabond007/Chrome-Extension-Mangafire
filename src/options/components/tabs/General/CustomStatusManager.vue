<template>
    <SettingsCard 
        title="Custom Statuses" 
        icon="🎨" 
        guide-target="guide-statuses"
    >
        <div class="feature-toggle-header">
            <span class="description" style="margin:0;">Add custom statuses beyond the defaults.</span>
            <SwitchControl
                id="CustomBookmarks"
                label=""
                v-model="customStatusEnabled"
            />
        </div>
        <div style="margin-top: 15px;"></div>

        <div class="input-group-row">
            <div class="input-wrapper flex-grow">
                <label for="bookmarkName">Status Name</label>
                <input type="text" id="bookmarkName" v-model="newStatusName" placeholder="e.g. Re-reading" class="input-field">
            </div>
            <div class="input-wrapper">
                <label for="colorBookmarks">Color</label>
                <div class="color-picker-wrapper">
                    <input type="color" id="colorBookmarks" v-model="newStatusColor">
                </div>
            </div>
            <div class="input-wrapper">
                <label for="customBorderStyleSelect">Border Style</label>
                <select id="customBorderStyleSelect" v-model="newStatusStyle" class="select-field">
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
                <button id="addBookmarkButton" class="btn btn-primary btn-input-height" @click="handleAddStatus">
                    + Add
                </button>
            </div>
        </div>

        <div class="active-markers-header">
            <label class="section-label">ACTIVE STATUSES</label>
            <button id="resetBookmarkButton" class="btn btn-ghost btn-sm" @click="handleResetStatuses">
                Remove All
            </button>
        </div>

        <!-- Reactive status pills rendered by Vue -->
        <div id="CustomBookmarksContainer" class="markers-container">
            <span v-if="settingsStore.customStatuses.length === 0" class="description" style="margin:0;">
                No active statuses.
            </span>
            <div 
                v-for="(status, index) in settingsStore.customStatuses" 
                :key="index"
                class="marker-pill"
                :style="{
                    backgroundColor: status.color + '33',
                    border: `2px ${status.style || 'solid'} ${status.color}CC`
                }"
                :title="`Click to remove '${status.name}'`"
                @click="handleRemoveStatus(index, status.name)"
            >
                {{ status.name }}
            </div>
        </div>
    </SettingsCard>
</template>

<script setup>
import { ref, computed } from 'vue';
import SwitchControl from '../../common/SwitchControl.vue';
import SettingsCard from '../../common/SettingsCard.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

const customStatusEnabled = computed({
    get: () => settingsStore.customStatusEnabled ?? false,
    set: (val) => settingsStore.updateSetting('customStatusEnabled', val)
});

const newStatusName = ref('');
const newStatusColor = ref('#ff0000');
const newStatusStyle = ref('solid');

async function handleAddStatus() {
    const name = newStatusName.value.trim();
    if (!name) {
        alert('Please enter a name for the status.');
        return;
    }
    await settingsStore.addCustomStatus(name, newStatusColor.value, newStatusStyle.value);
    newStatusName.value = '';
}

async function handleRemoveStatus(index, name) {
    if (confirm(`Remove status "${name}"?`)) {
        await settingsStore.removeCustomStatus(index);
    }
}

async function handleResetStatuses() {
    if (confirm('Are you sure you want to remove all custom statuses?')) {
        await settingsStore.resetCustomStatuses();
    }
}
</script>

<style scoped lang="scss">
.input-group-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.feature-toggle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}
</style>
