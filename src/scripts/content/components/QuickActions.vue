<template>
  <div class="bmh-quick-tooltip" :data-entry-id="entry.slug || entry.id || ''">
    <!-- Continue Reading Button -->
    <button 
      class="bmh-tt-btn bmh-tt-continue" 
      :class="{ 'bmh-btn-disabled': !hasHistory }"
      @click.stop.prevent="onAction('continue', $event)"
      :title="continueTitle"
    >
      ▶
    </button>

    <!-- Status Picker Toggle -->
    <button 
      class="bmh-tt-btn bmh-tt-status" 
      @click.stop.prevent="onAction('status', $event)"
      :title="entry.status || 'Set Status'"
      :style="{ '--status-color': statusColor }"
    >
      <span class="bmh-tt-status-dot" :style="{ background: statusColor }"></span>
    </button>

    <!-- Rating Picker Toggle -->
    <button 
      class="bmh-tt-btn bmh-tt-rating" 
      @click.stop.prevent="onAction('rating', $event)"
      :title="`Rating: ${currentRating}/10`"
    >
      {{ currentRating > 0 ? currentRating : '★' }}
    </button>

    <!-- Details Button -->
    <button 
      class="bmh-tt-btn bmh-tt-info" 
      @click.stop.prevent="onAction('details', $event)"
      title="View Details"
    >
      ℹ
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  adapter: {
    type: Object,
    required: true
  },
  callbacks: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['action']);

const hasHistory = computed(() => {
  const lastRead = parseFloat(props.entry.lastReadChapter) || 0;
  return lastRead > 0;
});

const unitName = computed(() => props.adapter.unitName === 'episode' ? 'Ep.' : 'Ch.');

const nextChapter = computed(() => {
  const lastRead = parseFloat(props.entry.lastReadChapter) || 0;
  return Math.floor(lastRead) + 1;
});

const continueTitle = computed(() => {
  return hasHistory.value 
    ? `Continue ${unitName.value} ${nextChapter.value}` 
    : `Start Reading ${unitName.value} 1`;
});

const currentRating = computed(() => props.entry.personalData?.rating || 0);

const statusColor = computed(() => {
  const statusColors = {
    'reading': '#4ade80',
    'completed': '#60a5fa',
    'plan to read': '#fbbf24',
    'planning': '#fbbf24',
    'on-hold': '#f97316',
    'on hold': '#f97316',
    'dropped': '#ef4444',
    're-reading': '#a855f7',
    'rereading': '#a855f7'
  };

  const normalized = (props.entry.status || '').toLowerCase().trim();
  return statusColors[normalized] || 'rgba(255,255,255,0.3)';
});

const onAction = (action, event) => {
  if (props.callbacks[action]) {
    props.callbacks[action](props.entry, event?.currentTarget);
  }
  emit('action', { action, entry: props.entry, target: event?.currentTarget });
};
</script>

<style scoped>
.bmh-quick-tooltip {
  display: flex;
  gap: 4px;
}

.bmh-tt-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.bmh-tt-btn:hover {
  transform: scale(1.1);
  background: rgba(30, 30, 30, 0.95);
}

.bmh-tt-continue {
  background: linear-gradient(135deg, #4CAF50, #388e3c);
}

.bmh-tt-continue.bmh-btn-disabled {
  background: rgba(80, 80, 80, 0.8);
  opacity: 0.7;
  filter: grayscale(1);
  box-shadow: none;
}

.bmh-tt-continue:not(.bmh-btn-disabled):hover {
  background: linear-gradient(135deg, #66BB6A, #43A047);
}

.bmh-tt-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.bmh-tt-rating {
  font-weight: 700;
  color: #fbbf24;
}

.bmh-tt-info {
  font-size: 14px;
}
</style>
