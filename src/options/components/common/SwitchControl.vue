<template>
    <div 
        class="feature-toggle-wrapper" 
        :class="{ 'mt-10': marginTop }"
        @click="$emit('update:modelValue', !modelValue)"
    >
        <div class="toggle-label-group">
            <label :for="id" class="toggle-main-label" @click.stop>{{ label }}</label>
            <span v-if="subLabel" class="toggle-sub-label">{{ subLabel }}</span>
        </div>
        <ToggleSwitch 
            :id="id"
            :model-value="modelValue"
            @update:model-value="$emit('update:modelValue', $event)"
            @click.stop
        />
    </div>
</template>

<script setup>
import ToggleSwitch from './ToggleSwitch.vue';

defineProps({
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    subLabel: {
        type: String,
        default: ''
    },
    modelValue: {
        type: Boolean,
        default: false
    },
    marginTop: {
        type: Boolean,
        default: false
    },
    small: {
        type: Boolean,
        default: false
    }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.mt-10 {
    margin-top: 10px;
}
</style>
