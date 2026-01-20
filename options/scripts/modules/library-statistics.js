/**
 * @fileoverview Library Statistics Module
 * Handles rendering of statistics dashboard with charts and animations.
 * Uses anime.js for smooth visual effects.
 */

/**
 * Renders the statistics dashboard with pie chart, bar chart, and progress ring.
 * @param {HTMLElement} statsGrid - The container to render stats into
 * @param {Array} savedEntries - The library entries array
 * @returns {Object} The calculated stats data
 */
export function renderStatistics(statsGrid, savedEntries) {
    if (!statsGrid || !savedEntries) return null;

    // Calculate comprehensive stats
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    
    // Basic counts
    const total = savedEntries.length;
    const reading = savedEntries.filter(e => e.status === 'Reading').length;
    const completed = savedEntries.filter(e => e.status === 'Completed').length;
    const planning = savedEntries.filter(e => e.status === 'Plan to Read').length;
    const onhold = savedEntries.filter(e => e.status === 'On Hold').length;
    const dropped = savedEntries.filter(e => e.status === 'Dropped').length;
    const chapters = savedEntries.reduce((sum, e) => sum + (parseInt(e.readChapters) || 0), 0);
    
    // Data source stats
    const anilistEntries = savedEntries.filter(e => e.anilistData && !e.anilistData.source).length;
    const mangadexEntries = savedEntries.filter(e => e.anilistData?.source === 'MANGADEX').length;
    const noDataEntries = savedEntries.filter(e => !e.anilistData || e.anilistData.status === 'NOT_FOUND').length;
    
    // Time-based reading activity
    const readThisWeek = savedEntries.filter(e => e.lastRead && (now - e.lastRead) < oneWeek).length;
    const readThisMonth = savedEntries.filter(e => e.lastRead && (now - e.lastRead) < oneMonth).length;
    const addedThisWeek = savedEntries.filter(e => e.lastUpdated && (now - e.lastUpdated) < oneWeek).length;
    
    // Has reading history
    const withHistory = savedEntries.filter(e => e.readChapters && e.readChapters > 0).length;
    
    // Format breakdown
    const manga = savedEntries.filter(e => e.anilistData?.format === 'MANGA' || !e.anilistData?.format).length;
    const manhwa = savedEntries.filter(e => e.anilistData?.format === 'Manhwa' || e.anilistData?.countryOfOrigin === 'KR').length;
    const manhua = savedEntries.filter(e => e.anilistData?.format === 'Manhua' || e.anilistData?.countryOfOrigin === 'CN').length;
    
    // Genre stats (top 6)
    const genreCounts = {};
    savedEntries.forEach(e => {
        (e.anilistData?.genres || []).forEach(g => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
    });
    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
    
    // Average score
    const scoredEntries = savedEntries.filter(e => e.anilistData?.averageScore);
    const avgScore = scoredEntries.length > 0 
        ? Math.round(scoredEntries.reduce((sum, e) => sum + e.anilistData.averageScore, 0) / scoredEntries.length)
        : 0;

    // Pie chart data for status distribution
    const statusData = [
        { label: 'Reading', value: reading, color: '#4CAF50' },
        { label: 'Completed', value: completed, color: '#2196F3' },
        { label: 'Planning', value: planning, color: '#9C27B0' },
        { label: 'On Hold', value: onhold, color: '#FFC107' },
        { label: 'Dropped', value: dropped, color: '#F44336' }
    ].filter(d => d.value > 0);

    // Generate pie chart SVG
    const pieRadius = 70;
    const pieCenter = 90;
    const circumference = 2 * Math.PI * pieRadius;
    let pieOffset = 0;
    
    const piePaths = statusData.map((d) => {
        const percent = total > 0 ? d.value / total : 0;
        const dashLen = circumference * percent;
        const dash = `${dashLen} ${circumference - dashLen}`;
        const offset = pieOffset;
        pieOffset += dashLen;
        return `<circle class="pie-slice" data-status="${d.label}" cx="${pieCenter}" cy="${pieCenter}" r="${pieRadius}" 
                stroke="${d.color}" stroke-dasharray="0 ${circumference}" 
                data-target-dash="${dash}" data-offset="${offset}" 
                style="stroke-dashoffset: -${offset};" />`;
    }).join('');

    // Generate bar chart for genres
    const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1;
    const genreColors = ['#7551FF', '#6B46C1', '#805AD5', '#9F7AEA', '#B794F4', '#D6BCFA'];
    const barItems = topGenres.map(([genre, count], i) => {
        const percent = Math.round((count / maxGenreCount) * 100);
        return `
            <div class="bar-item">
                <span class="bar-label">${genre}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: 0%; background: ${genreColors[i % genreColors.length]};" data-target-width="${percent}%">
                        <span class="bar-value">${count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Completion rate for progress ring
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const ringCircumference = 2 * Math.PI * 24;
    const ringOffset = ringCircumference - (ringCircumference * completionRate / 100);

    // Build HTML
    statsGrid.innerHTML = `
        <!-- Row 1: Main Status Stats -->
        <div class="stats-row stats-row-main">
            <div class="stat-item-compact" style="--stat-color: var(--primary)">
                <span class="stat-value-large">${total}</span>
                <span class="stat-label-small">Total</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #00BCD4">
                <span class="stat-value-large">${chapters.toLocaleString()}</span>
                <span class="stat-label-small">Chapters Read</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #4CAF50">
                <span class="stat-value-large">${reading}</span>
                <span class="stat-label-small">Reading</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #2196F3">
                <span class="stat-value-large">${completed}</span>
                <span class="stat-label-small">Completed</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #9C27B0">
                <span class="stat-value-large">${planning}</span>
                <span class="stat-label-small">Plan to Read</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #FFC107">
                <span class="stat-value-large">${onhold}</span>
                <span class="stat-label-small">On Hold</span>
            </div>
            <div class="stat-item-compact" style="--stat-color: #F44336">
                <span class="stat-value-large">${dropped}</span>
                <span class="stat-label-small">Dropped</span>
            </div>
        </div>

        <!-- Row 2: Charts -->
        <div class="stats-row stats-row-charts">
            <!-- Pie Chart: Status Distribution -->
            <div class="chart-container">
                <span class="chart-title">📊 Status Distribution</span>
                <svg class="pie-chart-svg" viewBox="0 0 180 180">
                    ${piePaths}
                    <circle class="pie-center" cx="${pieCenter}" cy="${pieCenter}" r="45" />
                    <text class="pie-center-text" x="${pieCenter}" y="${pieCenter - 5}" text-anchor="middle" dominant-baseline="middle">${total}</text>
                    <text class="pie-center-label" x="${pieCenter}" y="${pieCenter + 15}" text-anchor="middle">TOTAL</text>
                </svg>
                <div class="pie-legend">
                    ${statusData.map(d => `
                        <div class="legend-item">
                            <span class="legend-dot" style="background: ${d.color}"></span>
                            <span>${d.label} (${d.value})</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Bar Chart: Top Genres -->
            <div class="bar-chart-container">
                <span class="chart-title">🏷️ Top Genres</span>
                <div class="bar-chart">
                    ${barItems || '<p style="color: var(--text-secondary); font-size: 0.8rem;">No genre data available</p>'}
                </div>
            </div>
        </div>

        <!-- Row 3: Activity & Sources -->
        <div class="stats-row stats-row-secondary">
            <div class="stat-group">
                <h4 class="stat-group-title">📅 Activity</h4>
                <div class="stat-mini-grid">
                    <div class="stat-mini"><span class="stat-mini-value">${readThisWeek}</span><span class="stat-mini-label">Read This Week</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${readThisMonth}</span><span class="stat-mini-label">Read This Month</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${addedThisWeek}</span><span class="stat-mini-label">Added This Week</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${withHistory}</span><span class="stat-mini-label">With History</span></div>
                </div>
            </div>
            <div class="stat-group">
                <h4 class="stat-group-title">🌐 Data Sources</h4>
                <div class="stat-mini-grid">
                    <div class="stat-mini"><span class="stat-mini-value" style="color: #02A9FF">${anilistEntries}</span><span class="stat-mini-label">AniList</span></div>
                    <div class="stat-mini"><span class="stat-mini-value" style="color: #FF6740">${mangadexEntries}</span><span class="stat-mini-label">MangaDex</span></div>
                    <div class="stat-mini"><span class="stat-mini-value" style="color: #888">${noDataEntries}</span><span class="stat-mini-label">No Data</span></div>
                </div>
            </div>
            <div class="stat-group">
                <h4 class="stat-group-title">📚 Format</h4>
                <div class="stat-mini-grid">
                    <div class="stat-mini"><span class="stat-mini-value">${manga}</span><span class="stat-mini-label">Manga</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${manhwa}</span><span class="stat-mini-label">Manhwa</span></div>
                    <div class="stat-mini"><span class="stat-mini-value">${manhua}</span><span class="stat-mini-label">Manhua</span></div>
                </div>
            </div>
            
            <!-- Progress Ring -->
            <div class="progress-ring-container">
                <svg class="progress-ring-svg" viewBox="0 0 60 60">
                    <circle class="progress-ring-bg" cx="30" cy="30" r="24" />
                    <circle class="progress-ring-fill" cx="30" cy="30" r="24" 
                        stroke-dasharray="${ringCircumference}" 
                        stroke-dashoffset="${ringCircumference}"
                        data-target-offset="${ringOffset}" />
                </svg>
                <div class="progress-ring-info">
                    <span class="progress-ring-value">${completionRate}%</span>
                    <span class="progress-ring-label">Completion Rate</span>
                </div>
            </div>
        </div>

        <!-- Row 4: Quick Stats Bar -->
        <div class="stats-row stats-row-bar">
            <div class="stat-bar-item">⭐ Avg Score: <strong>${avgScore > 0 ? avgScore + '%' : 'N/A'}</strong></div>
            <div class="stat-bar-item">📖 ${Math.round(chapters / Math.max(completed, 1))} ch/completed manga</div>
            <div class="stat-bar-item">📈 ${completionRate}% completion rate</div>
        </div>
    `;

    // Animate with anime.js
    animateStatsOpen(ringCircumference);

    return { total, reading, completed, planning, onhold, dropped, chapters };
}

/**
 * Animates the statistics dashboard opening.
 * @param {number} ringCircumference - Circumference value for progress ring
 */
export function animateStatsOpen(ringCircumference) {
    if (typeof anime === 'undefined') return;

    // Animate stat items entrance
    anime({
        targets: '.stat-item-compact, .stat-group, .stat-bar-item, .chart-container, .bar-chart-container, .progress-ring-container',
        opacity: [0, 1],
        translateY: [15, 0],
        delay: anime.stagger(40),
        duration: 600,
        easing: 'easeOutQuart'
    });

    // Animate pie chart slices
    setTimeout(() => {
        document.querySelectorAll('.pie-slice').forEach((slice, i) => {
            const targetDash = slice.dataset.targetDash;
            anime({
                targets: slice,
                strokeDasharray: [slice.getAttribute('stroke-dasharray'), targetDash],
                duration: 1000,
                delay: i * 100,
                easing: 'easeOutQuart'
            });
        });
    }, 300);

    // Animate bar chart fills
    setTimeout(() => {
        document.querySelectorAll('.bar-fill').forEach((bar, i) => {
            const targetWidth = bar.dataset.targetWidth;
            anime({
                targets: bar,
                width: ['0%', targetWidth],
                duration: 800,
                delay: i * 80,
                easing: 'easeOutQuart'
            });
        });
    }, 500);

    // Animate progress ring
    setTimeout(() => {
        const ring = document.querySelector('.progress-ring-fill');
        if (ring) {
            const targetOffset = ring.dataset.targetOffset;
            anime({
                targets: ring,
                strokeDashoffset: [ringCircumference, targetOffset],
                duration: 1200,
                easing: 'easeOutQuart'
            });
        }
    }, 400);
}

/**
 * Animates the statistics dashboard closing.
 * @param {HTMLElement} container - The stats container element
 * @param {Function} onComplete - Callback when animation finishes
 */
export function animateStatsClose(container, onComplete) {
    if (typeof anime === 'undefined') {
        if (onComplete) onComplete();
        return;
    }

    // Collapse bars first
    anime({
        targets: '.bar-fill',
        width: '0%',
        duration: 300,
        easing: 'easeInQuart'
    });

    // Collapse pie slices
    anime({
        targets: '.pie-slice',
        strokeDasharray: (el) => `0 ${2 * Math.PI * 70}`,
        duration: 400,
        easing: 'easeInQuart'
    });

    // Collapse progress ring
    const ring = document.querySelector('.progress-ring-fill');
    if (ring) {
        anime({
            targets: ring,
            strokeDashoffset: 2 * Math.PI * 24,
            duration: 400,
            easing: 'easeInQuart'
        });
    }

    // Fade out and slide up all elements
    anime({
        targets: '.stat-item-compact, .stat-group, .stat-bar-item, .chart-container, .bar-chart-container, .progress-ring-container',
        opacity: [1, 0],
        translateY: [0, -10],
        delay: anime.stagger(20, { direction: 'reverse' }),
        duration: 300,
        easing: 'easeInQuart',
        complete: () => {
            if (onComplete) onComplete();
        }
    });
}
