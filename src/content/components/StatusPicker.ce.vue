<template>
  <div class="picker-overlay" @click.self="$emit('close')">
    <div class="picker-container" :style="positionStyle">
      <div class="picker-header">Change Status</div>
      <div class="picker-options">
        <button 
          v-for="status in statusList" 
          :key="status.name"
          class="picker-option"
          :class="{ active: currentStatus === status.name }"
          @click="$emit('select', status.name)"
        >
          <span class="status-dot" :style="{ background: status.color }"></span>
          {{ status.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentStatus: {
    type: String,
    default: ''
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  },
  statusColors: {
    type: Object,
    required: true
  }
});

defineEmits(['select', 'close']);

const statusList = computed(() => {
  return Object.entries(props.statusColors).map(([name, color]) => ({
    name,
    color
  })).filter(s => s.name !== 'HasHistory'); // internal status
});

const positionStyle = computed(() => ({
  top: `${props.position.top}px`,
  left: `${props.position.left}px`
}));
</script>

<style lang="scss">
@import '@/assets/styles/tokens/_colors.scss';
@import '@/assets/styles/tokens/_typography.scss';
@import '@/assets/styles/tokens/_shadows.scss';

.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  // Transparent backdrop to catch clicks
}

.picker-container {
  position: absolute;
  background: rgba(20, 20, 25, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px;
  min-width: 180px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
  animation: picker-slide 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@keyframes picker-slide {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.picker-header {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 600;
}

.picker-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.picker-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(255, 255, 255, 0.15);
    font-weight: 500;
  }
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
