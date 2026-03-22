<template>
  <div class="notes-editor-container">
    <textarea 
      v-model="localNotes" 
      class="notes-textarea" 
      :placeholder="placeholder" 
      :rows="rows" 
      @input="handleInput"
      @blur="handleBlur"
    ></textarea>
    <span class="notes-char-count" :class="{ 'at-limit': localNotes.length >= maxLength }">
      {{ localNotes.length }}/{{ maxLength }}
    </span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Add personal notes...'
  },
  maxLength: {
    type: Number,
    default: 500
  },
  rows: {
    type: Number,
    default: 3
  },
  debounceMs: {
    type: Number,
    default: 500
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const localNotes = ref(props.modelValue);
let saveTimeout = null;

watch(() => props.modelValue, (newVal) => {
  localNotes.value = newVal;
});

const handleInput = () => {
  if (localNotes.value.length > props.maxLength) {
    localNotes.value = localNotes.value.slice(0, props.maxLength);
  }
  
  emit('update:modelValue', localNotes.value);
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    emit('save', localNotes.value);
  }, props.debounceMs);
};

const handleBlur = () => {
  clearTimeout(saveTimeout);
  emit('save', localNotes.value);
};
</script>

<style scoped lang="scss">
.notes-editor-container {
  position: relative;

  .notes-textarea {
    width: 100%;
    resize: vertical;
    min-height: 80px;
    padding: 10px;
    border: 1px solid var(--border-color, rgba(255,255,255,0.1));
    border-radius: 8px;
    background: var(--input-bg, rgba(255,255,255,0.05));
    color: var(--text-primary, #fff);
    font-size: 13px;
    line-height: 1.5;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--accent-primary, #7551FF);
      background: var(--input-bg-focus, rgba(255,255,255,0.08));
    }
  }

  .notes-char-count {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 11px;
    color: var(--text-secondary, rgba(255,255,255,0.4));
    pointer-events: none;
    
    &.at-limit {
      color: var(--error, #ff4d4f);
    }
  }
}
</style>
