<template>
  <div class="bmh-autoscroll-panel" @click.stop>
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
        max="200" 
        :value="speed"
        @input="updateSpeed"
      >
      <span class="bmh-as-speed-value">{{ speed }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

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

const toggle = () => {
  emit('toggle');
};

const updateSpeed = (event) => {
  const newVal = parseInt(event.target.value);
  speed.value = newVal;
  emit('speed-change', newVal);
};
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

.bmh-as-speed-value {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  min-width: 24px;
}
</style>
