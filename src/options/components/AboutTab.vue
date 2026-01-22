<template>
    <div id="tab-about" class="tab-pane fade-in">
        <header class="header">
            <div class="header-text">
                <h1>About</h1>
                <p class="subtitle">Information, usage guide, and credits.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Project Info Card (Restored) -->
            <div class="card">
                <div class="card-body prose">
                    <h2>MangaFire Bookmark Color Marker</h2>
                    <p>A powerful Chrome Extension for <a href="https://mangafire.to/home"
                            target="_blank">MangaFire.to</a> that enhances your browsing experience by
                        automatically highlighting manga based on your bookmarks and reading history.</p>

                    <h3>🚀 Why Use This?</h3>
                    <p>Finding new manga to read can be frustrating when you can't instantly see what you've
                        already read or saved. MangaFire's default interface doesn't always make this clear
                        at a
                        glance.</p>
                    <p><strong>Bookmark Color Marker</strong> solves this by visually tagging manga covers
                        with
                        colored borders corresponding to their status (e.g., Reading, Completed, Plan to
                        Read)
                        directly on the browsing pages.</p>

                    <hr class="divider">

                    <h3>✨ Features</h3>
                    <ul class="feature-list">
                        <li><strong>Automatic Highlighting</strong>: Instantly spot your saved manga with
                            custom
                            colored borders.</li>
                        <li><strong>Custom Statuses</strong>: Create your own bookmark categories with
                            unique
                            names, colors, and border styles.</li>
                        <li><strong>History Sync</strong>: Optionally highlight manga that are in your
                            reading
                            history but not bookmarked.</li>
                        <li><strong>Visual Customization</strong>: Adjust border thickness and style (Solid,
                            Dashed, Dotted, etc.).</li>
                    </ul>

                    <hr class="divider">

                    <h3>📖 How to Use</h3>
                    <ol class="usage-list">
                        <li><strong>Sync Data</strong>: Click 'Sync Bookmarks Now' in the Settings tab
                            (requires
                            login to MangaFire).</li>
                        <li><strong>Browse</strong>: Visit MangaFire.to. Your lists will be highlighted!
                        </li>
                        <li><strong>Customize</strong>: Use the Settings tab to add new markers (e.g.
                            "Favorites" in Gold).</li>
                    </ol>

                    <hr class="divider">

                    <div class="alert-box">
                        <p><strong>Disclaimer:</strong> This is an unofficial extension and is not
                            affiliated
                            with MangaFire.to.</p>
                    </div>

                    <hr class="divider">

                    <h3>🔒 Privacy & Security</h3>
                    <p>Your privacy is our priority. This extension is designed with a **privacy-first**
                        approach:</p>
                    <ul class="feature-list">
                        <li><strong>Local Storage</strong>: All bookmarked manga, reading history, and
                            settings
                            are stored locally on your device using `chrome.storage.local`.</li>
                        <li><strong>No External Servers</strong>: We do not maintain any external servers.
                            Your
                            data never leaves your browser, except when you manually export it or sync with
                            AniList (which goes directly to AniList APIs).</li>
                        <li><strong>No Tracking</strong>: There are no trackers, analytics, or behavioral
                            monitoring scripts in this extension.</li>
                        <li><strong>Open Permissions</strong>: We only request permissions necessary for the
                            extension to function (e.g., access to `mangafire.to` for highlighting).</li>
                    </ul>
                </div>
            </div>

            <!-- User Guide Header -->
            <div class="section-title-full">
                <h2 class="section-label">User Guide & Feature Help</h2>
            </div>

            <!-- Guide Grid -->
            <div class="guide-grid">
                <GuideCard id="guide-sync" title="Auto Sync" icon="🔄">
                    Automatically retrieves your latest bookmarks from MangaFire. You can set the interval (in days) for how often the background sync should trigger. Requires you to be logged into the site.
                </GuideCard>

                <GuideCard id="guide-markers" title="Custom Markers" icon="🎨">
                    Go beyond default statuses! Create markers like "Favorite", "Top Tier", or "To-Read". You can customize the color and border style (dashed, double, etc.) for each marker.
                </GuideCard>

                <GuideCard id="guide-general" title="General Preferences" icon="⚙️">
                    Toggle <b>Mark Homepage</b> to see highlights on the front page. Use <b>Sync & Mark Read</b> to track history. <b>Family Friendly</b> mode hides entries with adult-only tags.
                </GuideCard>

                <GuideCard id="guide-entries" title="Saved Entries" icon="📚">
                    Your local manga library. Synchronize with AniList to get cover images and metadata. Use filters to browse your collection by status, format, or name.
                </GuideCard>

                <GuideCard id="guide-backup" title="Backup & Restore" icon="💾">
                    Always keep a backup! <b>Export</b> saves your bookmarks, settings, and cache. <b>Import</b> allows you to restore data or merge backups from different devices.
                </GuideCard>

                <GuideCard id="guide-personalization" title="Personalization" icon="🌙">
                    Switch between light and dark modes in the sidebar. You can also adjust the thickness of the manga highlight borders to suit your visual preference.
                </GuideCard>

                <GuideCard id="guide-dashboard" title="Dashboard Settings" icon="📊">
                    Enable or disable the <b>Manga Dashboard</b> new tab page. Use <b>Packed Layout</b> to show more detailed statistics if you have many entries.
                </GuideCard>

                <GuideCard id="guide-styles" title="Highlight Styles" icon="🖼️">
                    Customize the default appearance of highlights. Choose between <b>Solid, Dashed, Dotted</b> styles and adjust the <b>Border Thickness</b> for better visibility.
                </GuideCard>

                <GuideCard id="guide-fresh-sync" title="Fresh Sync" icon="⚡">
                    Use the <b>Fresh Sync Entries</b> button in the Saved Entries tab to completely rebuild your library metadata and covers from AniList. <i>Note: This clears the local library cache first.</i>
                </GuideCard>
            </div>

            <!-- Support Developer Section (Perfected) -->
            <div class="support-dev-card glass-card">
                <div class="card-body">
                    <div class="support-header">
                        <div class="support-icon">☕</div>
                        <h2>Support the Development</h2>
                    </div>
                    <p class="description">If you enjoy using this extension and want to support its further
                        development, consider buying me a coffee! Your support helps keep the project alive,
                        ad-free, and always evolving with new requested features.</p>
                    <div class="support-links-group">
                        <a href="https://www.buymeacoffee.com" target="_blank"
                            class="btn btn-primary support-btn">
                            <span class="btn-icon">☕</span> Buy me a Coffee
                        </a>
                        <a href="https://github.com/sponsors/yourprofile" target="_blank"
                            class="btn btn-ghost support-btn">
                            <span class="btn-icon">💖</span> GitHub Sponsor
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import GuideCard from './common/GuideCard.vue';
</script>

<style scoped>
/* About Page styles - migrated from _about.css */
.prose {
    color: var(--text-primary);
    line-height: 1.6;
}

.prose h2 {
    font-size: 24px;
    margin-bottom: 8px;
    color: var(--accent-primary);
}

.prose h3 {
    font-size: 18px;
    margin-top: 24px;
    margin-bottom: 12px;
    font-weight: 600;
}

.prose p {
    margin-bottom: 16px;
    color: var(--text-secondary);
}

.prose a {
    color: var(--accent-primary);
    text-decoration: none;
    font-weight: 500;
}

.prose a:hover {
    text-decoration: underline;
}

.prose ul,
.prose ol {
    margin-bottom: 16px;
    padding-left: 20px;
    color: var(--text-secondary);
}

.prose li {
    margin-bottom: 8px;
}

.prose strong {
    color: var(--text-primary);
}

.divider {
    border: 0;
    height: 1px;
    background: var(--border-color);
    margin: 30px 0;
}

.alert-box {
    background-color: rgba(255, 181, 71, 0.1);
    border-left: 4px solid var(--warning, #FFB547);
    padding: 16px;
    border-radius: var(--radius-sm, 6px);
    color: var(--text-secondary);
}

.alert-box p {
    margin-bottom: 0;
}

.guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.section-title-full {
    grid-column: 1 / -1;
    margin-top: 30px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
}

.guide-card {
    height: auto;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, box-shadow 0.2s;
}

.guide-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.guide-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
}

.guide-text b {
    color: var(--text-primary);
}

/* Support Dev Card */
.support-dev-card {
    margin-top: 40px;
    background: linear-gradient(135deg, rgba(117, 81, 255, 0.1) 0%, rgba(67, 24, 255, 0.05) 100%);
    border: 1px solid rgba(117, 81, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-lg, 16px);
}

.support-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.support-header h2 {
    margin: 0 !important;
    font-size: 22px !important;
    background: linear-gradient(45deg, var(--accent-primary), #6AD2FF);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.support-icon {
    font-size: 28px;
    width: 50px;
    height: 50px;
    background: rgba(117, 81, 255, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.support-links-group {
    display: flex;
    gap: 15px;
    margin-top: 25px;
}

.support-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 48px;
    font-weight: 600;
}

@media (max-width: 768px) {
    .guide-grid {
        grid-template-columns: 1fr;
    }
}
</style>
