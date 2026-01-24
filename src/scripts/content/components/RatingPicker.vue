<template>
  <div class="bmh-rating-picker" @click.stop>
    <div class="bmh-picker-header">Rate (1-10)</div>
    <div class="bmh-rating-grid">
      <button 
        v-for="num in 10" 
        :key="num"
        class="bmh-rating-num" 
        :class="{ 
          active: num === currentRating,
          hovered: num <= hoverValue
        }"
        @mouseenter="hoverValue = num"
        @mouseleave="hoverValue = 0"
        @click="onSelect(num)"
      >
        {{ num }}
      </button>
    </div>
    <button class="bmh-rating-clear" @click="onSelect(0)">Clear</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  onSelect: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['select']);

const hoverValue = ref(0);
const currentRating = computed(() => props.entry.personalData?.rating || 0);

const onSelect = (rating) => {
  if (props.onSelect) {
    props.onSelect(rating, props.entry);
  }
  emit('select', rating);
};
</script>

<style scoped>
.bmh-rating-picker {
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

.bmh-rating-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.bmh-rating-num {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.bmh-rating-num:hover,
.bmh-rating-num.hovered {
  background: rgba(251, 191, 36, 0.3);
  border-color: #fbbf24;
  color: #fbbf24;
}

.bmh-rating-num.active {
  background: #fbbf24;
  border-color: #fbbf24;
  color: #000;
}

.bmh-rating-clear {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.bmh-rating-clear:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
</style>
