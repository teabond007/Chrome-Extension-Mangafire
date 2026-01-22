<template>
    <div 
        v-show="isVisible || isClosing"
        ref="root"
        class="stats-dashboard-card glass-card" 
        :class="{ 'visible': isVisible, 'closing': isClosing }"
    >
        <div class="stats-header">
            <h3>Library Statistics</h3>
        </div>
        
        <div class="stats-grid-compact">
            <!-- Row 1: Main Status Stats -->
            <div class="stats-row stats-row-main">
                <div class="stat-item-compact" style="--stat-color: var(--primary)">
                    <span class="stat-value-large">{{ stats.total }}</span>
                    <span class="stat-label-small">Total</span>
                </div>
                <div class="stat-item-compact" style="--stat-color: #00BCD4">
                    <span class="stat-value-large">{{ stats.totalChapters.toLocaleString() }}</span>
                    <span class="stat-label-small">Chapters Read</span>
                </div>
                <div class="stat-item-compact" style="--stat-color: #4CAF50">
                    <span class="stat-value-large">{{ stats.reading }}</span>
                    <span class="stat-label-small">Reading</span>
                </div>
                <div class="stat-item-compact" style="--stat-color: #2196F3">
                    <span class="stat-value-large">{{ stats.completed }}</span>
                    <span class="stat-label-small">Completed</span>
                </div>
                <div class="stat-item-compact" style="--stat-color: #9C27B0">
                    <span class="stat-value-large">{{ stats.planning }}</span>
                    <span class="stat-label-small">Plan to Read</span>
                </div>
                <div class="stat-item-compact" style="--stat-color: #FFC107">
                    <span class="stat-value-large">{{ stats.onhold }}</span>
                    <span class="stat-label-small">On Hold</span>
                </div>
                <div class="stat-item-compact" style="--stat-color: #F44336">
                    <span class="stat-value-large">{{ stats.dropped }}</span>
                    <span class="stat-label-small">Dropped</span>
                </div>
            </div>

            <!-- Row 2: Charts -->
            <div class="stats-row stats-row-charts">
                <!-- Pie Chart: Status Distribution -->
                <div class="chart-container">
                    <span class="chart-title">📊 Status Distribution</span>
                    <svg class="pie-chart-svg" viewBox="0 0 180 180">
                        <circle 
                            v-for="(item, index) in statusDistribution" 
                            :key="item.label"
                            class="pie-slice" 
                            :data-status="item.label" 
                            cx="90" cy="90" r="70" 
                            :stroke="item.color" 
                            :stroke-dasharray="`0 ${circumference}`"
                            :style="{ strokeDashoffset: `-${item.offset}` }"
                        />
                        <circle class="pie-center" cx="90" cy="90" r="45" />
                        <text class="pie-center-text" x="90" y="85" text-anchor="middle" dominant-baseline="middle">{{ stats.total }}</text>
                        <text class="pie-center-label" x="90" y="105" text-anchor="middle">TOTAL</text>
                    </svg>
                    <div class="pie-legend">
                        <div v-for="item in statusDistribution" :key="item.label" class="legend-item">
                            <span class="legend-dot" :style="{ background: item.color }"></span>
                            <span>{{ item.label }} ({{ item.value }})</span>
                        </div>
                    </div>
                </div>

                <!-- Bar Chart: Top Genres -->
                <div class="bar-chart-container">
                    <span class="chart-title">🏷️ Top Genres</span>
                    <div class="bar-chart" v-if="topGenres.length > 0">
                        <div v-for="(genre, index) in topGenres" :key="genre.name" class="bar-item">
                            <span class="bar-label">{{ genre.name }}</span>
                            <div class="bar-track">
                                <div 
                                    class="bar-fill" 
                                    :style="{ width: '0%', background: genreColors[index % genreColors.length] }" 
                                    :data-target-width="genre.percent + '%'"
                                >
                                    <span class="bar-value">{{ genre.count }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-else style="color: var(--text-secondary); font-size: 0.8rem;">No genre data available</p>
                </div>
            </div>

            <!-- Row 3: Activity & Sources -->
            <div class="stats-row stats-row-secondary">
                <div class="stat-group">
                    <h4 class="stat-group-title">📅 Activity</h4>
                    <div class="stat-mini-grid">
                        <div class="stat-mini"><span class="stat-mini-value">{{ activity.readThisWeek }}</span><span class="stat-mini-label">Read This Week</span></div>
                        <div class="stat-mini"><span class="stat-mini-value">{{ activity.readThisMonth }}</span><span class="stat-mini-label">Read This Month</span></div>
                        <div class="stat-mini"><span class="stat-mini-value">{{ activity.addedThisWeek }}</span><span class="stat-mini-label">Added This Week</span></div>
                        <div class="stat-mini"><span class="stat-mini-value">{{ activity.withHistory }}</span><span class="stat-mini-label">With History</span></div>
                    </div>
                </div>
                <div class="stat-group">
                    <h4 class="stat-group-title">🌐 Data Sources</h4>
                    <div class="stat-mini-grid">
                        <div class="stat-mini"><span class="stat-mini-value" style="color: #02A9FF">{{ sources.anilist }}</span><span class="stat-mini-label">AniList</span></div>
                        <div class="stat-mini"><span class="stat-mini-value" style="color: #FF6740">{{ sources.mangadex }}</span><span class="stat-mini-label">MangaDex</span></div>
                        <div class="stat-mini"><span class="stat-mini-value" style="color: #888">{{ sources.noData }}</span><span class="stat-mini-label">No Data</span></div>
                    </div>
                </div>
                <div class="stat-group">
                    <h4 class="stat-group-title">📚 Format</h4>
                    <div class="stat-mini-grid">
                        <div class="stat-mini"><span class="stat-mini-value">{{ formats.manga }}</span><span class="stat-mini-label">Manga</span></div>
                        <div class="stat-mini"><span class="stat-mini-value">{{ formats.manhwa }}</span><span class="stat-mini-label">Manhwa</span></div>
                        <div class="stat-mini"><span class="stat-mini-value">{{ formats.manhua }}</span><span class="stat-mini-label">Manhua</span></div>
                    </div>
                </div>
                
                <!-- Progress Ring -->
                <div class="progress-ring-container">
                    <svg class="progress-ring-svg" viewBox="0 0 60 60">
                        <circle class="progress-ring-bg" cx="30" cy="30" r="24" />
                        <circle 
                            class="progress-ring-fill" 
                            cx="30" cy="30" r="24" 
                            :stroke-dasharray="ringCircumference" 
                            :stroke-dashoffset="ringCircumference"
                        />
                    </svg>
                    <div class="progress-ring-info">
                        <span class="progress-ring-value">{{ stats.completionRate }}%</span>
                        <span class="progress-ring-label">Completion Rate</span>
                    </div>
                </div>
            </div>

            <!-- Row 4: Quick Stats Bar -->
            <div class="stats-row stats-row-bar">
                <div class="stat-bar-item">⭐ Avg Score: <strong>{{ stats.avgScore > 0 ? stats.avgScore + '%' : 'N/A' }}</strong></div>
                <div class="stat-bar-item">📖 {{ Math.round(stats.totalChapters / Math.max(stats.completed, 1)) }} ch/completed manga</div>
                <div class="stat-bar-item">📈 {{ stats.completionRate }}% completion rate</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
    entries: {
        type: Array,
        required: true
    },
    isVisible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const isClosing = ref(false);
const root = ref(null);

const circumference = 2 * Math.PI * 70;
const ringCircumference = 2 * Math.PI * 24;
const genreColors = ['#7551FF', '#6B46C1', '#805AD5', '#9F7AEA', '#B794F4', '#D6BCFA'];

// Statistics Calculation
const stats = computed(() => {
    const total = props.entries.length;
    if (total === 0) return { total: 0, totalChapters: 0, reading: 0, completed: 0, planning: 0, onhold: 0, dropped: 0, avgScore: 0, completionRate: 0 };

    const reading = props.entries.filter(e => e.status === 'Reading').length;
    const completed = props.entries.filter(e => e.status === 'Completed').length;
    const planning = props.entries.filter(e => e.status === 'Plan to Read').length;
    const onhold = props.entries.filter(e => e.status === 'On Hold').length;
    const dropped = props.entries.filter(e => e.status === 'Dropped').length;
    const totalChapters = props.entries.reduce((sum, e) => sum + (parseInt(e.readChapters) || 0), 0);
    
    const scoredEntries = props.entries.filter(e => e.anilistData?.averageScore);
    const avgScore = scoredEntries.length > 0 
        ? Math.round(scoredEntries.reduce((sum, e) => sum + e.anilistData.averageScore, 0) / scoredEntries.length)
        : 0;

    const completionRate = Math.round((completed / total) * 100);

    return { total, totalChapters, reading, completed, planning, onhold, dropped, avgScore, completionRate };
});

const statusDistribution = computed(() => {
    if (stats.value.total === 0) return [];
    
    const data = [
        { label: 'Reading', value: stats.value.reading, color: '#4CAF50' },
        { label: 'Completed', value: stats.value.completed, color: '#2196F3' },
        { label: 'Planning', value: stats.value.planning, color: '#9C27B0' },
        { label: 'On Hold', value: stats.value.onhold, color: '#FFC107' },
        { label: 'Dropped', value: stats.value.dropped, color: '#F44336' }
    ].filter(d => d.value > 0);

    let offset = 0;
    return data.map(d => {
        const percent = d.value / stats.value.total;
        const dashLen = circumference * percent;
        const currentOffset = offset;
        offset += dashLen;
        return { ...d, dashLen, offset: currentOffset };
    });
});

const topGenres = computed(() => {
    const genreCounts = {};
    props.entries.forEach(e => {
        (e.anilistData?.genres || []).forEach(g => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
    });
    
    const sorted = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
    return sorted.map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / maxCount) * 100)
    }));
});

const activity = computed(() => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    return {
        readThisWeek: props.entries.filter(e => e.lastRead && (now - e.lastRead) < oneWeek).length,
        readThisMonth: props.entries.filter(e => e.lastRead && (now - e.lastRead) < oneMonth).length,
        addedThisWeek: props.entries.filter(e => e.lastUpdated && (now - e.lastUpdated) < oneWeek).length,
        withHistory: props.entries.filter(e => e.readChapters && e.readChapters > 0).length
    };
});

const sources = computed(() => {
    return {
        anilist: props.entries.filter(e => e.anilistData && !e.anilistData.source).length,
        mangadex: props.entries.filter(e => e.anilistData?.source === 'MANGADEX').length,
        noData: props.entries.filter(e => !e.anilistData || e.anilistData.status === 'NOT_FOUND').length
    };
});

const formats = computed(() => {
    return {
        manga: props.entries.filter(e => e.anilistData?.format === 'MANGA' || !e.anilistData?.format).length,
        manhwa: props.entries.filter(e => e.anilistData?.format === 'Manhwa' || e.anilistData?.countryOfOrigin === 'KR').length,
        manhua: props.entries.filter(e => e.anilistData?.format === 'Manhua' || e.anilistData?.countryOfOrigin === 'CN').length
    };
});

const runEntranceAnimations = async () => {
    // Use window.anime as fallback for global anime.js
    const animeLib = typeof anime !== 'undefined' ? anime : window.anime;
    
    console.log('[Stats] Animation trigger - anime available:', !!animeLib);
    
    if (!animeLib) {
        console.warn('[Stats] anime.js not found, skipping animations');
        return;
    }
    
    await nextTick();
    
    console.log('[Stats] After nextTick - root.value:', !!root.value);
    
    if (!root.value) {
        console.warn('[Stats] root ref is null after nextTick');
        return;
    }

    const pieSlices = root.value.querySelectorAll('.pie-slice');
    const barFills = root.value.querySelectorAll('.bar-fill');
    const ring = root.value.querySelector('.progress-ring-fill');
    
    console.log('[Stats] Found elements - pieSlices:', pieSlices.length, 'barFills:', barFills.length, 'ring:', !!ring);

    // Reset elements state before animating
    pieSlices.forEach(slice => {
        slice.setAttribute('stroke-dasharray', `0 ${circumference}`);
    });
    barFills.forEach(bar => {
        bar.style.width = '0%';
    });
    if (ring) {
        ring.setAttribute('stroke-dashoffset', ringCircumference);
    }

    animeLib({
        targets: root.value.querySelectorAll('.stat-item-compact, .stat-group, .stat-bar-item, .chart-container, .bar-chart-container, .progress-ring-container'),
        opacity: [0, 1],
        translateY: [15, 0],
        delay: animeLib.stagger(40),
        duration: 600,
        easing: 'easeOutQuart'
    });

    setTimeout(() => {
        const animeRef = typeof anime !== 'undefined' ? anime : window.anime;
        if (!animeRef) return;
        statusDistribution.value.forEach((d, i) => {
            const slice = pieSlices[i];
            if (!slice) return;
            animeRef({
                targets: slice,
                strokeDasharray: [`0 ${circumference}`, `${d.dashLen} ${circumference - d.dashLen}`],
                duration: 1000,
                delay: i * 100,
                easing: 'easeOutQuart'
            });
        });
    }, 300);

    setTimeout(() => {
        const animeRef = typeof anime !== 'undefined' ? anime : window.anime;
        if (!animeRef) return;
        topGenres.value.forEach((g, i) => {
            const bar = barFills[i];
            if (!bar) return;
            animeRef({
                targets: bar,
                width: ['0%', g.percent + '%'],
                duration: 800,
                delay: i * 80,
                easing: 'easeOutQuart'
            });
        });
    }, 500);

    setTimeout(() => {
        if (ring) {
            const animeRef = typeof anime !== 'undefined' ? anime : window.anime;
            if (!animeRef) return;
            const targetOffset = ringCircumference - (ringCircumference * stats.value.completionRate / 100);
            animeRef({
                targets: ring,
                strokeDashoffset: [ringCircumference, targetOffset],
                duration: 1200,
                easing: 'easeOutQuart'
            });
        }
    }, 400);
};

const runExitAnimations = () => {
    const animeLib = typeof anime !== 'undefined' ? anime : window.anime;
    
    if (!animeLib || !root.value) {
        isClosing.value = false;
        return;
    }

    const pieSlices = root.value.querySelectorAll('.pie-slice');
    const barFills = root.value.querySelectorAll('.bar-fill');
    const ring = root.value.querySelector('.progress-ring-fill');

    animeLib({
        targets: barFills,
        width: '0%',
        duration: 300,
        easing: 'easeInQuart'
    });

    animeLib({
        targets: pieSlices,
        strokeDasharray: `0 ${circumference}`,
        duration: 400,
        easing: 'easeInQuart'
    });

    if (ring) {
        animeLib({
            targets: ring,
            strokeDashoffset: ringCircumference,
            duration: 400,
            easing: 'easeInQuart'
        });
    }

    animeLib({
        targets: root.value.querySelectorAll('.stat-item-compact, .stat-group, .stat-bar-item, .chart-container, .bar-chart-container, .progress-ring-container'),
        opacity: [1, 0],
        translateY: [0, -10],
        delay: animeLib.stagger(20, { direction: 'reverse' }),
        duration: 300,
        easing: 'easeInQuart',
        complete: () => {
            isClosing.value = false;
        }
    });
};

watch(() => props.isVisible, (newVal, oldVal) => {
    console.log('[Stats] Watch triggered - isVisible changed:', oldVal, '->', newVal);
    if (newVal) {
        isClosing.value = false;
        // Use requestAnimationFrame + setTimeout to ensure parent tab is visible
        requestAnimationFrame(() => {
            setTimeout(() => {
                console.log('[Stats] Starting entrance animations after delay');
                runEntranceAnimations();
            }, 50);
        });
    } else {
        isClosing.value = true;
        runExitAnimations();
    }
});

onMounted(() => {
    console.log('[Stats] Component MOUNTED - isVisible:', props.isVisible);
    if (props.isVisible) {
        runEntranceAnimations();
    }
});
</script>

<style scoped>
/* Library Statistics Dashboard Styles - migrated from _library-statistics.css */

.stats-dashboard-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.stats-dashboard-card.visible {
    display: block !important;
    animation: slideDown 0.3s ease-out;
}

.stats-dashboard-card.closing {
    display: block !important;
    animation: slideUp 0.3s ease-in forwards;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
}

.stats-header h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: var(--text-primary);
}

.stats-grid-compact {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.stats-row-main {
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
}

.stats-row-secondary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
}

.stats-row-bar {
    display: flex;
    justify-content: center;
    gap: 24px;
    padding-top: 12px;
    flex-wrap: wrap;
}

.stat-item-compact {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 90px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    text-align: center;
}

.stat-item-compact::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--stat-color, var(--accent-primary));
    border-radius: 12px 12px 0 0;
}

.stat-item-compact:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--stat-color, var(--accent-primary));
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-value-large {
    display: block;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--stat-color, var(--accent-primary));
    line-height: 1.2;
}

.stat-label-small {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
}

.stat-group {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 14px;
}

.stat-group-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 6px;
}

.stat-mini-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.stat-mini {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    transition: all 0.2s;
}

.stat-mini:hover {
    background: rgba(255, 255, 255, 0.08);
}

.stat-mini-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
}

.stat-mini-label {
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 2px;
    text-align: center;
}

.stat-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.stat-tag {
    background: rgba(117, 81, 255, 0.15);
    color: var(--accent-primary);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s;
}

.stat-tag:hover {
    background: rgba(117, 81, 255, 0.25);
    transform: scale(1.05);
}

.stat-bar-item {
    font-size: 0.85rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
}

.stat-bar-item strong {
    color: var(--text-primary);
    font-weight: 600;
}

/* Charts Row */
.stats-row-charts {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
}

.chart-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chart-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.pie-chart-svg {
    width: 180px;
    height: 180px;
}

.pie-slice {
    fill: none;
    stroke-width: 35;
    stroke-linecap: butt;
    transition: all 0.3s ease;
    cursor: pointer;
}

.pie-slice:hover {
    stroke-width: 40;
    filter: brightness(1.2);
}

.pie-center {
    fill: var(--bg-card);
}

.pie-center-text {
    font-size: 1.8rem;
    font-weight: 700;
    fill: var(--text-primary);
}

.pie-center-label {
    font-size: 0.7rem;
    fill: var(--text-secondary);
    text-transform: uppercase;
}

.pie-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.02);
}

.legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

/* Bar Chart */
.bar-chart-container {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
}

.bar-chart {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.bar-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.bar-label {
    min-width: 80px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: right;
}

.bar-track {
    flex: 1;
    height: 24px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
}

.bar-fill {
    height: 100%;
    border-radius: 12px;
    position: relative;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    min-width: fit-content;
}

.bar-value {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Progress Ring */
.progress-ring-container {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 12px;
}

.progress-ring-svg {
    width: 60px;
    height: 60px;
    transform: rotate(-90deg);
}

.progress-ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 6;
}

.progress-ring-fill {
    fill: none;
    stroke: var(--accent-primary);
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s ease-out;
}

.progress-ring-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.progress-ring-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
}

.progress-ring-label {
    font-size: 0.7rem;
    color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
    .stats-row-main {
        justify-content: center;
    }
    .stat-item-compact {
        min-width: 80px;
        padding: 10px 12px;
    }
    .stat-value-large {
        font-size: 1.3rem;
    }
    .stats-row-secondary {
        grid-template-columns: 1fr;
    }
    .stats-row-charts {
        grid-template-columns: 1fr;
    }
}
</style>
