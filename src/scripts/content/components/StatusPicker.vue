<template>
  <div class="bmh-status-picker" @click.stop>
    <div class="bmh-picker-header">Change Status</div>
    <div class="bmh-picker-options">
      <button 
        v-for="status in allStatuses" 
        :key="status.name"
        class="bmh-picker-option" 
        :class="{ active: entry.status === status.name }"
        @click="onSelect(status.name)"
      >
        <span class="bmh-picker-dot" :style="{ background: status.color }"></span>
        {{ status.name }}
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
  customStatuses: {
    type: Array,
    default: () => []
  },
  onSelect: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['select']);

const defaultStatuses = [
  { name: 'Reading', color: '#4ade80' },
  { name: 'Completed', color: '#60a5fa' },
  { name: 'Plan to Read', color: '#fbbf24' },
  { name: 'On-Hold', color: '#f97316' },
  { name: 'Dropped', color: '#ef4444' },
  { name: 'Re-reading', color: '#a855f7' }
];

const allStatuses = computed(() => {
  return [...defaultStatuses, ...props.customStatuses];
});

const onSelect = (statusName) => {
  if (props.onSelect) {
    props.onSelect(statusName, props.entry);
  }
  emit('select', statusName);
};
</script>

<style scoped>
.bmh-status-picker {
  position: absolute;
  background: rgba(20, 20, 25, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px;
  min-width: 180px;
  z-index: 10000;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
  animation: bmh-picker-slide 0.2s ease-out;
}

@keyframes bmh-picker-slide {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.bmh-picker-header {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.bmh-picker-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bmh-picker-option {
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
}

.bmh-picker-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.bmh-picker-option.active {
  background: rgba(255, 255, 255, 0.15);
}

.bmh-picker-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
