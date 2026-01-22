<template>
  <div class="overlay-container">
    <!-- Compact Tooltip Mode (Default) -->
    <div class="quick-tooltip">
      <!-- Continue Button -->
      <button 
        class="action-btn continue-btn" 
        :class="{ 'disabled': !canContinue }"
        :title="continueTitle"
        @click.stop="$emit('continue')"
      >
        <span class="icon">▶</span>
      </button>

      <!-- Status Button -->
      <button 
        class="action-btn status-btn" 
        :title="status"
        :style="{ '--status-color': statusColor }"
        @click.stop="$emit('open-status', $event)"
      >
        <span class="status-dot"></span>
      </button>

      <!-- Rating Button -->
      <button 
        class="action-btn rating-btn" 
        :title="`Rating: ${rating}/10`"
        @click.stop="$emit('open-rating', $event)"
      >
        {{ rating > 0 ? rating : '★' }}
      </button>

      <!-- Details Button -->
      <button 
        class="action-btn info-btn" 
        title="View Details"
        @click.stop="$emit('details')"
      >
        ℹ
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  statusColors: {
    type: Object,
    default: () => ({
      Reading: '#4ade80',
      Completed: '#60a5fa',
      'Plan to Read': '#fbbf24',
      'On-Hold': '#f97316',
      Dropped: '#ef4444',
      'Re-reading': '#a855f7'
    })
  }
});

const emit = defineEmits(['continue', 'open-status', 'open-rating', 'details']);

const status = computed(() => props.entry.status || 'Plan to Read');
const rating = computed(() => props.entry.personalData?.rating || 0);
const lastChapter = computed(() => props.entry.lastReadChapter ? parseFloat(props.entry.lastReadChapter) : 0);

const canContinue = computed(() => {
  // Always allowed to start if 0, or continue if > 0
  return true; 
});

const nextChapter = computed(() => {
  return lastChapter.value > 0 ? lastChapter.value + 1 : 1;
});

const continueTitle = computed(() => {
  return lastChapter.value > 0 
    ? `Continue Ch. ${nextChapter.value}` 
    : 'Start Reading';
});

const statusColor = computed(() => {
  return props.statusColors[status.value] || '#9ca3af';
});
</script>

<style lang="scss">
// Import tokens explicitly since Shadow DOM isolates styles
@import '@/assets/styles/tokens/_colors.scss';
@import '@/assets/styles/tokens/_typography.scss';
@import '@/assets/styles/tokens/_shadows.scss';

.overlay-container {
  display: contents;
}

.quick-tooltip {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 60;
  pointer-events: none; // Passthrough when hidden

  // Show on hover parent is handled by Host css or JS listener?
  // Custom Element :host can handle display, but :hover state of PARENT card?
  // We might need to make the overlay always visible if we can't detect parent hover easily from Shadow DOM.
  // Actually, usually we inject styles into document to handle hover.
  // OR we rely on the host being hovered?
  // Let's assume opacity is managed by a class '.visible' toggled by the enhancer,
  // OR we just use :host style.
  // For now, let's make it visible by default for testing, or assume parent handles .visible?
}

// Enhancer will likely add 'visible' attribute or class
:host([visible]) .quick-tooltip,
:host(:hover) .quick-tooltip {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  padding: 0;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(30, 30, 30, 0.95);
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
  }
}

.continue-btn {
  background: linear-gradient(135deg, #4CAF50, #388e3c);
  
  &:hover:not(.disabled) {
    background: linear-gradient(135deg, #66BB6A, #43A047);
  }
}

.status-btn {
  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--status-color);
  }
}

.rating-btn {
  color: #fbbf24;
}
</style>
