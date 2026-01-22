<!--
  New Tab Dashboard App Component
  
  Full-screen manga dashboard featuring:
  - Clock and greeting
  - Continue Reading section
  - Quick access links
  - Search functionality
-->

<template>
    <div class="dashboard-container" v-if="!isLoading && isDashboardEnabled">
        <!-- Background with gradient -->
        <div class="dashboard-bg"></div>
        
        <main class="dashboard-content">
            <!-- Time and Greeting Section -->
            <section class="hero-section">
                <time class="clock">{{ currentTime }}</time>
                <h1 class="greeting">{{ greeting }}</h1>
            </section>
            
            <!-- Search Bar -->
            <section class="search-section">
                <div class="search-wrapper">
                    <input 
                        type="text"
                        class="search-input"
                        placeholder="Search your library..."
                        v-model="localSearch"
                        @keyup.enter="handleSearch"
                    >
                    <button class="search-btn" @click="handleSearch">
                        🔍
                    </button>
                </div>
            </section>
            
            <!-- Continue Reading Section -->
            <section class="continue-section">
                <div class="section-header">
                    <h2 class="section-title">Continue Reading</h2>
                    <button class="btn btn-ghost" @click="openLibrary">
                        View All →
                    </button>
                </div>
                
                <div class="manga-grid">
                    <article 
                        v-for="manga in continueReading" 
                        :key="manga.id"
                        class="manga-card card-interactive"
                        @click="openManga(manga)"
                    >
                        <img 
                            :src="manga.cover" 
                            :alt="manga.title"
                            class="manga-card-image"
                        >
                        <div class="manga-card-overlay">
                            <h3 class="manga-card-title">{{ manga.title }}</h3>
                            <p class="manga-card-progress">
                                Ch. {{ manga.lastChapter }} / {{ manga.totalChapters || '?' }}
                            </p>
                        </div>
                    </article>
                    
                    <div v-if="continueReading.length === 0" class="empty-state">
                        <p>No manga in progress</p>
                        <button class="btn btn-primary" @click="openLibrary">
                            Browse Library
                        </button>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLibrary } from '@/composables/useLibrary';

/** Whether the dashboard is enabled */
const isDashboardEnabled = ref(true);

/** Loading state to prevent flash */
const isLoading = ref(true);

/** Current time display */
const currentTime = ref('');

/** Search query from useLibrary */
const { searchQuery, entriesArray } = useLibrary();

// Local search for dashboard
const localSearch = ref('');

/** Time update interval reference */
let timeInterval = null;

/**
 * Computes greeting based on time of day
 */
const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
});

/**
 * Continue reading list derived from library
 */
const continueReading = computed(() => {
    return entriesArray.value
        .filter(e => e.status === 'Reading' || e.status === 'READING')
        .sort((a, b) => (b.lastReadDate || 0) - (a.lastReadDate || 0))
        .slice(0, 10);
});

/**
 * Updates the current time display
 */
function updateTime() {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Handles search action
 */
function handleSearch() {
    if (!localSearch.value.trim()) return;
    chrome.runtime.openOptionsPage();
}

/**
 * Opens a manga in its reading page
 * @param {Object} manga - Manga entry to open
 */
function openManga(manga) {
    const url = manga.sourceUrl || manga.mangafireUrl || (manga.mangadexId ? `https://mangadex.org/title/${manga.mangadexId}` : null);
    if (url) {
        chrome.tabs.create({ url });
    }
}

/**
 * Opens the library in options page
 */
function openLibrary() {
    chrome.runtime.openOptionsPage();
}

/**
 * Checks if dashboard is enabled and redirects if not
 */
async function checkDashboardEnabled() {
    try {
        const data = await chrome.storage.local.get('NewTabDashboardfeatureEnabled');
        isDashboardEnabled.value = data.NewTabDashboardfeatureEnabled === true;
        
        if (!isDashboardEnabled.value) {
            // Redirect to Google
            window.location.replace('https://www.google.com');
            return;
        }
        
        isLoading.value = false;
    } catch (error) {
        console.error('[NewTab] Error checking dashboard state:', error);
        isLoading.value = false;
    }
}

onMounted(async () => {
    // First check if dashboard is enabled
    await checkDashboardEnabled();
    
    // Only start time updates if dashboard is enabled
    if (isDashboardEnabled.value) {
        updateTime();
        timeInterval = setInterval(updateTime, 1000);
    }
});

onUnmounted(() => {
    if (timeInterval) {
        clearInterval(timeInterval);
    }
});
</script>


<style lang="scss" scoped>
.dashboard-container {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
}

.dashboard-bg {
    position: fixed;
    inset: 0;
    background: 
        radial-gradient(ellipse at 20% 20%, rgba(100, 100, 255, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(180, 100, 255, 0.1) 0%, transparent 50%),
        var(--color-bg-base);
    z-index: -1;
}

.dashboard-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-8);
}

.hero-section {
    text-align: center;
    padding: var(--space-16) 0;
}

.clock {
    display: block;
    font-size: 6rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.greeting {
    font-size: var(--text-2xl);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-top: var(--space-2);
}

.search-section {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-12);
}

.search-wrapper {
    position: relative;
    width: 100%;
    max-width: 600px;
}

.search-input {
    width: 100%;
    padding: var(--space-4) var(--space-6);
    padding-right: var(--space-12);
    font-size: var(--text-lg);
    background: var(--color-glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    
    &:focus {
        border-color: var(--color-primary);
        box-shadow: var(--glow-primary);
    }
}

.search-btn {
    position: absolute;
    right: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--text-xl);
    opacity: 0.6;
    transition: opacity 0.2s;
    
    &:hover {
        opacity: 1;
    }
}

.continue-section {
    margin-top: var(--space-8);
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
}

.section-title {
    font-size: var(--text-xl);
    font-weight: 600;
}

.manga-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-4);
}

.manga-card {
    aspect-ratio: 2/3;
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: relative;
}

.manga-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.manga-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: var(--space-4);
}

.manga-card-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: white;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.manga-card-progress {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--space-12);
    color: var(--color-text-muted);
    
    p {
        margin-bottom: var(--space-4);
    }
}
</style>
