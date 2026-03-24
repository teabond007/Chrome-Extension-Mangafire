<template>
  <div 
    class="bmh-autoscroll-panel" 
    :class="{ 'is-idle': isIdle }"
    @click.stop
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <button 
      class="bmh-as-toggle" 
      :class="{ active: localIsRunning }" 
      type="button"
      @click="toggle"
    >
      <span class="bmh-as-icon">{{ localIsRunning ? '⏸' : '▶' }}</span>
      {{ localIsRunning ? 'Stop' : 'Start' }}
    </button>
    
    <div class="bmh-as-speed-control">
      <span class="bmh-as-label">Speed</span>
      <input 
        type="range" 
        class="bmh-as-speed-slider" 
        min="20" 
        max="400" 
        :value="speed"
        @input="onSpeedInput"
      >
      <div class="bmh-as-speed-value-wrapper">
        <input 
          type="number" 
          class="bmh-as-speed-input" 
          min="20" 
          max="400" 
          :value="speed"
          @input="onSpeedInput"
          @blur="onBlur"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  speed: {
    type: Number,
    default: 50
  },
  isRunning: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle', 'speed-change']);

const speed = ref(props.speed);
const localIsRunning = ref(props.isRunning);
const isIdle = ref(false);
let idleTimeout = null;

// Keep local state in sync with prop
watch(() => props.speed, (newVal) => {
  speed.value = newVal;
});
watch(() => props.isRunning, (newVal) => {
  localIsRunning.value = newVal;
});

// Expose setters for direct JS access (fixes Proxy set error)
defineExpose({
  isRunning: localIsRunning,
  speed: speed
});

/**
 * Toggles autoscroll on/off
 */
const toggle = () => {
  emit('toggle');
};

/**
 * Handles speed changes from both inputs
 */
const onSpeedInput = (event) => {
  const newVal = parseInt(event.target.value) || 20;
  speed.value = newVal;
  emit('speed-change', newVal);
};

/**
 * Clamps speed value within valid range on blur
 */
const onBlur = () => {
  const clamped = Math.max(20, Math.min(400, speed.value));
  if (clamped !== speed.value) {
    speed.value = clamped;
    emit('speed-change', clamped);
  }
};

/**
 * Handles mouse entering the panel
 */
const handleMouseEnter = () => {
  isIdle.value = false;
  resetIdleTimer();
};

/**
 * Handles mouse leaving the panel
 */
const handleMouseLeave = () => {
  resetIdleTimer();
};

const resetIdleTimer = () => {
  if (idleTimeout) clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    isIdle.value = true;
  }, 3000);
};

onMounted(() => {
  resetIdleTimer();
});

onUnmounted(() => {
  if (idleTimeout) clearTimeout(idleTimeout);
});
</script>
