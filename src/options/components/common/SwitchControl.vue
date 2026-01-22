<template>
    <div class="feature-toggle-wrapper" :class="{ 'mt-10': marginTop }">
        <div class="toggle-label-group">
            <label :for="id" class="toggle-main-label">{{ label }}</label>
            <span v-if="subLabel" class="toggle-sub-label">{{ subLabel }}</span>
        </div>
        <label class="switch" :class="{ 'small-switch': small }">
            <input 
                type="checkbox" 
                :id="id" 
                :checked="modelValue" 
                @change="$emit('update:modelValue', $event.target.checked)"
            >
            <span class="slider round"></span>
        </label>
    </div>
</template>

<script setup>
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
