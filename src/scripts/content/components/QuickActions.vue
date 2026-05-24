<template>
  <div class="bmh-quick-tooltip" :data-entry-id="entry.slug || entry.id || ''">
    <!-- Status Picker Toggle (Always shown) -->
    <button 
      class="bmh-tt-btn bmh-tt-status" 
      @click.stop.prevent="onAction('status', $event)"
      :title="entry.status || 'Set Status'"
      :style="{ '--status-color': statusColor }"
    >
      <span class="bmh-tt-status-dot" :style="{ background: statusColor }"></span>
    </button>

    <!-- Other buttons - only shown if already in library -->
    <template v-if="entry.status && entry.status !== 'Add to Library'">
      <!-- Continue Reading Button -->
      <button 
        class="bmh-tt-btn bmh-tt-continue" 
        :class="{ 'bmh-btn-disabled': !hasHistory }"
        @click.stop.prevent="onAction('continue', $event)"
        :title="continueTitle"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px; display: block; margin-left: 2px;">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>

      <!-- Details Button -->
      <button 
        class="bmh-tt-btn bmh-tt-info" 
        @click.stop.prevent="onAction('details', $event)"
        title="View Details"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { STATUS_COLORS } from '../../../config.js';

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
  console.log("[QuickActions] Checking if entry has reading history...");
  const lastRead = parseFloat(props.entry.lastReadChapter) || 0;
  const result = lastRead > 0;
  console.log("[QuickActions] hasHistory result is: " + result);
  return result;
});

const unitName = computed(() => {
  console.log("[QuickActions] Figuring out unit name from adapter: " + props.adapter.unitName);
  return props.adapter.unitName === 'episode' ? 'Ep.' : 'Ch.';
});

const nextChapter = computed(() => {
  console.log("[QuickActions] Calculating what the next chapter should be...");
  const lastRead = parseFloat(props.entry.lastReadChapter) || 0;
  const next = Math.floor(lastRead) + 1;
  console.log("[QuickActions] nextChapter calculated to: " + next);
  return next;
});

const continueTitle = computed(() => {
  console.log("[QuickActions] Setting the continue reading button tooltip title...");
  const titleText = hasHistory.value 
    ? `Continue ${unitName.value} ${nextChapter.value}` 
    : `Start Reading ${unitName.value} 1`;
  console.log("[QuickActions] continueTitle tooltip text is: " + titleText);
  return titleText;
});

const statusColor = computed(() => {
  console.log("[QuickActions] Finding status color for status: " + props.entry.status);
  const normalized = (props.entry.status || '').toLowerCase().trim();
  
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (normalized === key.toLowerCase() || normalized.includes(key.toLowerCase())) {
      console.log("[QuickActions] Found matched color: " + color + " for key: " + key);
      return color;
    }
  }
  console.log("[QuickActions] No color matched, using transparent fallback.");
  return 'rgba(255,255,255,0.3)';
});

const onAction = (action, event) => {
  console.log("[QuickActions] onAction triggered! action=" + action);
  try {
    if (props.callbacks[action]) {
      console.log("[QuickActions] Triggering parent callback function for action: " + action);
      props.callbacks[action](props.entry, event?.currentTarget);
    } else {
      console.log("[QuickActions] No callback was found for action: " + action);
    }
    console.log("[QuickActions] Emitting custom action event to parent Vue app...");
    emit('action', { action, entry: props.entry, target: event?.currentTarget });
  } catch (err) {
    console.log("[QuickActions] Oh no, an error happened in onAction click handler: " + err);
  }
};
</script>

<style scoped lang="scss">
.bmh-quick-tooltip {
  display: flex;
  gap: 4px;

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
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);

    &:hover {
      transform: scale(1.1);
      background: rgba(30, 30, 30, 0.95);
    }

    &.bmh-tt-continue {
      background: linear-gradient(135deg, #4CAF50, #388e3c);

      &.bmh-btn-disabled {
        background: rgba(80, 80, 80, 0.8);
        opacity: 0.7;
        filter: grayscale(1);
        box-shadow: none;
      }

      &:not(.bmh-btn-disabled):hover {
        background: linear-gradient(135deg, #66BB6A, #43A047);
      }
    }

    &.bmh-tt-info {
      font-size: 14px;
    }
  }

  .bmh-tt-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
}
</style>
