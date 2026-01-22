<template>
    <div :id="id" class="card guide-card">
        <div class="card-header">
            <div v-if="icon" class="card-icon">{{ icon }}</div>
            <h3>{{ title }}</h3>
        </div>
        <div class="card-body">
            <p class="guide-text">
                <slot></slot>
            </p>
        </div>
    </div>
</template>

<script setup>
/**
 * @fileoverview GuideCard common component
 * Used for help sections and feature explanations.
 */
defineProps({
    /** @type {string} Optional ID for anchoring */
    id: {
        type: String,
        default: ''
    },
    /** @type {string} Header icon (emoji or SVG) */
    icon: {
        type: String,
        default: ''
    },
    /** @type {string} Card title */
    title: {
        type: String,
        required: true
    }
});
</script>
