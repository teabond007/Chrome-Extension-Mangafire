<!--
  BaseInput Component
  
  A versatile input component with support for icons, labels, and error states.
  Follows the glassmorphism design system.
-->

<template>
    <div class="base-input-wrapper" :class="{ 'has-error': error, 'is-disabled': disabled }">
        <label v-if="label" class="input-label">
            {{ label }}
            <span v-if="required" class="required">*</span>
        </label>
        
        <div class="input-container">
            <span v-if="icon" class="input-icon">{{ icon }}</span>
            
            <input
                ref="inputRef"
                :value="modelValue"
                :type="type"
                :placeholder="placeholder"
                :disabled="disabled"
                :required="required"
                class="base-input"
                :class="{ 'has-icon': icon }"
                v-bind="$attrs"
                @input="$emit('update:modelValue', $event.target.value)"
                @focus="isFocused = true"
                @blur="isFocused = false"
            />
            
            <div v-if="loading" class="input-spinner"></div>
        </div>
        
        <span v-if="error" class="input-error">{{ error }}</span>
        <span v-else-if="hint" class="input-hint">{{ hint }}</span>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    /** Input value (v-model) */
    modelValue: {
        type: [String, Number],
        default: ''
    },
    /** Input type */
    type: {
        type: String,
        default: 'text'
    },
    /** Label text */
    label: {
        type: String,
        default: ''
    },
    /** Placeholder text */
    placeholder: {
        type: String,
        default: ''
    },
    /** Icon character/emoji */
    icon: {
        type: String,
        default: ''
    },
    /** Error message */
    error: {
        type: String,
        default: ''
    },
    /** Hint/Help text */
    hint: {
        type: String,
        default: ''
    },
    /** Disabled state */
    disabled: {
        type: Boolean,
        default: false
    },
    /** Required state */
    required: {
        type: Boolean,
        default: false
    },
    /** Loading state */
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['update:modelValue']);

const isFocused = ref(false);
const inputRef = ref(null);
</script>

<style lang="scss" scoped>
.base-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
}

.input-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-left: var(--space-1);
}

.required {
    color: var(--color-error);
    margin-left: 2px;
}

.input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.base-input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--text-sm);
    transition: all 0.2s ease;
    
    &::placeholder {
        color: var(--color-text-muted);
    }
    
    &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
        background: var(--color-bg-surface);
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--color-bg-body);
    }
    
    &.has-icon {
        padding-left: var(--space-9);
    }
}

.input-icon {
    position: absolute;
    left: var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--text-lg);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.has-error .base-input {
    border-color: var(--color-error);
    
    &:focus {
        box-shadow: 0 0 0 2px rgba(var(--color-error-rgb), 0.1);
    }
}

.input-error {
    font-size: var(--text-xs);
    color: var(--color-error);
    margin-left: var(--space-1);
}

.input-hint {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-left: var(--space-1);
}

.input-spinner {
    position: absolute;
    right: var(--space-3);
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
