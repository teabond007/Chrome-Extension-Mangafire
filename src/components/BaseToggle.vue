<!--
  BaseToggle Component
  
  A premium styled toggle switch for boolean settings.
-->

<template>
    <label class="toggle-wrapper">
        <input 
            type="checkbox"
            class="toggle-input"
            :checked="modelValue"
            @change="$emit('update:modelValue', $event.target.checked)"
            v-bind="$attrs"
        >
        <span class="toggle-track">
            <span class="toggle-thumb"></span>
        </span>
    </label>
</template>

<script setup>
defineProps({
    /** Current toggle state (v-model) */
    modelValue: {
        type: Boolean,
        default: false
    }
});

defineEmits(['update:modelValue']);
</script>

<style lang="scss" scoped>
.toggle-wrapper {
    display: inline-flex;
    cursor: pointer;
}

.toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-track {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    transition: all 0.3s ease;
}

.toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--color-text-muted);
    border-radius: var(--radius-full);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-input:checked + .toggle-track {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
    border-color: transparent;
    
    .toggle-thumb {
        left: 22px;
        background: white;
    }
}

.toggle-input:focus-visible + .toggle-track {
    box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.3);
}
</style>
