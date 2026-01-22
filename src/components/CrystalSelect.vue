<!--
  CrystalSelect Component
  
  A premium dropdown component with glassmorphism styling and custom interactions.
  Replaces standard select elements.
-->

<template>
    <div class="crystal-select-container" :class="{ 'is-open': isOpen, 'is-disabled': disabled }" v-click-outside="close">
        <!-- Label -->
        <label v-if="label" class="select-label">
            {{ label }}
        </label>

        <!-- Trigger Button -->
        <div class="crystal-select-trigger" @click="toggle" tabindex="0" @keydown.space.prevent="toggle" @keydown.enter.prevent="toggle" @keydown.esc="close">
            <div class="trigger-content">
                <span v-if="selectedOption?.color" class="marker-indicator" :style="{ backgroundColor: selectedOption.color }"></span>
                <span class="trigger-text" :class="{ 'placeholder': !modelValue }">
                    {{ displayLabel }}
                </span>
            </div>
            <div class="select-arrow">
                <svg viewBox="0 0 10 6" width="10" height="6">
                    <path d="M1 1L5 5L9 1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </div>

        <!-- Dropdown Menu -->
        <Transition name="dropdown">
            <div v-if="isOpen" class="crystal-dropdown">
                <div class="crystal-options-list">
                    <div 
                        v-for="option in normalizedOptions" 
                        :key="option.value"
                        class="crystal-option"
                        :class="{ 'is-selected': option.value === modelValue, 'is-disabled': option.disabled }"
                        @click="selectOption(option)"
                    >
                        <span v-if="option.color" class="marker-indicator" :style="{ backgroundColor: option.color }"></span>
                        <span class="option-text">{{ option.label }}</span>
                        
                        <span v-if="option.value === modelValue" class="check-icon">✓</span>
                    </div>
                    
                    <div v-if="normalizedOptions.length === 0" class="no-options">
                        No options available
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    /** Selected value (v-model) */
    modelValue: {
        type: [String, Number, Boolean, null],
        default: null
    },
    /** Options array. Can be strings or objects { label, value, color, disabled } */
    options: {
        type: Array,
        default: () => []
    },
    /** Label text */
    label: {
        type: String,
        default: ''
    },
    /** Placeholder text */
    placeholder: {
        type: String,
        default: 'Select...'
    },
    /** Disabled state */
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);

// Normalize options to object format
const normalizedOptions = computed(() => {
    return props.options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return {
                label: opt.label || opt.value,
                value: opt.value,
                color: opt.color,
                disabled: opt.disabled || false
            };
        }
        return {
            label: String(opt),
            value: opt,
            color: null,
            disabled: false
        };
    });
});

const selectedOption = computed(() => {
    return normalizedOptions.value.find(opt => opt.value === props.modelValue);
});

const displayLabel = computed(() => {
    return selectedOption.value ? selectedOption.value.label : props.placeholder;
});

function toggle() {
    if (props.disabled) return;
    isOpen.value = !isOpen.value;
}

function close() {
    isOpen.value = false;
}

function selectOption(option) {
    if (option.disabled) return;
    
    emit('update:modelValue', option.value);
    emit('change', option.value);
    close();
}

// Click outside directive (simple implementation)
const vClickOutside = {
    mounted(el, binding) {
        el.clickOutsideEvent = (event) => {
            if (!(el === event.target || el.contains(event.target))) {
                binding.value(event);
            }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
    }
};
</script>

<style lang="scss" scoped>
.crystal-select-container {
    position: relative;
    width: 100%;
    
    &.is-disabled {
        opacity: 0.6;
        pointer-events: none;
    }
}

.select-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-1);
    margin-left: var(--space-1);
}

.crystal-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    min-height: 40px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    
    &:hover {
        border-color: var(--color-text-muted);
        background: var(--color-bg-surface);
    }
    
    &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
    }
    
    .is-open & {
        border-color: var(--color-primary);
        background: var(--color-bg-surface);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }
}

.trigger-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    overflow: hidden;
}

.trigger-text {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    &.placeholder {
        color: var(--color-text-muted);
    }
}

.select-arrow {
    color: var(--color-text-muted);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    
    .is-open & {
        transform: rotate(180deg);
        color: var(--color-primary);
    }
}

.marker-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.crystal-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-top: none;
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    margin-top: -1px; /* Overlap border */
}

.crystal-options-list {
    max-height: 250px;
    overflow-y: auto;
    padding: var(--space-1);
    
    &::-webkit-scrollbar {
        width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: var(--color-border);
        border-radius: 3px;
        
        &:hover {
            background: var(--color-text-muted);
        }
    }
}

.crystal-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background 0.1s ease;
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    
    &:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    &.is-selected {
        background: rgba(var(--color-primary-rgb), 0.1);
        color: var(--color-primary);
        font-weight: 500;
    }
    
    &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.check-icon {
    margin-left: auto;
    font-size: var(--text-xs);
    font-weight: bold;
}

.no-options {
    padding: var(--space-3);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}
</style>
