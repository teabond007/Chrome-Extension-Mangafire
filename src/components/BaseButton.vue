<!--
  BaseButton Component
  
  A versatile button component with multiple variants.
-->

<template>
    <button 
        :class="['base-btn', `btn-${variant}`, { 'btn-loading': loading }]"
        :disabled="disabled || loading"
        v-bind="$attrs"
    >
        <span v-if="loading" class="btn-spinner"></span>
        <span v-if="icon && !loading" class="btn-icon">{{ icon }}</span>
        <span class="btn-label"><slot /></span>
    </button>
</template>

<script setup>
defineProps({
    /** Button style variant */
    variant: {
        type: String,
        default: 'primary',
        validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v)
    },
    /** Icon emoji or character to display */
    icon: {
        type: String,
        default: ''
    },
    /** Disabled state */
    disabled: {
        type: Boolean,
        default: false
    },
    /** Loading state */
    loading: {
        type: Boolean,
        default: false
    }
});
</script>

<style lang="scss" scoped>
.base-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.btn-primary {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
    color: white;
    
    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: var(--glow-primary);
    }
}

.btn-secondary {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    
    &:hover:not(:disabled) {
        border-color: var(--color-text-muted);
    }
}

.btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    
    &:hover:not(:disabled) {
        background: var(--color-bg-elevated);
        color: var(--color-text-primary);
    }
}

.btn-danger {
    background: var(--color-error);
    color: white;
    
    &:hover:not(:disabled) {
        filter: brightness(1.1);
    }
}

.btn-loading {
    position: relative;
    color: transparent;
}

.btn-spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
