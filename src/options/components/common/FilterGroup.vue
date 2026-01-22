<template>
    <div class="advanced-filter-group" :class="customClass">
        <label v-if="label" class="filter-label">{{ label }}</label>
        <slot></slot>
    </div>
</template>

<script setup>
/**
 * @fileoverview FilterGroup common component
 * Used to wrap filter controls with a label in a consistent layout.
 */
defineProps({
    /** @type {string} Label for the filter group */
    label: {
        type: String,
        default: ''
    },
    /** @type {string} Optional custom CSS class */
    customClass: {
        type: String,
        default: ''
    }
});
</script>

<style scoped>
/* Essential layout is handled by global _library.css */
</style>
