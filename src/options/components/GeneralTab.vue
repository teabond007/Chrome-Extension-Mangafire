<template>
    <div id="tab-settings" class="tab-pane active fade-in">
        <header class="header">
            <div class="header-text">
                <h1>Settings</h1>
                <p class="subtitle">Configure your custom bookmarks for MangaFire.to, manage sync, and display
                    preferences.</p>
            </div>
        </header>

        <div class="content-grid">

            <!-- Card 0: General Preferences -->
            <SettingsCard 
                title="General Preferences" 
                icon="⚙️" 
                guide-target="guide-general"
            >
                <div class="input-group-row">
                    <SwitchControl 
                        id="MarkHomePage" 
                        label="Mark Homepage" 
                        sub-label="Highlight manga on the homepage"
                    />
                    <SwitchControl 
                        id="MangaFireQuickActions" 
                        label="Quick Actions Overlay" 
                        sub-label="Show 'Continue', 'Status', 'Rating' on hover"
                    />
                    <SwitchControl 
                        id="MangaFireShowProgress" 
                        label="Show Reading Badges" 
                        sub-label="Display 'Ch. X/Y' on manga cards"
                    />
                    <SwitchControl 
                        id="SyncandMarkRead" 
                        label="Sync & Mark Read" 
                        sub-label="Sync history and mark as read" 
                    />
                    <SwitchControl 
                        id="FamilyFriendly" 
                        label="Family Friendly" 
                        sub-label="Hide Ecchi/Adult content" 
                    />

                    <div class="feature-toggle-wrapper">
                        <div class="toggle-label-group">
                            <label class="toggle-main-label">Reading History</label>
                            <span class="toggle-sub-label">Stored dashboard URLs</span>
                        </div>
                        <button id="ClearReadingHistoryBtn" class="btn btn-ghost btn-sm"
                            style="margin-top: 5px;">
                            Clear History
                        </button>
                    </div>
                </div>
            </SettingsCard>
            
            <!-- Row 1: Smart Automation & Reader Enhancements -->
            <div class="cards-row">
                <SettingsCard 
                    title="Smart Automation" 
                    icon="⚡" 
                    icon-bg="rgba(79, 70, 229, 0.1)"
                    icon-color="var(--primary)"
                    guide-target="guide-general"
                    full-height
                >
                    <SwitchControl 
                        id="SmartAutoComplete" 
                        label="Smart Auto-Complete" 
                        sub-label="Mark as 'Completed' when reaching last chapter"
                    />
                    <SwitchControl 
                        id="SmartInactivityFade" 
                        label="Inactivity Dimming" 
                        sub-label="Dim 'Reading' manga untouched for 30+ days"
                        margin-top
                    />
                    <SwitchControl 
                        id="SmartResumeLink" 
                        label="Smart Resume" 
                        sub-label="Dashboard opens next chapter (Predictive)"
                        margin-top
                    />
                    <SwitchControl 
                        id="NotificationsEnabled" 
                        label="New Chapter Alerts" 
                        sub-label="Browser notifications for new releases"
                        margin-top
                    />
                </SettingsCard>

                <SettingsCard 
                    title="Reader Enhancements" 
                    icon="📚" 
                    icon-bg="rgba(16, 185, 129, 0.1)"
                    icon-color="#10b981"
                    guide-target="guide-reader"
                    full-height
                >
                    <SwitchControl 
                        id="AutoScrollEnabled" 
                        label="Auto-Scroll Panel" 
                        sub-label="Show floating auto-scroll controls on reader pages"
                    />
                    <SwitchControl 
                        id="KeybindsEnabled" 
                        label="Keyboard Shortcuts" 
                        sub-label="Arrow keys, Space (auto-scroll), F (fullscreen)"
                        margin-top
                    />
                    <SwitchControl 
                        id="ProgressTrackingEnabled" 
                        label="Auto-Save Progress" 
                        sub-label="Automatically save chapter progress while reading"
                        margin-top
                    />
                </SettingsCard>
            </div>

            <!-- Row 2: MangaDex & Webtoons Highlighting -->
            <div class="cards-row">
                <SettingsCard 
                    title="MangaDex Highlighting" 
                    icon="📖" 
                    icon-bg="rgba(255, 103, 64, 0.1)"
                    icon-color="#FF6740"
                    guide-target="guide-general"
                    full-height
                >
                    <SwitchControl 
                        id="MangaDexHighlightEnabled" 
                        label="Enable MangaDex Highlighting" 
                        sub-label="Show colored borders on mangadex.org"
                    />
                    <SwitchControl 
                        id="MangaDexShowProgress" 
                        label="Show Reading Progress" 
                        sub-label="Display 'Ch. X/Y' on saved manga cards"
                        margin-top
                    />
                </SettingsCard>

                <SettingsCard 
                    title="Webtoons Highlighting" 
                    icon="📺" 
                    icon-bg="rgba(0, 220, 100, 0.1)"
                    icon-color="#00DC64"
                    guide-target="guide-general"
                    full-height
                >
                    <SwitchControl 
                        id="WebtoonsHighlightEnabled" 
                        label="Enable Webtoons Highlighting" 
                        sub-label="Show colored borders on webtoons.com"
                    />
                    <SwitchControl 
                        id="WebtoonsShowProgress" 
                        label="Show Reading Progress" 
                        sub-label="Display 'Ep. X/Y' on saved webtoon cards"
                        margin-top
                    />

                    <div class="feature-toggle-wrapper" style="margin-top: 10px;">
                        <div class="toggle-label-group">
                            <label for="WebtoonsBorderSize" class="toggle-main-label">Border
                                Thickness</label>
                            <span class="toggle-sub-label">Customize highlight border size</span>
                        </div>
                        <label class="switch small-switch" title="Enable Custom Border Size">
                            <input type="checkbox" id="WebtoonsBorderSizeEnabled">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="input-wrapper" style="margin-top: 10px;">
                        <div class="range-slider-container">
                            <input type="range" id="WebtoonsBorderSizeSlider" min="1" max="10" value="4"
                                class="range-slider">
                            <span id="WebtoonsBorderSizeValue" class="range-value">4px</span>
                        </div>
                    </div>
                </SettingsCard>
            </div>


            <!-- Card 1: Custom Markers -->
            <SettingsCard 
                title="Custom Markers" 
                icon="🎨" 
                guide-target="guide-markers"
            >
                <div class="feature-toggle-header">
                    <span class="description" style="margin:0;">Add custom statuses beyond the
                        defaults.</span>
                    <label class="switch small-switch" title="Enable Custom Markers">
                        <input type="checkbox" id="CustomBookmarks">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div style="margin-top: 15px;"></div>

                <div class="input-group-row">
                    <div class="input-wrapper flex-grow">
                        <label for="bookmarkName">Marker Name</label>
                        <input type="text" id="bookmarkName" placeholder="e.g. Re-reading"
                            class="input-field">
                    </div>
                    <div class="input-wrapper">
                        <label for="colorBookmarks">Color</label>
                        <div class="color-picker-wrapper">
                            <input type="color" id="colorBookmarks" value="#ff0000">
                        </div>
                    </div>
                    <div class="input-wrapper">
                        <label for="customBorderStyleSelect">Border Style</label>
                        <select id="customBorderStyleSelect" class="select-field">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="double">Double</option>
                            <option value="groove">Groove</option>
                            <option value="ridge">Ridge</option>
                            <option value="inset">Inset</option>
                            <option value="outset">Outset</option>
                        </select>
                    </div>
                    <div class="input-wrapper input-button-wrapper">
                        <button id="addBookmarkButton" class="btn btn-primary btn-input-height">
                            + Add
                        </button>
                    </div>
                </div>

                <div class="active-markers-header">
                    <label class="section-label">ACTIVE MARKERS</label>
                    <button id="resetBookmarkButton" class="btn btn-ghost btn-sm">
                        Remove All
                    </button>
                </div>

                <div id="CustomBookmarksContainer" class="markers-container">
                    <!-- Bookmarks will be injected here -->
                </div>
            </SettingsCard>

            <!-- Row for smaller cards -->
            <div class="cards-row">
                <!-- Card 2: Auto Sync -->
                <SettingsCard 
                    title="Auto Sync" 
                    icon="🔄" 
                    guide-target="guide-sync" 
                    full-height
                >
                    <div class="feature-toggle-header">
                        <span class="description" style="margin:0">Automatically update bookmarks on site
                            visit.</span>
                        <label class="switch small-switch" title="Enable Auto Sync">
                            <input type="checkbox" id="AutoSync">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div style="margin-top: 15px;"></div>

                    <div class="input-wrapper">
                        <label for="AutoSyncSetDays">Sync Interval (Days)</label>
                        <div class="input-with-button">
                            <input type="number" id="AutoSyncSetDays" value="30" class="input-field">
                        </div>
                    </div>
                    <p id="logContainerSetDays" class="status-text"></p>

                    <div class="button-group bottom-align">
                        <button id="AutoSyncSetDaysButton" class="btn btn-primary">Save Interval</button>
                        <button id="AutoSyncSetDaysButtonReset" class="btn btn-ghost">Reset Default</button>
                    </div>
                </SettingsCard>

                <!-- Card 3: Dashboard Settings -->
                <SettingsCard 
                    title="Dashboard Settings" 
                    icon="📊" 
                    guide-target="guide-personalization" 
                    full-height
                >
                    <p class="description compact">Configure the appearance and behavior of your Manga
                        Dashboard.</p>
                    <SwitchControl 
                        id="NewTabDashboard" 
                        label="Enable Dashboard" 
                        sub-label="Replace new tab page"
                    />
                    <SwitchControl 
                        id="DashboardLayoutStyle" 
                        label="Packed Layout" 
                        sub-label="Show stats and more info" 
                        margin-top
                    />
                </SettingsCard>
            </div> <!-- End of cards-row -->

            <!-- Card 4: Quick Access Shortcuts (Stretched) -->
            <SettingsCard 
                title="Quick Access Shortcuts" 
                icon="🔗" 
                guide-target="guide-personalization"
            >
                <div class="card-body">
                    <p class="description">Customize the 5 shortcut circles on your Manga Dashboard.</p>
                    <div id="QuickAccessContainer" style="margin-top: 15px;">
                        <!-- Inputs generated by JS -->
                    </div>
                    <p id="logContainerQuickAccess" class="status-text"></p>
                    <div class="button-group" style="margin-top: 20px;">
                        <button id="SaveQuickAccessButton" class="btn btn-primary">Save Shortcuts</button>
                        <button id="ResetQuickAccessButton" class="btn btn-ghost">Reset to Defaults</button>
                    </div>
                </div>
            </SettingsCard>

            <div class="cards-row">
                <!-- Card 5: Manual Sync -->
                <SettingsCard 
                    title="Manual Synchronization" 
                    icon="⚠️" 
                    guide-target="guide-sync"
                    icon-bg="rgba(255, 171, 0, 0.1)"
                    icon-color="var(--warning)"
                    highlight
                >
                    <div class="card-body flex-row-center" style="padding-top: 0;">
                        <div class="info-section">
                            <ul class="info-list">
                                <li>Requires you to be logged into MangaFire.to</li>
                                <li>Saves your read history and highlights</li>
                                <li>Disabling sync prevents read status saving</li>
                            </ul>
                        </div>
                        <div class="action-section">
                            <button id="sendMessageBtnSyncBookmarks" class="btn btn-warning-large">
                                ⚡ Sync Bookmarks Now
                            </button>
                            <p class="tiny-text">Last synced: Check logs below</p>
                        </div>
                    </div>
                </SettingsCard>

                <!-- Log Container -->
                <div class="card bg-terminal" style="padding: 0;">
                    <div class="card-header"
                        style="padding: 12px 20px; margin-bottom: 0; border-bottom: 1px solid rgba(0, 255, 0, 0.1);">
                        <div class="card-icon"
                            style="background: rgba(0, 255, 0, 0.1); color: #00FF00; width: 30px; height: 30px; font-size: 16px;">
                            🔍</div>
                        <h3 style="font-size: 14px; color: #00FF00; margin: 0;">Debug Logs</h3>
                    </div>
                    <div id="logContainer" class="terminal-log"></div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import SwitchControl from './common/SwitchControl.vue';
import SettingsCard from './common/SettingsCard.vue';
</script>

<style scoped>
/* GeneralTab scoped styles */
.cards-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.input-group-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.feature-toggle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

.terminal-log {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;
    background: #0a0a0a;
}

.bg-terminal {
    background: #0a0a0a;
    border: 1px solid rgba(0, 255, 0, 0.2);
}
</style>
