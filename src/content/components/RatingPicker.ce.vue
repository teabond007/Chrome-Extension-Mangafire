<template>
  <div class="picker-overlay" @click.self="$emit('close')">
    <div class="picker-container" :style="positionStyle">
      <div class="picker-header">Rate (1-10)</div>
      
      <div class="rating-grid">
        <button 
          v-for="num in 10" 
          :key="num"
          class="rating-num"
          :class="{ 
            active: currentRating === num,
            hovered: hoveredRating !== null && num <= hoveredRating 
          }"
          @mouseenter="hoveredRating = num"
          @click="$emit('select', num)"
        >
          {{ num }}
        </button>
      </div>

      <button class="rating-clear" @click="$emit('select', 0)">
        Clear Rating
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  currentRating: {
    type: Number,
    default: 0
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  }
});

defineEmits(['select', 'close']);

const hoveredRating = ref(null);

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
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 600;
}

.rating-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.rating-num {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;

  &:hover,
  &.hovered {
    background: rgba(251, 191, 36, 0.3);
    border-color: #fbbf24;
    color: #fbbf24;
  }

  &.active {
    background: #fbbf24;
    border-color: #fbbf24;
    color: #000;
  }
}

.rating-clear {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
}
</style>
