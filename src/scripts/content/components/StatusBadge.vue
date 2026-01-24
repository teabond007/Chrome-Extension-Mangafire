<template>
  <div 
    class="bmh-badge" 
    :class="[`bmh-badge-${type}`]"
    :style="positionStyle"
  >
    {{ text }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String, // 'progress' or 'new'
    default: 'progress'
  },
  position: {
    type: Object,
    default: () => ({})
  }
});

const positionStyle = computed(() => {
  const styles = { ...props.position };
  if (!Object.keys(styles).length) {
    if (props.type === 'new') {
      return { top: '4px', right: '4px' };
    }
    return { bottom: '4px', left: '4px' };
  }
  return styles;
});
</script>

<style scoped>
.bmh-badge {
  position: absolute;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  z-index: 50;
  pointer-events: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.bmh-badge-progress {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bmh-badge-new {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  animation: bmh-pulse 2s infinite;
}

@keyframes bmh-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}
</style>
