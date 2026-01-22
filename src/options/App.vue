<template>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="brand">
                <div class="brand-icon">
                    <span class="icon-svg icon-brand"></span>
                </div>
                <span class="brand-name header-text-gradient">Color Marker</span>
            </div>

            <nav class="nav-menu">
                <a href="#" :class="['nav-item', { active: currentTab === 'settings' }]" @click.prevent="currentTab = 'settings'">
                    <span class="nav-icon">⚙️</span>
                    General Settings
                </a>
                <a href="#" :class="['nav-item', { active: currentTab === 'saved-entries' }]" @click.prevent="currentTab = 'saved-entries'">
                    <span class="nav-icon">📚</span>
                    Saved Entries
                </a>
                <a href="#" :class="['nav-item', { active: currentTab === 'import-export' }]" @click.prevent="currentTab = 'import-export'">
                    <span class="nav-icon">📂</span>
                    Import & Export
                </a>
                <a href="#" :class="['nav-item', { active: currentTab === 'appearance' }]" @click.prevent="currentTab = 'appearance'">
                    <span class="nav-icon">🎨</span>
                    Appearance
                </a>
                <a href="#" :class="['nav-item', { active: currentTab === 'about' }]" @click.prevent="currentTab = 'about'">
                    <span class="nav-icon">ℹ️</span>
                    About
                </a>
                <div class="nav-indicator"></div>
            </nav>

            <div class="sidebar-footer">
                <a href="https://www.buymeacoffee.com" target="_blank" class="sidebar-btn support-sidebar-btn" title="Support Developer">
                    <span class="icon">☕</span>
                    <span class="label">Support Dev</span>
                </a>
                <div class="version-info">Version 4.0.0 (Vue)</div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">

            <!-- Settings Tab -->
            <div v-show="currentTab === 'settings'" class="tab-pane active fade-in">
                <header class="header">
                    <div class="header-text">
                        <h1>Settings</h1>
                        <p class="subtitle">Configure your custom bookmarks for MangaFire.to, manage sync, and display preferences.</p>
                    </div>
                </header>

                <div class="content-grid">
                    <!-- General Preferences -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon">⚙️</div>
                            <h3>General Preferences</h3>
                        </div>
                        <div class="card-body">
                            <div class="input-group-row">
                                <div class="feature-toggle-wrapper">
                                    <div class="toggle-label-group">
                                        <label class="toggle-main-label">Mark Homepage</label>
                                        <span class="toggle-sub-label">Highlight manga on the homepage</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="MarkHomePage" v-model="settings.general.markHomePage">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                                <div class="feature-toggle-wrapper">
                                    <div class="toggle-label-group">
                                        <label class="toggle-main-label">Sync & Mark Read</label>
                                        <span class="toggle-sub-label">Sync history and mark as read</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="SyncandMarkRead" v-model="settings.general.syncAndMarkRead">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                                <div class="feature-toggle-wrapper">
                                    <div class="toggle-label-group">
                                        <label class="toggle-main-label">Family Friendly</label>
                                        <span class="toggle-sub-label">Hide Ecchi/Adult content</span>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="FamilyFriendly" v-model="settings.general.familyFriendly">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sync & Bookmarks -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e;">🔄</div>
                            <h3>Sync & Bookmarks</h3>
                        </div>
                        <div class="card-body">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Auto Sync</label>
                                    <span class="toggle-sub-label">Automatically sync when reading chapters</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="AutoSync" v-model="syncSettings.autoSync" @change="saveSyncSetting('autoSync')">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="divider"></div>
                            <div class="sync-actions">
                                <p class="section-label">Manual Sync</p>
                                <div class="sync-buttons-row">
                                    <button class="btn btn-primary" :disabled="isSyncing" @click="triggerSync">
                                        <span v-if="!isSyncing">🔄 Sync Bookmarks</span>
                                        <span v-else>⏳ Syncing...</span>
                                    </button>
                                    <button class="btn btn-ghost" :disabled="isSyncing" @click="triggerFreshSync">
                                        ⚡ Fresh Sync
                                    </button>
                                </div>
                                <p class="sync-status" v-if="lastSyncDate">Last synced: {{ formatSyncDate(lastSyncDate) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Markers -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(168, 85, 247, 0.1); color: #a855f7;">🏷️</div>
                            <h3>Custom Markers</h3>
                        </div>
                        <div class="card-body">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Enable Custom Markers</label>
                                    <span class="toggle-sub-label">Create personalized status categories</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="CustomBookmarks" v-model="syncSettings.customBookmarks" @change="saveSyncSetting('customBookmarks')">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="divider"></div>
                            <div class="marker-creator" v-if="syncSettings.customBookmarks">
                                <p class="section-label">Create New Marker</p>
                                <div class="marker-input-row">
                                    <input type="text" v-model="newMarkerName" placeholder="Marker name..." class="input-field" style="flex: 1;">
                                    <input type="color" v-model="newMarkerColor" class="color-picker-sm">
                                    <select v-model="newMarkerStyle" class="select-field" style="width: 100px;">
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                    </select>
                                    <button class="btn btn-primary btn-sm" @click="addMarker">+ Add</button>
                                </div>
                                <div class="active-markers">
                                    <p class="section-label" style="margin-top: 16px;">Active Markers</p>
                                    <div class="markers-container" v-if="customMarkers.length > 0">
                                        <div v-for="(marker, index) in customMarkers" :key="index" 
                                             class="marker-pill" 
                                             :style="{ backgroundColor: marker.color + '33', border: '2px ' + marker.style + ' ' + marker.color + 'CC' }"
                                             @click="removeMarker(index)" 
                                             :title="'Click to remove: ' + marker.name">
                                            {{ marker.name }}
                                        </div>
                                    </div>
                                    <p v-else class="description" style="margin: 0;">No active markers.</p>
                                </div>
                                <button class="btn btn-ghost btn-sm" style="margin-top: 12px;" @click="resetMarkers" v-if="customMarkers.length > 0">
                                    🗑️ Reset All Markers
                                </button>
                            </div>
                        </div>
                    </div>

                     <!-- Smart Automation -->
                     <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(79, 70, 229, 0.1); color: var(--primary);">⚡</div>
                            <h3>Smart Automation</h3>
                        </div>
                        <div class="card-body">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Smart Auto-Complete</label>
                                    <span class="toggle-sub-label">Mark as 'Completed' when reaching last chapter</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="SmartAutoComplete" v-model="settings.automation.smartAutoComplete">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Inactivity Dimming</label>
                                    <span class="toggle-sub-label">Dim 'Reading' manga untouched for 30+ days</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="SmartInactivityFade" v-model="settings.automation.smartInactivityFade">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Smart Resume</label>
                                    <span class="toggle-sub-label">Dashboard opens next chapter (Predictive)</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="SmartResumeLink" v-model="settings.automation.smartResumeLink">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">New Chapter Alerts</label>
                                    <span class="toggle-sub-label">Browser notifications for new releases</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="NotificationsEnabled" v-model="settings.automation.notificationsEnabled">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Reader Enhancements -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">📚</div>
                            <h3>Reader Enhancements</h3>
                        </div>
                        <div class="card-body">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Auto-Scroll Panel</label>
                                    <span class="toggle-sub-label">Show floating auto-scroll controls on reader pages</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="AutoScrollEnabled" v-model="settings.reader.autoScrollEnabled">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Keyboard Shortcuts</label>
                                    <span class="toggle-sub-label">Arrow keys, Space (auto-scroll), F (fullscreen)</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="KeybindsEnabled" v-model="settings.reader.keybindsEnabled">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                             <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Auto-Save Progress</label>
                                    <span class="toggle-sub-label">Automatically save chapter progress while reading</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="ProgressTrackingEnabled" v-model="settings.reader.progressTrackingEnabled">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- MangaDex Highlighting -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(255, 103, 64, 0.1); color: #FF6740;">📖</div>
                            <h3>MangaDex Highlighting</h3>
                        </div>
                         <div class="card-body">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Enable MangaDex Highlighting</label>
                                    <span class="toggle-sub-label">Show colored borders on mangadex.org</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="MangaDexHighlightEnabled" v-model="settings.platforms.mangadex.highlight">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Show Reading Progress</label>
                                    <span class="toggle-sub-label">Display "Ch. X/Y" on saved manga cards</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="MangaDexShowProgress" v-model="settings.platforms.mangadex.showProgress">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Webtoons Highlighting -->
                     <div class="card">
                        <div class="card-header">
                            <div class="card-icon" style="background: rgba(0, 220, 100, 0.1); color: #00DC64;">📺</div>
                            <h3>Webtoons Highlighting</h3>
                        </div>
                        <div class="card-body">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Enable Webtoons Highlighting</label>
                                    <span class="toggle-sub-label">Show colored borders on webtoons.com</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="WebtoonsHighlightEnabled" v-model="settings.platforms.webtoons.highlight">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                                <div class="toggle-label-group">
                                    <label class="toggle-main-label">Show Reading Progress</label>
                                    <span class="toggle-sub-label">Display "Ep. X/Y" on saved webtoon cards</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="WebtoonsShowProgress" v-model="settings.platforms.webtoons.showProgress">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Saved Entries Tab -->
            <div v-show="currentTab === 'saved-entries'" class="tab-pane active fade-in">
                <header class="header">
                    <div class="header-text">
                        <h1>Saved Entries</h1>
                        <p class="subtitle">Browse and manage your manga library</p>
                    </div>
                    <div class="header-actions">
                        <button id="BtnShowStats" class="btn btn-ghost btn-sm">📊 Stats</button>
                        <button id="BtnCleanLibrary" class="btn btn-ghost btn-sm" title="Remove Duplicates">🧹
                            Clean</button>
                        <button id="BtnTrashAndSyncEntries" class="btn btn-warning-large">⚡Fresh Sync
                            Entries</button>
                    </div>
                </header>

                <div class="content-grid" style="max-width: 100%;">
                    <!-- Stats Section (Collapsible) -->
                    <div id="library-stats-container" class="stats-dashboard-card glass-card">
                        <div class="stats-header">
                            <h3>Library Statistics</h3>
                        </div>
                        <div class="stats-grid-compact" id="stats-dashboard-grid">
                            <div class="stat-card blue" @click="statusFilter = 'ALL'">
                                <div class="stat-icon">📚</div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stats.total }}</span>
                                    <span class="stat-label">Total Manga</span>
                                </div>
                            </div>
                            <div class="stat-card green" @click="statusFilter = 'Reading'">
                                <div class="stat-icon">📖</div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stats.reading }}</span>
                                    <span class="stat-label">Reading</span>
                                </div>
                            </div>
                             <div class="stat-card purple" @click="statusFilter = 'Completed'">
                                <div class="stat-icon">✅</div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stats.completed }}</span>
                                    <span class="stat-label">Completed</span>
                                </div>
                            </div>
                             <div class="stat-card yellow" @click="statusFilter = 'Plan to Read'">
                                <div class="stat-icon">🔖</div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stats.planToRead }}</span>
                                    <span class="stat-label">Plan to Read</span>
                                </div>
                            </div>
                             <div class="stat-card orange" @click="statusFilter = 'On Hold'">
                                <div class="stat-icon">⏸️</div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stats.onHold }}</span>
                                    <span class="stat-label">On Hold</span>
                                </div>
                            </div>
                             <div class="stat-card red" @click="statusFilter = 'Dropped'">
                                <div class="stat-icon">🗑️</div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stats.dropped }}</span>
                                    <span class="stat-label">Dropped</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bulk Operations Bar -->
                    <div id="bulk-ops-bar" class="bulk-ops-bar glass-card" style="display: none;">
                        <div class="bulk-info">
                            <span id="bulk-count-label">0 items selected</span>
                        </div>
                        <div class="bulk-actions">
                            <span>Update All Filtered to:</span>
                            <select id="bulkStatusSelect" class="select-field sm">
                                <option value="Reading">Reading</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Plan to Read">Plan to Read</option>
                                <option value="Dropped">Dropped</option>
                                <option value="HasHistory">Has History</option>
                            </select>
                            <button id="btnApplyBulkUpdate" class="btn btn-primary btn-sm">Apply
                                Update</button>
                            <button id="btnCloseBulkOps" class="btn btn-ghost btn-sm">&times;</button>
                        </div>
                    </div>

                    <!-- Library Header with Filters -->
                    <div class="library-header">
                        <div class="library-title-section">
                            <div class="library-icon">📚</div>
                            <div class="library-title-text">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h2>Your Library</h2>
                                    <button id="btnToggleBulk" class="btn btn-ghost btn-sm"
                                        title="Bulk Selection">Bulk</button>
                                    <button class="info-redirect-btn" data-target="guide-entries"
                                        title="How to use Saved Entries">
                                        <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                                    </button>
                                </div>
                                <p class="library-subtitle" id="library-subtitle">Loading...</p>
                            </div>
                        </div>
                        <div class="library-controls">

                            <select id="savedSortFilter" class="select-field" style="width: 140px;" v-model="librarySortModel">
                                <option value="title-asc">A-Z</option>
                                <option value="title-desc">Z-A</option>
                                <option value="pop-desc">Most Popular</option>
                                <option value="pop-asc">Least Popular</option>
                                <option value="score-desc">Highest Score</option>
                                <option value="rating-desc">My Rating ↓</option>
                                <option value="rating-asc">My Rating ↑</option>
                                <option value="added-desc">Recently Added</option>
                                <option value="last-read-desc">Recently Read</option>
                            </select>

                            <select id="savedDemographicFilter" class="select-field">
                                <option value="All">All Demographics</option>
                                <option value="Shonen">Shonen</option>
                                <option value="Seinen">Seinen</option>
                                <option value="Shoujo">Shoujo</option>
                                <option value="Josei">Josei</option>
                            </select>

                            <select id="savedStatusFilter" class="select-field" v-model="statusFilter">
                                <option value="ALL">All Statuses</option>
                                <option value="Reading">Reading</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Plan to Read">Plan to Read</option>
                                <option value="Dropped">Dropped</option>
                                <option value="HasHistory">Has History</option>
                            </select>
                            <select id="savedGenreFilter" class="select-field">
                                <option value="All">All Genres</option>
                            </select>
                            <select id="savedFormatFilter" class="select-field">
                                <option value="All">All Formats</option>
                                <option value="Manga">Manga</option>
                                <option value="Manhwa">Manhwa</option>
                                <option value="Manhua">Manhua</option>
                                <option value="One Shot">One Shot</option>
                                <option value="Light Novel">Light Novel</option>
                            </select>
                            <input type="text" id="savedSearchInput" placeholder="Search titles..." class="input-field" v-model="searchQuery">
                            <div class="view-toggle-group">
                                <button id="view-compact-btn" class="view-toggle-btn" title="Compact View">
                                    <svg class="icon-svg icon-view-compact"></svg>
                                </button>
                                <button id="view-large-btn" class="view-toggle-btn active" title="Large View">
                                    <svg class="icon-svg icon-view-large"></svg>
                                </button>
                            </div>
                        </div>

                        <!-- Phase 1: Advanced Filters Row -->
                        <div class="library-controls-advanced">
                            <div class="advanced-filter-group">
                                <label class="filter-label">Chapters:</label>
                                <div class="chapter-range-wrapper">
                                    <input type="number" id="chapterMinFilter" class="input-field input-sm"
                                        placeholder="Min" min="0" style="width: 70px;">
                                    <span class="range-separator">–</span>
                                    <input type="number" id="chapterMaxFilter" class="input-field input-sm"
                                        placeholder="Max" min="0" style="width: 70px;">
                                </div>
                            </div>
                            <div class="advanced-filter-group">
                                <label class="filter-label">Updated:</label>
                                <select id="lastUpdatedFilter" class="select-field select-sm">
                                    <option value="all">Any Time</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                    <option value="90d">Last 90 Days</option>
                                    <option value="year">Last Year</option>
                                </select>
                            </div>
                            <div class="advanced-filter-group quick-filters">
                                <button id="filterBingeworthy" class="btn btn-ghost btn-sm filter-preset-btn"
                                    title="100+ chapters">
                                    🔥 Binge-worthy
                                </button>
                                <button id="filterNewChapters" class="btn btn-ghost btn-sm filter-preset-btn"
                                    title="Manga with unread chapters">
                                    ✨ New Chapters
                                </button>
                                <button id="filterClearAdvanced" class="btn btn-ghost btn-sm filter-preset-btn"
                                    title="Clear all filters">
                                    ✕ Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="loading-progress" id="loading-progress" style="display: none;">
                        <div class="progress-text">
                            <span id="progress-text">Fetching data...</span>
                            <span id="progress-percent">0%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" id="progress-bar-fill" style="width: 0%">
                            </div>
                        </div>
                    </div>

                    <!-- Manga Grid -->
                    <div class="manga-grid" id="manga-grid">
                        <div v-for="entry in filteredEntries" :key="entry.id" class="manga-card" :data-id="entry.id" @click="openManga(entry.url)">
                            <div class="manga-card-cover-container">
                                <img :src="getCoverImage(entry)" class="manga-card-cover" loading="lazy" alt="Cover">
                                <div class="manga-card-overlay">
                                    <button class="icon-btn" title="View Details" @click.stop="openModal(entry)">
                                        <svg class="icon-svg icon-info" style="filter: invert(1); width: 20px; height: 20px;"></svg>
                                    </button>
                                    <button class="icon-btn delete-btn" title="Remove from Library" @click.stop="removeEntry(entry.id)" style="margin-left: 8px;">
                                        <svg class="icon-svg icon-trash" style="filter: invert(1); width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div v-if="settings.appearance.libraryData.progressBars" class="manga-card-progress-bar">
                                    <div class="progress-fill" :style="{ width: ((entry.lastReadChapter || 0) / (entry.totalChapters || 1) * 100) + '%' }"></div>
                                </div>
                            </div>
                            <div class="manga-card-info">
                                <div class="manga-card-header">
                                    <span class="manga-card-status" :class="entry.status?.toLowerCase().replace(' ', '-')">{{ entry.status }}</span>
                                    <span v-if="entry.format" class="format-badge">{{ entry.format }}</span>
                                </div>
                                <h3 class="manga-card-title" :title="entry.title">{{ entry.title }}</h3>
                                <div class="manga-card-meta">
                                    <span class="chapter-info">
                                        {{ entry.lastReadChapter ? 'Ch. ' + entry.lastReadChapter : 'Not started' }}
                                        <span v-if="entry.totalChapters" class="total-chapters">/ {{ entry.totalChapters }}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Empty State -->
                        <div v-if="filteredEntries.length === 0" class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                            <p style="color: var(--text-secondary);">No entries found matching your filters.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Import/Export Tab (Full) -->
            <div v-show="currentTab === 'import-export'" class="tab-pane active fade-in">
                <header class="header">
                     <div class="header-text">
                        <h1>Import & Export</h1>
                        <p class="subtitle">Manage your manga bookmarks and reading history. Keep your data safe or transfer it to another machine.</p>
                    </div>
                </header>
                 <div class="content-grid export-import-grid">
                     <!-- Export Card -->
                    <div class="card secondary-bg-card">
                        <div class="card-header">
                            <div class="card-icon blue-icon">
                                <svg class="icon-svg icon-export" style="width: 20px; height: 20px;"></svg>
                            </div>
                            <div class="card-title-group">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h3>Export Data</h3>
                                    <button class="info-redirect-btn" data-target="guide-backup"
                                        title="About Backup & Restore">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="16" x2="12" y2="12"></line>
                                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                        </svg>
                                    </button>
                                </div>
                                <p class="description compact">Generate a backup of your library and settings.</p>
                            </div>
                        </div>

                        <!-- Export Options -->
                        <div class="export-options">
                            <p class="section-label">Include in export:</p>
                            <div class="export-checkboxes">
                                <label class="export-option">
                                    <input type="checkbox" id="exportLibrary" v-model="exportOptions.library">
                                    <span>📚 Library Entries</span>
                                    <span class="export-count" id="exportLibraryCount">{{ stats.total }}</span>
                                </label>
                                <label class="export-option">
                                    <input type="checkbox" id="exportHistory" v-model="exportOptions.history">
                                    <span>📖 Reading History</span>
                                    <!-- History count is same as Library for now as per schema -->
                                </label>
                                <label class="export-option">
                                    <input type="checkbox" id="exportSettings" v-model="exportOptions.settings">
                                    <span>⚙️ Settings</span>
                                </label>
                                <label class="export-option">
                                    <input type="checkbox" id="exportPersonalData" v-model="exportOptions.personal">
                                    <span>🏷️ Tags, Notes & Ratings</span>
                                </label>
                                <label class="export-option">
                                    <input type="checkbox" id="exportCache" v-model="exportOptions.cache">
                                    <span>💾 AniList Cache</span>
                                </label>
                            </div>
                        </div>

                        <div class="inner-info-card">
                            <div class="format-info">
                                <span class="label-info">Format: <span class="highlight-text">JSON</span></span>
                            </div>
                            <button id="exportDataBtn" class="btn btn-primary btn-with-icon" @click="exportData">
                                <svg class="icon-svg icon-export" style="width: 16px; height: 16px;"></svg>
                                Export Selected
                            </button>
                        </div>

                        <div class="card-footer-info">
                            <span class="status-icon">ℹ️</span>
                            <span class="status-text-muted">Last backup: <span
                                    id="lastBackupDisplay">Never</span></span>
                        </div>
                    </div>

                    <!-- Import Card -->
                    <div class="card secondary-bg-card">
                        <div class="card-header">
                            <div class="card-icon purple-icon">
                                <svg class="icon-svg icon-import" style="width: 20px; height: 20px;"></svg>
                            </div>
                            <div class="card-title-group">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <h3>Import Data</h3>
                                    <button class="info-redirect-btn" data-target="guide-backup"
                                        title="About Backup & Restore">
                                        <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                                    </button>
                                </div>
                                <p class="description compact">Restore your data from a previously exported file.</p>
                            </div>
                        </div>

                        <div class="drop-zone-container" id="dropZone" @click="triggerFileInput">
                            <input type="file" id="importDataInput" accept=".json,.xml" style="display: none;" @change="handleFileSelect">
                            <div class="drop-zone-content">
                                <div class="drop-zone-icon">
                                    <svg class="icon-svg icon-file" style="width: 24px; height: 24px;"></svg>
                                </div>
                                <span class="drop-zone-text" v-if="!selectedImportFile">Click to upload or drag and drop</span>
                                <span class="drop-zone-text" v-else>{{ selectedImportFile.name }}</span>
                                <span class="drop-zone-subtext">Supports .json files</span>
                            </div>
                        </div>

                        <div class="import-actions-row">
                            <div class="feature-toggle-wrapper">
                                <div class="toggle-label-group">
                                    <span class="toggle-main-label">Merge with current data</span>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="mergeImportToggle" v-model="importMerge">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <button id="startImportBtn" class="btn btn-primary btn-with-icon" @click="startImport" :disabled="!selectedImportFile">
                                <svg class="icon-svg icon-plus" style="width: 16px; height: 16px;"></svg>
                                Start Import
                            </button>
                        </div>

                        <div class="caution-banner">
                            <div class="caution-icon">⚠️</div>
                            <div class="caution-text">
                                <strong>Caution:</strong> If "Merge with current data" is disabled, all existing bookmarks will be overwritten.
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Appearance Tab (Full) -->
            <div v-show="currentTab === 'appearance'" class="tab-pane active fade-in">
                <header class="header">
                    <div class="header-text">
                        <h1>Appearance</h1>
                        <p class="subtitle">Customize the look and feel of your extension and dashboard.</p>
                    </div>
                </header>

                <div class="content-grid">
                    <!-- Card: Global Themes -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon">🎭</div>
                            <h3>Preset Themes</h3>
                            <button class="info-redirect-btn" data-target="guide-personalization" title="About Themes">
                                <svg class="icon-svg icon-info" style="width: 16px; height: 16px;"></svg>
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="theme-grid">
                                <div class="theme-preview-card" :class="{ active: currentTheme === 'dark' }" @click="selectTheme('dark')">
                                    <div class="theme-swatch dark-swatch"></div>
                                    <span class="theme-label">Cloudy Dark</span>
                                </div>
                                <div class="theme-preview-card" :class="{ active: currentTheme === 'black' }" @click="selectTheme('black')">
                                    <div class="theme-swatch black-swatch"></div>
                                    <span class="theme-label">Absolute Black</span>
                                </div>
                                <div class="theme-preview-card" :class="{ active: currentTheme === 'light' }" @click="selectTheme('light')">
                                    <div class="theme-swatch light-swatch"></div>
                                    <span class="theme-label">Clean Light</span>
                                </div>
                                <div class="theme-preview-card" :class="{ active: currentTheme === 'neon' }" @click="selectTheme('neon')">
                                    <div class="theme-swatch neon-swatch"></div>
                                    <span class="theme-label">Cyber Neon</span>
                                </div>
                                <div class="theme-preview-card" :class="{ active: currentTheme === 'glassy' }" @click="selectTheme('glassy')">
                                    <div class="theme-swatch glassy-swatch"></div>
                                    <span class="theme-label">Glassy Blue</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Custom Theme Creator -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon">✨</div>
                            <h3>Theme Creator</h3>
                        </div>
                        <div class="card-body">
                            <p class="description">Create your own personalized appearance by adjusting the colors below.</p>
                            <div class="color-creator-grid">
                                <div class="input-wrapper">
                                    <label>Background</label>
                                    <input type="color" id="themeColorBg" value="#0b1437">
                                </div>
                                <div class="input-wrapper">
                                    <label>Sidebar</label>
                                    <input type="color" id="themeColorSidebar" value="#111c44">
                                </div>
                                <div class="input-wrapper">
                                    <label>Accent</label>
                                    <input type="color" id="themeColorAccent" value="#7551FF">
                                </div>
                                <div class="input-wrapper">
                                    <label>Text</label>
                                    <input type="color" id="themeColorText" value="#ffffff">
                                </div>
                            </div>
                            <div class="button-group" style="margin-top: 20px;">
                                <button id="ApplyCustomThemeBtn" class="btn btn-primary">Apply Custom Theme</button>
                                <button id="ResetThemeBtn" class="btn btn-ghost">Reset to Default</button>
                            </div>
                        </div>
                    </div>

                    <!-- Layout for Style Cards (Two Columns) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                        <!-- Card 2: Highlight Styles -->
                        <div class="card full-height">
                            <div class="card-header">
                                <div class="card-icon">🖼️</div>
                                <h3>Highlight Styles</h3>
                            </div>
                            <div class="card-body">
                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Border Style
                                        <span class="feature-subtitle">Choose line style</span>
                                    </label>
                                    <select id="borderStyleSelect" class="select-field" v-model="settings.appearance.borderStyle">
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                    </select>
                                </div>
                                <div class="divider"></div>
                                <div class="range-header">
                                    <label>Highlight Thickness</label>
                                    <span id="rangeValue" style="color: var(--primary); font-weight: bold;">{{ settings.appearance.highlightThickness }}px</span>
                                </div>
                                <input type="range" id="borderThicknessRange" min="1" max="10" v-model.number="settings.appearance.highlightThickness" class="range-slider">
                            </div>
                        </div>

                        <!-- Card 3: Library Styles -->
                        <div class="card full-height">
                            <div class="card-header">
                                <div class="card-icon">📚</div>
                                <h3>Library Styles</h3>
                            </div>
                            <div class="card-body">
                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Show Status Borders
                                        <span class="feature-subtitle">Color borders in library</span>
                                    </label>
                                    <label class="switch">
                                        <input type="checkbox" id="LibraryCardBordersEnabled" v-model="settings.appearance.libraryData.showBorders">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Only Show with History
                                        <span class="feature-subtitle">Hide entries with no progress</span>
                                    </label>
                                    <label class="switch">
                                        <input type="checkbox" id="LibraryHideNoHistory" v-model="settings.appearance.libraryData.hideNoHistory">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                                <div class="divider"></div>
                                <div class="range-header">
                                    <label>Border Thickness</label>
                                    <span id="libraryBorderValue" style="color: var(--primary); font-weight: bold;">{{ settings.appearance.libraryData.borderThickness }}px</span>
                                </div>
                                <input type="range" id="LibraryCardBorderThickness" min="1" max="10" v-model.number="settings.appearance.libraryData.borderThickness" class="range-slider">

                                <div class="divider"></div>
                                <p class="section-label">✨ Visual Effects</p>

                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Glow Effect
                                        <span class="feature-subtitle">Use glow instead of solid borders</span>
                                    </label>
                                    <label class="switch">
                                        <input type="checkbox" id="LibraryGlowEffect" v-model="settings.appearance.libraryData.glowEffect">
                                        <span class="slider round"></span>
                                    </label>
                                </div>

                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Animated Borders
                                        <span class="feature-subtitle">Pulse animation for "Reading" status</span>
                                    </label>
                                    <label class="switch">
                                        <input type="checkbox" id="LibraryAnimatedBorders" v-model="settings.appearance.libraryData.animatedBorders">
                                        <span class="slider round"></span>
                                    </label>
                                </div>

                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Status Icons
                                        <span class="feature-subtitle">Show emoji overlay on cards</span>
                                    </label>
                                    <label class="switch">
                                        <input type="checkbox" id="LibraryStatusIcons" v-model="settings.appearance.libraryData.statusIcons">
                                        <span class="slider round"></span>
                                    </label>
                                </div>

                                <div class="feature-toggle-wrapper">
                                    <label class="feature-label">
                                        Progress Bars
                                        <span class="feature-subtitle">Reading progress on card covers</span>
                                    </label>
                                    <label class="switch">
                                        <input type="checkbox" id="LibraryProgressBars" v-model="settings.appearance.libraryData.progressBars">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             <!-- About Tab -->
            <div v-show="currentTab === 'about'" class="tab-pane active fade-in">
                <header class="header">
                    <div class="header-text">
                        <h1>About</h1>
                        <p class="subtitle">Information, usage guide, and credits.</p>
                    </div>
                </header>
                <div class="content-grid">
                    <div class="card">
                        <div class="card-body prose">
                            <h2>MangaFire Bookmark Color Marker</h2>
                             <p>A powerful Chrome Extension for MangaFire.to.</p>
                        </div>
                    </div>
                </div>
            </div>


        <!-- Scroll to Top Button -->
        <button id="scrollToTopBtn" class="scroll-to-top" :class="{ 'show': showScrollTop }" title="Go to top" @click="scrollToTop">
            <svg class="icon-svg icon-arrow-up" style="width: 20px; height: 20px;"></svg>
        </button>

        <!-- Manga Detail Modal -->
        <div id="mangaDetailModal" class="modal-overlay" :class="{ 'active': modalVisible }" @click.self="closeModal">
            <div class="modal-container" v-if="selectedManga">
                <button class="modal-close" id="modalCloseBtn" @click="closeModal">&times;</button>
                <div class="modal-layout">
                    <div class="modal-sidebar">
                        <img :src="getCoverImage(selectedManga)" alt="Cover" class="modal-cover">
                        <div class="modal-sidebar-info">
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Status</span>
                                <div class="manga-card-status" :class="selectedManga.status?.toLowerCase().replace(' ', '-')">{{ selectedManga.status }}</div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Format</span>
                                <div class="format-badge">{{ selectedManga.format || 'Unknown' }}</div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Popularity</span>
                                <div class="modal-meta-value">{{ selectedManga.popularity || '-' }}</div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Average Score</span>
                                <div class="modal-score">
                                    <span class="score-value">{{ selectedManga.averageScore ? selectedManga.averageScore + '%' : '-' }}</span>
                                </div>
                            </div>
                            <div class="modal-meta-row">
                                <span class="modal-meta-label">Released</span>
                                <div class="modal-meta-value">{{ selectedManga.startDate ? selectedManga.startDate.year : '-' }}</div>
                            </div>
                            <div class="modal-meta-row" id="modalHistoryRow">
                                <span class="modal-meta-label">History</span>
                                <div class="modal-history-actions">
                                    <button class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 11px;">Show Chapters</button>
                                    <button class="btn btn-primary btn-sm" style="padding: 2px 8px; font-size: 11px;" title="Mark all chapters as read up to total">✓ Mark All Read</button>
                                </div>
                                <div id="modalReadChaptersList" class="modal-chapters-list" style="display: none;">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-main">
                        <h2>{{ selectedManga.title }}</h2>
                        <div class="modal-synonyms" v-if="selectedManga.synonyms && selectedManga.synonyms.length">
                            Alternative Titles: {{ selectedManga.synonyms.slice(0, 3).join(', ') }}
                        </div>
                        <div class="modal-genres">
                            <span v-for="genre in selectedManga.genres" :key="genre" class="genre-tag">{{ genre }}</span>
                        </div>
                        
                        <div class="modal-description">
                            <h3>Synopsis</h3>
                            <p v-html="selectedManga.description || 'No description available.'"></p>
                        </div>
                        
                        <div class="modal-external-links">
                            <a v-if="selectedManga.idMal" :href="'https://myanimelist.net/manga/' + selectedManga.idMal" target="_blank" class="external-link">MAL</a>
                            <a v-if="selectedManga.id" :href="'https://anilist.co/manga/' + selectedManga.id" target="_blank" class="external-link">AniList</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useSettings } from '@/composables/useSettings';
import { useLibrary } from '@/composables/useLibrary';

// Import Legacy Styles
import '@/assets/styles/legacy/main.css';

const currentTab = ref('settings');
const { settings, updateSettings, loadSettings } = useSettings();
const { 
    filteredEntries, 
    stats, 
    searchQuery, 
    statusFilter, 
    sortBy, 
    sortDesc,
    updateStatus,
    removeEntry
} = useLibrary();

// --- Sync Settings ---
const syncSettings = ref({
    autoSync: false,
    customBookmarks: false,
    customBorderSize: false,
    markHomePage: false
});

const isSyncing = ref(false);
const lastSyncDate = ref(null);

/** Maps Vue keys to legacy storage keys */
const syncStorageKeyMap = {
    autoSync: 'AutoSyncfeatureEnabled',
    customBookmarks: 'CustomBookmarksfeatureEnabled',
    customBorderSize: 'CustomBorderSizefeatureEnabled',
    markHomePage: 'MarkHomePagefeatureEnabled'
};

/**
 * Loads sync settings from chrome.storage.local
 */
async function loadSyncSettings() {
    const keys = [...Object.values(syncStorageKeyMap), 'SyncLastDate', 'customBookmarks'];
    const data = await chrome.storage.local.get(keys);
    
    Object.entries(syncStorageKeyMap).forEach(([vueKey, storageKey]) => {
        syncSettings.value[vueKey] = data[storageKey] ?? false;
    });
    
    lastSyncDate.value = data.SyncLastDate || null;
    customMarkers.value = data.customBookmarks || [];
}

/**
 * Saves a single sync setting to storage
 * @param {string} key - The Vue key for the setting
 */
function saveSyncSetting(key) {
    const storageKey = syncStorageKeyMap[key];
    if (storageKey) {
        chrome.storage.local.set({ [storageKey]: syncSettings.value[key] });
    }
}

/**
 * Triggers a manual bookmark sync
 */
function triggerSync() {
    isSyncing.value = true;
    chrome.runtime.sendMessage({ type: "scrapeBookmarks", value: 1 });
    
    setTimeout(() => {
        isSyncing.value = false;
        lastSyncDate.value = Date.now();
        chrome.storage.local.set({ SyncLastDate: lastSyncDate.value });
    }, 3000);
}

/**
 * Triggers a fresh sync (clears and rebuilds)
 */
function triggerFreshSync() {
    if (confirm('This will clear your library and rebuild from MangaFire bookmarks. Continue?')) {
        isSyncing.value = true;
        chrome.runtime.sendMessage({ type: "freshSync", value: true });
        
        setTimeout(() => {
            isSyncing.value = false;
            lastSyncDate.value = Date.now();
        }, 5000);
    }
}

/**
 * Formats sync date for display
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatSyncDate(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- Custom Markers ---
const customMarkers = ref([]);
const newMarkerName = ref('');
const newMarkerColor = ref('#a855f7');
const newMarkerStyle = ref('solid');

/**
 * Adds a new custom marker
 */
async function addMarker() {
    if (!newMarkerName.value.trim()) {
        alert('Please enter a marker name.');
        return;
    }
    
    const newMarker = {
        name: newMarkerName.value.trim(),
        color: newMarkerColor.value,
        style: newMarkerStyle.value
    };
    
    customMarkers.value.push(newMarker);
    await chrome.storage.local.set({ customBookmarks: customMarkers.value });
    
    // Reset inputs
    newMarkerName.value = '';
    console.log('[Options] Added custom marker:', newMarker.name);
}

/**
 * Removes a marker by index
 * @param {number} index - Marker index to remove
 */
async function removeMarker(index) {
    if (confirm(`Remove marker "${customMarkers.value[index].name}"?`)) {
        const removed = customMarkers.value.splice(index, 1);
        await chrome.storage.local.set({ customBookmarks: customMarkers.value });
        console.log('[Options] Removed marker:', removed[0].name);
    }
}

/**
 * Resets all custom markers
 */
async function resetMarkers() {
    if (confirm('Remove all custom markers?')) {
        customMarkers.value = [];
        await chrome.storage.local.remove('customBookmarks');
        console.log('[Options] All markers removed');
    }
}

// --- Theme Selection ---
const currentTheme = ref('dark');

/**
 * Selects and applies a preset theme
 * @param {string} themeName - Theme identifier
 */
function selectTheme(themeName) {
    currentTheme.value = themeName;
    applyPresetTheme(themeName);
    
    // Save to storage
    localStorage.setItem('theme', themeName);
    chrome.storage.local.set({ theme: themeName, isCustomTheme: false });
    console.log('[Options] Theme switched to:', themeName);
}

/**
 * Applies a preset theme by adding CSS class
 * @param {string} theme - Theme name
 */
function applyPresetTheme(theme) {
    const html = document.documentElement;
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode', 'glassy-mode');
    
    if (theme === 'light') {
        html.classList.add('light-mode');
    } else if (theme === 'glassy') {
        html.classList.add('glassy-mode');
    } else {
        html.classList.add(`${theme}-mode`);
    }
}

/**
 * Loads saved theme from storage
 */
async function loadTheme() {
    const data = await chrome.storage.local.get(['theme', 'isCustomTheme']);
    if (!data.isCustomTheme && data.theme) {
        currentTheme.value = data.theme;
        applyPresetTheme(data.theme);
    }
}

// --- Settings Logic ---
// Load settings on mount
onMounted(async () => {
    await loadSettings();
    await loadSyncSettings();
    await loadTheme();
    console.log('Settings loaded:', settings.value);
    applyVisualSettings();

    // Scroll to top listener
    window.addEventListener('scroll', handleScroll);
});

// Auto-save settings on change
watch(settings, async (newSettings) => {
    await updateSettings(newSettings);
    applyVisualSettings();
}, { deep: true });

function applyVisualSettings() {
    const theme = settings.value.appearance.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply accent color if custom
    // Assuming legacy CSS uses --primary variable
    // If accentColor is not in settings schema yet, we skip or add it. 
    // Checking schema later, but for now let's assume standard behavior.
    if (settings.value.appearance.accentColor) {
        document.documentElement.style.setProperty('--primary', settings.value.appearance.accentColor);
        // Also might need to generate RGB values for alpha opacity if legacy CSS uses --primary-rgb
    }
}


// --- Library Logic ---

// Computed properties for binding filters to inputs
// (Since useLibrary exposes refs, we can bind v-model directly to them in many cases,
// but for some select elements we might want computed wrappers if the values don't match exactly)

const librarySortModel = computed({
    get: () => {
        if (sortBy.value === 'title') return sortDesc.value ? 'title-desc' : 'title-asc';
        if (sortBy.value === 'popularity') return sortDesc.value ? 'pop-desc' : 'pop-asc'; // Assuming 'popularity' is the key
        if (sortBy.value === 'averageScore') return 'score-desc';
        // ... map other sort options
        return 'lastReadDate-desc'; // default
    },
    set: (val) => {
        const [field, dir] = val.split('-');
        if (field === 'title') sortBy.value = 'title';
        else if (field === 'pop') sortBy.value = 'popularity';
        else if (field === 'score') sortBy.value = 'averageScore';
        else if (field === 'rating') sortBy.value = 'personalData.rating'; // complex path?
        else if (field === 'added') sortBy.value = 'createdAt';
        else if (field === 'last') sortBy.value = 'lastReadDate'; // specific handling
        
        sortDesc.value = (dir === 'desc');
    }
});

// Helper for image URLs
function getCoverImage(entry) {
    return entry.coverImage || entry.cover || 'assets/images/placeholder.jpg'; // Adjust placeholder path
}

// Helper for date formatting
function formatDate(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString();
}

// Redirect helpers
// Redirect helpers
function openManga(url) {
    if (url) window.open(url, '_blank');
}

// --- Modal Logic ---
const selectedManga = ref(null);
const modalVisible = ref(false);

function openModal(entry) {
    selectedManga.value = entry;
    modalVisible.value = true;
}

function closeModal() {
    modalVisible.value = false;
    selectedManga.value = null;
}

// --- Import / Export Logic (Legacy-style) ---
const EXPORT_CATEGORIES = {
    library: {
        keys: ['savedEntriesMerged', 'userBookmarks'],
        label: 'Library Entries'
    },
    history: {
        keys: ['savedReadChapters'],
        label: 'Reading History'
    },
    settings: {
        keys: [
            'CustomBorderSize', 'MarkHomePagefeatureEnabled', 'SyncandMarkReadfeatureEnabled',
            'CustomBookmarksfeatureEnabled', 'AutoSyncfeatureEnabled', 'CustomBorderSizefeatureEnabled',
            'FamilyFriendlyfeatureEnabled', 'SmartAutoCompletefeatureEnabled', 'MangaDexHighlightEnabled',
            'WebtoonsHighlightfeatureEnabled', 'theme', 'customBookmarks', 'NewTabDashboardfeatureEnabled'
        ],
        label: 'Settings'
    },
    personalData: {
        keys: ['libraryPersonalData', 'libraryUserTags'],
        label: 'Tags, Notes & Ratings'
    },
    cache: {
        keys: ['anilistCache', 'mangadexCache'],
        label: 'API Cache'
    }
};

const exportOptions = ref({
    library: true,
    history: true,
    settings: true,
    personal: true,
    cache: false
});

const importMerge = ref(true);
const selectedImportFile = ref(null);

/**
 * Exports data based on selected options to a JSON file
 */
async function exportData() {
    const keysToExport = ['LastBackupDate'];

    if (exportOptions.value.library) keysToExport.push(...EXPORT_CATEGORIES.library.keys);
    if (exportOptions.value.history) keysToExport.push(...EXPORT_CATEGORIES.history.keys);
    if (exportOptions.value.settings) keysToExport.push(...EXPORT_CATEGORIES.settings.keys);
    if (exportOptions.value.personal) keysToExport.push(...EXPORT_CATEGORIES.personalData.keys);
    if (exportOptions.value.cache) keysToExport.push(...EXPORT_CATEGORIES.cache.keys);

    if (keysToExport.length === 1) {
        alert('Please select at least one data category to export.');
        return;
    }

    const data = await chrome.storage.local.get(keysToExport);
    
    // Add export metadata
    data._exportMeta = {
        version: '4.0.0',
        exportDate: new Date().toISOString(),
        categories: {
            library: exportOptions.value.library,
            history: exportOptions.value.history,
            settings: exportOptions.value.settings,
            personalData: exportOptions.value.personal,
            cache: exportOptions.value.cache
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mangafire_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await chrome.storage.local.set({ LastBackupDate: Date.now() });
    console.log('[Options] Data exported successfully');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedImportFile.value = file;
    }
}

function triggerFileInput() {
    const input = document.getElementById('importDataInput');
    if (input) input.click();
}

/**
 * Decodes HTML entities in a string
 */
function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

/**
 * Parses MAL XML export file into userBookmarks format
 */
function parseMALXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const mangaNodes = xmlDoc.querySelectorAll("manga");
    
    if (mangaNodes.length === 0) {
        throw new Error("No manga entries found in XML.");
    }

    const userBookmarks = Array.from(mangaNodes).map(node => {
        const titleNode = node.querySelector("manga_title");
        const statusNode = node.querySelector("my_status");
        const readChaptersNode = node.querySelector("my_read_chapters");
        
        let title = titleNode ? decodeHTMLEntities(titleNode.textContent.trim()) : "Unknown Title";
        let status = statusNode ? statusNode.textContent.trim() : "Reading";
        let readChapters = readChaptersNode ? parseInt(readChaptersNode.textContent.trim()) || 0 : 0;

        // Normalize status
        if (status === "On-Hold") status = "On Hold";
        if (status === "Plan to Read") status = "Plan to Read";
        if (status === "Completed") status = "Completed";
        
        return { title, status, readChapters };
    });

    return { userBookmarks };
}

/**
 * Starts the import process - handles both JSON and MAL XML
 */
async function startImport() {
    if (!selectedImportFile.value) return;

    const file = selectedImportFile.value;
    const isJSON = file.type === "application/json" || file.name.endsWith(".json");
    const isXML = file.type === "text/xml" || file.type === "application/xml" || file.name.endsWith(".xml");

    if (!isJSON && !isXML) {
        alert("Please select a valid JSON or XML file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let importedData;
            
            if (isJSON) {
                importedData = JSON.parse(e.target.result);
            } else if (isXML) {
                importedData = parseMALXML(e.target.result);
            }

            if (!importedData) {
                throw new Error("Failed to parse data");
            }

            // Show confirmation with stats
            const stats = {
                libraryEntries: (importedData.savedEntriesMerged?.length || 0) + (importedData.userBookmarks?.length || 0),
                historyTitles: importedData.savedReadChapters ? Object.keys(importedData.savedReadChapters).length : 0,
                hasSettings: Object.keys(importedData).some(k => EXPORT_CATEGORIES.settings.keys.includes(k))
            };

            let summary = `📁 Import Preview\n\n`;
            summary += `📚 Library: ${stats.libraryEntries} entries\n`;
            summary += `📖 History: ${stats.historyTitles} titles\n`;
            summary += `⚙️ Settings: ${stats.hasSettings ? 'Included' : 'Not included'}\n\n`;
            summary += `Mode: ${importMerge.value ? 'MERGE (keeps existing data)' : 'OVERWRITE (replaces all data)'}`;

            if (!importMerge.value) {
                summary += '\n\n⚠️ WARNING: This will delete all your current data!';
            }

            if (confirm(summary + '\n\nProceed with import?')) {
                // Remove metadata before storing
                delete importedData._exportMeta;

                if (importMerge.value) {
                    await processMergeImport(importedData);
                } else {
                    await processOverwriteImport(importedData);
                }

                alert('✅ Import successful! The page will now reload.');
                location.reload();
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import data: ' + error.message);
        }
    };
    reader.readAsText(file);
}

/**
 * Overwrites all data with imported data
 */
async function processOverwriteImport(data) {
    await chrome.storage.local.clear();
    await chrome.storage.local.set(data);
    console.log('[Options] Data imported (Overwrite) successfully');
}

/**
 * Merges imported data with existing data
 */
async function processMergeImport(data) {
    const currentData = await chrome.storage.local.get(null);
    const mergedData = { ...currentData, ...data };

    // Special handling for userBookmarks to avoid duplicates
    if (data.userBookmarks && currentData.userBookmarks) {
        const bookmarkMap = new Map();
        currentData.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
        data.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
        mergedData.userBookmarks = Array.from(bookmarkMap.values());
    }

    // Merge savedEntriesMerged
    if (data.savedEntriesMerged && currentData.savedEntriesMerged) {
        const entryMap = new Map();
        currentData.savedEntriesMerged.forEach(e => entryMap.set(e.title.toLowerCase(), e));
        data.savedEntriesMerged.forEach(e => entryMap.set(e.title.toLowerCase(), e));
        mergedData.savedEntriesMerged = Array.from(entryMap.values());
    }

    // Merge custom markers
    if (data.customBookmarks && currentData.customBookmarks) {
        const markerMap = new Map();
        currentData.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
        data.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
        mergedData.customBookmarks = Array.from(markerMap.values());
    }

    // Merge reading history
    if (data.savedReadChapters && currentData.savedReadChapters) {
        const mergedHistory = { ...currentData.savedReadChapters };
        Object.entries(data.savedReadChapters).forEach(([key, chapters]) => {
            if (mergedHistory[key]) {
                mergedHistory[key] = [...new Set([...mergedHistory[key], ...chapters])];
            } else {
                mergedHistory[key] = chapters;
            }
        });
        mergedData.savedReadChapters = mergedHistory;
    }

    await chrome.storage.local.set(mergedData);
    console.log('[Options] Data imported (Merge) successfully');
}


// --- Scroll To Top ---
const showScrollTop = ref(false);

function handleScroll() {
    showScrollTop.value = window.scrollY > 300;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

</script>

<style>
/* Scoped overrides if necessary, but mostly relying on legacy CSS */
/* Ensure Vue transitions work if used */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Sync Actions */
.sync-actions {
  margin-top: 10px;
}

.sync-buttons-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.sync-status {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 10px;
}

/* Custom Markers */
.marker-creator {
  margin-top: 10px;
}

.marker-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.color-picker-sm {
  width: 40px;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
}

.markers-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.marker-pill {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
}

.marker-pill:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

/* Theme Selection Fix */
.theme-preview-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-preview-card:hover {
  transform: translateY(-2px);
}

.theme-preview-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary);
}

/* Divider */
.divider {
  height: 1px;
  background: var(--border-color);
  margin: 16px 0;
}
</style>
