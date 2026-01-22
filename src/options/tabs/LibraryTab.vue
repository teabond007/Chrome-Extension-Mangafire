<!--
  Library Tab
  
  Full library management with stats and data actions.
-->

<template>
    <div class="tab-content">
        <!-- Stats Overview -->
        <GlassCard title="Library Statistics" subtitle="Overview of your reading progress">
            <div class="stats-grid">
                <div class="stat-item total">
                    <span class="stat-value">{{ stats.total }}</span>
                    <span class="stat-label">Total Entries</span>
                </div>
                <div class="stat-item reading">
                    <span class="stat-value">{{ stats.reading }}</span>
                    <span class="stat-label">Reading</span>
                </div>
                <div class="stat-item completed">
                    <span class="stat-value">{{ stats.completed }}</span>
                    <span class="stat-label">Completed</span>
                </div>
                <div class="stat-item planned">
                    <span class="stat-value">{{ stats.planToRead }}</span>
                    <span class="stat-label">Plan to Read</span>
                </div>
            </div>
        </GlassCard>

        <!-- Data Management -->
        <GlassCard title="Data Management" subtitle="Backup and restore your library">
            <div class="actions-row">
                <div class="action-info">
                    <h3>Backup & Restore</h3>
                    <p>Export your library to a JSON file or import from a backup.</p>
                </div>
                <div class="action-buttons">
                    <BaseButton variant="secondary" icon="📥" @click="exportLibrary">
                        Export Backup
                    </BaseButton>
                    <BaseButton variant="secondary" icon="📤" @click="triggerImport">
                        Import Backup
                    </BaseButton>
                    <input 
                        type="file" 
                        ref="fileInput" 
                        accept=".json" 
                        style="display: none" 
                        @change="handleImport"
                    >
                </div>
            </div>

            <div class="actions-row danger-zone">
                <div class="action-info">
                    <h3>Danger Zone</h3>
                    <p>Irreversible actions for data management.</p>
                </div>
                <div class="action-buttons">
                    <BaseButton variant="danger" icon="🗑️" @click="confirmClear">
                        Clear Library
                    </BaseButton>
                </div>
            </div>
        </GlassCard>
        
        <!-- Library Preview -->
        <GlassCard title="Library Browser" subtitle="Browse and manage entries">
            <div class="library-controls">
                <div class="search-box">
                    <BaseInput 
                        v-model="searchQuery" 
                        placeholder="Search library..." 
                        icon="🔍"
                    />
                </div>
                <div class="filter-box">
                    <CrystalSelect 
                        v-model="statusFilter" 
                        :options="statusOptions" 
                        placeholder="All Statuses"
                        searchable
                    />
                </div>
            </div>
            
            <div class="entries-preview">
                <div v-if="filteredEntries.length === 0" class="empty-state">
                    No entries found matching your criteria.
                </div>
                <div v-else class="entries-list">
                    <div v-for="entry in filteredEntries.slice(0, 10)" :key="entry.id" class="entry-item">
                        <span class="entry-title">{{ entry.title }}</span>
                        <div class="entry-meta">
                            <span class="entry-source" v-if="entry.source">{{ entry.source }}</span>
                            <span class="entry-status box-badge" :data-status="entry.status">{{ entry.status }}</span>
                        </div>
                    </div>
                    <div v-if="filteredEntries.length > 10" class="more-entries">
                        +{{ filteredEntries.length - 10 }} more entries
                    </div>
                </div>
            </div>
        </GlassCard>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLibrary } from '@/composables/useLibrary';
import { VALID_STATUSES, validateLibraryEntry } from '@/core/storage-schema';
import GlassCard from '@/components/GlassCard.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';
import CrystalSelect from '@/components/CrystalSelect.vue';

const { stats, filteredEntries, searchQuery, statusFilter, clearLibrary, entriesArray, entries } = useLibrary();
const fileInput = ref(null);

const statusOptions = computed(() => [
    { label: 'All Statuses', value: 'ALL' },
    ...VALID_STATUSES.map(s => ({ label: s, value: s }))
]);

const exportLibrary = () => {
    const data = JSON.stringify(entriesArray.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mangafire-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
};

const triggerImport = () => {
    fileInput.value.click();
};

const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                // Validate entries
                const validEntries = data.filter(validateLibraryEntry);
                const skipped = data.length - validEntries.length;
                
                if (confirm(`Found ${validEntries.length} valid entries.${skipped > 0 ? ` (${skipped} skipped)` : ''}\nThis will REPLACE your current library. Are you sure?`)) {
                    entries.value = validEntries;
                    alert('Library imported successfully!');
                }
            } else {
                alert('Invalid backup format: root must be an array.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to parse backup file: ' + err.message);
        }
        // Reset input
        event.target.value = '';
    };
    reader.readAsText(file);
};

const confirmClear = () => {
    if (confirm('Are you sure you want to delete all library entries? This cannot be undone.')) {
        clearLibrary();
    }
};
</script>

<style lang="scss" scoped>
.tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-4);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-4);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    transition: transform 0.2s ease;
    
    &:hover {
        transform: translateY(-2px);
    }
}

.stat-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
}

.stat-label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: var(--space-1);
    text-align: center;
}

.actions-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child {
        border-bottom: none;
    }
    
    &.danger-zone {
        margin-top: var(--space-2);
        
        h3 { color: var(--color-error); }
    }
}

.action-info {
    h3 {
        font-size: var(--text-base);
        font-weight: 600;
        margin-bottom: var(--space-1);
    }
    
    p {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}

.action-buttons {
    display: flex;
    gap: var(--space-3);
}

.library-controls {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    
    .search-box {
        flex: 2;
    }
    
    .filter-box {
        flex: 1;
        min-width: 160px;
    }
}

.entries-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.entry-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    transition: all 0.2s ease;
    
    &:hover {
        border-color: var(--color-primary-muted);
    }
    
    .entry-title {
        font-size: var(--text-sm);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60%;
    }
}

.entry-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.entry-source {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: capitalize;
}

.box-badge {
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 4px;
    font-weight: 600;
    text-transform: uppercase;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    white-space: nowrap;
    
    &[data-status="Reading"] { color: var(--color-primary); border-color: var(--color-primary); }
    &[data-status="Completed"] { color: var(--color-accent); border-color: var(--color-accent); }
    &[data-status="Plan to Read"] { color: var(--color-warning); border-color: var(--color-warning); }
    &[data-status="On-Hold"] { color: var(--color-text-muted); border-color: var(--color-text-muted); }
    &[data-status="Dropped"] { color: var(--color-error); border-color: var(--color-error); }
}

.empty-state, .more-entries {
    text-align: center;
    padding: var(--space-4);
    color: var(--color-text-muted);
    font-style: italic;
    font-size: var(--text-sm);
}
</style>
