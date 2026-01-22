<!--
  GlassCard Component
  
  A glassmorphism card container for content sections.
-->

<template>
    <div :class="['glass-card', { 'card-interactive': interactive }]">
        <header v-if="$slots.header || title" class="card-header">
            <slot name="header">
                <h3 class="card-title">{{ title }}</h3>
                <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
            </slot>
        </header>
        
        <div class="card-body">
            <slot />
        </div>
        
        <footer v-if="$slots.footer" class="card-footer">
            <slot name="footer" />
        </footer>
    </div>
</template>

<script setup>
defineProps({
    /** Card title */
    title: {
        type: String,
        default: ''
    },
    /** Card subtitle */
    subtitle: {
        type: String,
        default: ''
    },
    /** Enable hover interactions */
    interactive: {
        type: Boolean,
        default: false
    }
});
</script>

<style lang="scss" scoped>
.glass-card {
    background: var(--color-glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
}

.card-interactive {
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
        border-color: var(--color-text-muted);
    }
}

.card-header {
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border);
}

.card-title {
    font-size: var(--text-lg);
    font-weight: 600;
}

.card-subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
}

.card-body {
    padding: var(--space-4) var(--space-6);
}

.card-footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
}
</style>
