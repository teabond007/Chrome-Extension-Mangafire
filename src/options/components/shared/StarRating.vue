<template>
  <div class="star-rating-container" @mouseleave="hoverRating = 0">
    <span 
      v-for="i in maxStars" 
      :key="i" 
      class="star-rating-star"
      :class="{ 'full': (hoverRating || modelValue) >= i }"
      @click="updateRating(i)"
      @mouseenter="hoverRating = i"
    >
      {{ (hoverRating || modelValue) >= i ? '★' : '☆' }}
    </span>
    <span v-if="showValue && modelValue > 0" class="star-rating-value">
      {{ modelValue }}/{{ maxStars }}
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  maxStars: {
    type: Number,
    default: 10
  },
  showValue: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const hoverRating = ref(0);

const updateRating = (val) => {
  emit('update:modelValue', val);
  emit('change', val);
};
</script>

<style scoped lang="scss">
.star-rating-container {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;

  .star-rating-star {
    cursor: pointer;
    font-size: 1.1rem;
    transition: transform 0.1s, color 0.15s;
    color: var(--text-secondary, #808080);

    &:hover {
      transform: scale(1.15);
    }

    &.full {
      color: #ffc107;
    }
  }

  .star-rating-value {
    margin-left: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary, #808080);
  }
}
</style>
