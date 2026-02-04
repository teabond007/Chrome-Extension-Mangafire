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
      :class="{ active: isRunning }" 
      type="button"
      @click="toggle"
    >
      {{ isRunning ? '⏸ Stop' : '▶ Start' }}
    </button>
    
    <div class="bmh-as-speed-control">
      <span class="bmh-as-label">Speed:</span>
      <input 
        type="range" 
        class="bmh-as-speed" 
        min="20" 
        max="400" 
        :value="speed"
        @input="updateSpeed"
      >
      <input 
        type="number" 
        class="bmh-as-speed-input" 
        min="20" 
        max="400" 
        :value="speed"
        @input="updateSpeedFromInput"
        @blur="clampSpeed"
      >
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  initialSpeed: {
    type: Number,
    default: 50
  },
  isRunning: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle', 'speed-change']);

const speed = ref(props.initialSpeed);
const isIdle = ref(true);
let idleTimeout = null;

/**
 * Toggles autoscroll on/off
 */
const toggle = () => {
  emit('toggle');
};

/**
 * Updates speed from slider input
 */
const updateSpeed = (event) => {
  const newVal = parseInt(event.target.value);
  speed.value = newVal;
  emit('speed-change', newVal);
};

/**
 * Updates speed from number input
 */
const updateSpeedFromInput = (event) => {
  const newVal = parseInt(event.target.value) || 20;
  speed.value = newVal;
  emit('speed-change', newVal);
};

/**
 * Clamps speed value within valid range on blur
 */
const clampSpeed = () => {
  speed.value = Math.max(20, Math.min(400, speed.value));
  emit('speed-change', speed.value);
};

/**
 * Handles mouse entering the panel
 */
const handleMouseEnter = () => {
  isIdle.value = false;
  if (idleTimeout) {
    clearTimeout(idleTimeout);
    idleTimeout = null;
  }
};

/**
 * Handles mouse leaving the panel
 */
const handleMouseLeave = () => {
  idleTimeout = setTimeout(() => {
    isIdle.value = true;
  }, 2000);
};

onMounted(() => {
  // Start in idle state after 3 seconds
  idleTimeout = setTimeout(() => {
    isIdle.value = true;
  }, 3000);
});

onUnmounted(() => {
  if (idleTimeout) {
    clearTimeout(idleTimeout);
  }
});
</script>

<style scoped>
.bmh-autoscroll-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  pointer-events: auto;
  transition: opacity 0.3s ease;
  opacity: 1;
}

.bmh-autoscroll-panel.is-idle {
  opacity: 0.4;
}

.bmh-autoscroll-panel.is-idle:hover {
  opacity: 1;
}

.bmh-as-toggle {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  min-width: 70px;
  transition: background 0.2s;
}

.bmh-as-toggle:hover {
  background: #4338ca;
}

.bmh-as-toggle.active {
  background: #dc2626;
}

.bmh-as-toggle.active:hover {
  background: #b91c1c;
}

.bmh-as-speed-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bmh-as-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
}

.bmh-as-speed {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.bmh-as-speed::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
}

.bmh-as-speed-input {
  width: 42px;
  padding: 4px 6px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  text-align: center;
}

.bmh-as-speed-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
}

/* Hide number input spinners */
.bmh-as-speed-input::-webkit-inner-spin-button,
.bmh-as-speed-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.bmh-as-speed-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>

