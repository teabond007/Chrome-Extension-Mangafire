<template>
  <div class="autoscroll-panel" :class="{ 'is-dragging': isDragging }">
    <button 
      class="toggle-btn" 
      :class="{ active: isRunning }"
      @click="toggle"
      title="Space to toggle"
    >
      {{ isRunning ? '⏸ Stop' : '▶ Start' }}
    </button>
    
    <div class="speed-control">
      <span class="label">Speed</span>
      <input 
        type="range" 
        class="speed-slider" 
        min="10" 
        max="300" 
        :value="speed" 
        @input="updateSpeed"
      >
      <span class="value">{{ speed }}</span>
    </div>

    <div class="drag-handle" @mousedown="startDrag">⋮</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  initialSpeed: { type: Number, default: 50 },
  initialState: { type: Boolean, default: false }
});

const emit = defineEmits(['update:speed', 'toggle']);

const speed = ref(props.initialSpeed);
const isRunning = ref(props.initialState);
const isDragging = ref(false);

const toggle = () => {
  isRunning.value = !isRunning.value;
  emit('toggle', isRunning.value);
};

const updateSpeed = (event) => {
  const val = parseInt(event.target.value);
  speed.value = val;
  emit('update:speed', val);
};

// Draggable Logic
let startX, startY, initialLeft, initialTop;
const panelRef = ref(null);

const startDrag = (e) => {
  isDragging.value = true;
  // Get the host element (because we are in shadow DOM)
  const host = e.target.getRootNode().host;
  
  startX = e.clientX;
  startY = e.clientY;
  const rect = host.getBoundingClientRect();
  initialLeft = rect.left;
  initialTop = rect.top;

  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  
  const host = e.target.getRootNode().host || e.target.closest('bmh-autoscroll-panel'); // Fallback
  if(host) {
      host.style.left = `${initialLeft + dx}px`;
      host.style.top = `${initialTop + dy}px`;
      host.style.bottom = 'auto'; // clear default bottom/right
      host.style.right = 'auto';
  }
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

// Expose methods for external control (e.g., keybinds)
defineExpose({
  toggle,
  setSpeed: (val) => { speed.value = val; emit('update:speed', val); }
});
</script>

<style lang="scss">
@import '@/assets/styles/tokens/_colors.scss';
@import '@/assets/styles/tokens/_typography.scss';

.autoscroll-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(15, 15, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
  user-select: none;
  transition: box-shadow 0.2s;

  &.is-dragging {
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.2);
    cursor: grabbing;
  }
}

.toggle-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-width: 80px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
  }
  
  &.active {
    background: #dc2626; // Red for stop
    
    &:hover {
      background: #b91c1c;
    }
  }
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  font-weight: 600;
}

.speed-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.1s;
    
    &:hover {
      transform: scale(1.2);
    }
  }
}

.value {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  width: 24px;
  text-align: right;
  color: rgba(255, 255, 255, 0.9);
}

.drag-handle {
  color: rgba(255, 255, 255, 0.3);
  font-size: 18px;
  cursor: grab;
  padding: 0 4px;
  
  &:hover {
    color: #fff;
  }
}
</style>
