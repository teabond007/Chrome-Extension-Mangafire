<!--
  Platforms Tab
  
  Configure supported platforms and site-specific settings.
-->

<template>
    <div class="tab-content">
        <GlassCard title="Supported Platforms" subtitle="Manage which sites the extension runs on">
            <div class="platforms-list">
                <div v-for="platform in platformList" :key="platform.id" class="platform-item">
                    <div class="platform-info">
                        <span class="platform-icon">{{ platform.icon }}</span>
                        <div class="platform-details">
                            <span class="platform-name">{{ platform.name }}</span>
                            <a :href="platform.url" target="_blank" class="platform-link">{{ platform.domain }}</a>
                        </div>
                    </div>
                    
                    <div class="platform-controls">
                        <!-- 
                          Note: Platform enabling/disabling might require content script changes 
                          or just 'ignoring' in extension logic. 
                          For now, we store the preference.
                        -->
                        <BaseToggle 
                            :model-value="getPlatformEnabled(platform.id)" 
                            @update:model-value="(val) => setPlatformEnabled(platform.id, val)" 
                        />
                    </div>
                </div>
            </div>
        </GlassCard>
        
        <GlassCard title="Platform Settings" subtitle="Site-specific configuration">
             <p class="placeholder-text">Individual platform configurations (selectors, delays) will be available here.</p>
        </GlassCard>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettings } from '@/composables/useSettings';
import GlassCard from '@/components/GlassCard.vue';
import BaseToggle from '@/components/BaseToggle.vue';
import { PLATFORMS } from '@/core/storage-schema';

const { platforms, updateSetting } = useSettings();

// Metadata for platforms (could be moved to a config/constants file)
const PLATFORM_META = {
    mangafire: { name: 'MangaFire', icon: '🔥', domain: 'mangafire.to', url: 'https://mangafire.to' },
    mangadex: { name: 'MangaDex', icon: '📖', domain: 'mangadex.org', url: 'https://mangadex.org' },
    webtoons: { name: 'Webtoons', icon: '🟢', domain: 'webtoons.com', url: 'https://www.webtoons.com' },
    asurascans: { name: 'Asura Scans', icon: '⚔️', domain: 'asuracomic.net', url: 'https://asuracomic.net' },
    mangaplus: { name: 'MangaPlus', icon: '➕', domain: 'mangaplus.shueisha.co.jp', url: 'https://mangaplus.shueisha.co.jp' },
    manganato: { name: 'Manganato', icon: '📓', domain: 'manganato.com', url: 'https://manganato.com' }
};

const platformList = computed(() => {
    return PLATFORMS.map(id => ({
        id,
        ...PLATFORM_META[id] || { name: id, icon: '🌐', domain: id, url: '#' }
    }));
});

function getPlatformEnabled(id) {
    // Default to true if not set
    return platforms.value[id]?.enabled ?? true;
}

function setPlatformEnabled(id, value) {
    updateSetting(`platforms.${id}.enabled`, value);
}
</script>

<style lang="scss" scoped>
.tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}

.platforms-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.platform-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    transition: all 0.2s ease;
    
    &:hover {
        background: var(--color-bg-surface);
        border-color: var(--color-text-muted);
    }
}

.platform-info {
    display: flex;
    align-items: center;
    gap: var(--space-4);
}

.platform-icon {
    font-size: var(--text-xl);
}

.platform-details {
    display: flex;
    flex-direction: column;
}

.platform-name {
    font-weight: 600;
    color: var(--color-text-primary);
}

.platform-link {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-decoration: none;
    
    &:hover {
        color: var(--color-primary);
        text-decoration: underline;
    }
}

.placeholder-text {
    color: var(--color-text-muted);
    font-style: italic;
}
</style>
