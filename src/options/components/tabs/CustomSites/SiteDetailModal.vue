<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-panel">
            <div class="modal-header">
                <h2>{{ site.name }}</h2>
                <button class="close-btn" @click="$emit('close')">✕</button>
            </div>
            
            <div class="modal-body">
                <div class="section">
                    <h3>📍 Selectors</h3>
                    <div class="selector-groups">
                        <div v-for="(group, idx) in normalizedSelectors" :key="idx" class="selector-group">
                            <h4 v-if="Array.isArray(site.selectors) && site.selectors.length > 1">Variant {{ idx + 1 }}</h4>
                            <div class="selector-grid">
                                <div class="selector-item">
                                    <label>Card</label>
                                    <code>{{ group.card || '(not set)' }}</code>
                                </div>
                                <div class="selector-item">
                                    <label>Title</label>
                                    <code>{{ group.title || '(not set)' }}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>📖 Reader Selectors</h3>
                    <p class="section-hint">Used to detect reader pages and extract progress (title + chapter).</p>
                    <div class="selector-grid selector-grid-3">
                        <div class="selector-item">
                            <label>Detect Page</label>
                            <code>{{ site.readerSelectors?.readerDetect || '(not set)' }}</code>
                        </div>
                        <div class="selector-item">
                            <label>Reader Title</label>
                            <code>{{ site.readerSelectors?.readerTitle || '(not set)' }}</code>
                        </div>
                        <div class="selector-item">
                            <label>Chapter</label>
                            <code>{{ site.readerSelectors?.readerChapter || '(not set)' }}</code>
                        </div>
                    </div>
                </div>

            </div>

            <div class="modal-footer">
                <button class="btn btn-primary" @click="$emit('edit', site)">
                    ✏️ Re-select Elements
                </button>
                <button class="btn btn-secondary" @click="$emit('close')">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    site: Object
});

const emit = defineEmits(['close', 'edit']);

const normalizedSelectors = computed(() => {
    if (!props.site.selectors) return [];
    return Array.isArray(props.site.selectors) ? props.site.selectors : [props.site.selectors];
});
</script>

<style scoped lang="scss">
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-panel {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg, 16px);
        width: 90%;
        max-width: 560px;
        max-height: 80vh;
        overflow-y: auto;

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);

            h2 {
                margin: 0;
                font-size: 18px;
                color: var(--text-primary);
            }

            .close-btn {
                background: transparent;
                border: none;
                color: var(--text-secondary);
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.2s;

                &:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
            }
        }

        .modal-body {
            padding: 24px;

            .section {
                margin-bottom: 24px;

                h3 {
                    font-size: 14px;
                    margin: 0 0 12px 0;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .section-hint {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin: 0 0 12px 0;
                }

                .selector-groups {
                    .selector-group {
                        margin-bottom: 16px;
                        padding-bottom: 16px;
                        border-bottom: 1px dashed var(--border-color);

                        &:last-child {
                            border-bottom: none;
                            margin-bottom: 0;
                            padding-bottom: 0;
                        }

                        h4 {
                            font-size: 11px;
                            margin: 0 0 8px 0;
                            color: var(--text-muted);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                    }
                }

                .selector-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;

                    &.selector-grid-3 {
                        grid-template-columns: 1fr 1fr 1fr;
                    }

                    .selector-item {
                        background: var(--bg-body);
                        border: 1px solid var(--border-color);
                        border-radius: var(--radius-sm);
                        padding: 10px 12px;

                        label {
                            display: block;
                            font-size: 11px;
                            font-weight: 600;
                            color: var(--text-secondary);
                            margin-bottom: 4px;
                        }

                        code {
                            font-size: 11px;
                            color: #6AD2FF;
                            word-break: break-all;
                        }
                    }
                }
            }

        }

        .modal-footer {
            display: flex;
            gap: 12px;
            padding: 16px 24px;
            border-top: 1px solid var(--border-color);
            justify-content: flex-end;
        }
    }
}
</style>
