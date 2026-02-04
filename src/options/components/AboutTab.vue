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
                    <h2>Cross Platform content manager</h2>
                    <p>A powerful Chrome Extension designed for <a href="https://mangafire.to/home"
                            target="_blank">MangaFire.to</a> and other popular manga reading sites that enhances your browsing experience by
                        automatically highlighting manga based on your bookmarks and reading history, tracking your progress across platforms and more.</p>

                    <h3>Why Use This?</h3>
                    <p>you can sync your progress across multiple platforms and devices, and you can also track your reading history and bookmarks.
                        Along with quality of life improvements injected into the website your reading from like status color bordering.
                    </p>
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
                        <li><strong>Quick actions overlay</strong>: Hover over any manga to quickly manage it with quick actions.</li>
                        <li><strong>Customization</strong>: over 50 settings or switches to customize your experience.</li>
                        <li><strong>Internal library</strong>: Keep track of all the manga you've read and bookmarked and filter them anytime.</li>
                    </ul>

                    <hr class="divider">

                    <h3>📖 How to Use</h3>
                    <ol class="usage-list">
                        <li><strong>Import Data</strong>: if your preferred site supports export you can get all the data immidietly.</li>
                        <li><strong>Passive tracking</strong>: The extension will track your reading history and bookmarks automatically.</li>
                        <li><strong>Customize</strong>: In the settings or appearance tab set your own rules on what the extension is doing or visual style.</li>
                        <li><strong>Read like before</strong>: this is only for quality of life improvements, you can still read like before on your deisred site.</li>
                    </ol>

                    <hr class="divider">

                    <div class="alert-box">
                        <p><strong>Disclaimer:</strong> This is an unofficial extension and is not
                            affiliated
                            with MangaFire.to or any other site.</p>
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

            <!-- Supported pages Header -->
            <div class="section-title-full">
                <h2 class="section-label">Supported pages</h2>
            </div>

            <!-- Supported pages -->
            <div class="supported-sites-grid">
                <a href="https://mangafire.to" target="_blank" class="site-link-card">
                    <img src="https://www.google.com/s2/favicons?domain=mangafire.to&sz=32" alt="MangaFire" class="site-icon">
                    <div class="site-info">
                        <span class="site-name">MangaFire</span>
                        <span class="site-url">mangafire.to</span>
                    </div>
                </a>
                <a href="https://mangadex.org" target="_blank" class="site-link-card">
                    <img src="https://www.google.com/s2/favicons?domain=mangadex.org&sz=32" alt="MangaDex" class="site-icon">
                    <div class="site-info">
                        <span class="site-name">MangaDex</span>
                        <span class="site-url">mangadex.org</span>
                    </div>
                </a>
                <a href="https://asuracomic.net" target="_blank" class="site-link-card">
                    <img src="https://www.google.com/s2/favicons?domain=asuracomic.net&sz=32" alt="Asura Scans" class="site-icon">
                    <div class="site-info">
                        <span class="site-name">Asura Scans</span>
                        <span class="site-url">asuracomic.net</span>
                    </div>
                </a>
                <a href="https://webtoon.com" target="_blank" class="site-link-card">
                    <img src="https://www.google.com/s2/favicons?domain=webtoon.com&sz=32" alt="Webtoons" class="site-icon">
                    <div class="site-info">
                        <span class="site-name">Webtoons</span>
                        <span class="site-url">webtoon.com</span>
                    </div>
                </a>
                <a href="https://manganato.com" target="_blank" class="site-link-card">
                    <img src="https://www.google.com/s2/favicons?domain=manganato.com&sz=32" alt="Manganato" class="site-icon">
                    <div class="site-info">
                        <span class="site-name">Manganato</span>
                        <span class="site-url">manganato.com</span>
                    </div>
                </a>
                <a href="https://mangaplus.com" target="_blank" class="site-link-card">
                    <img src="https://www.google.com/s2/favicons?domain=mangaplus.com&sz=32" alt="MangaPlus" class="site-icon">
                    <div class="site-info">
                        <span class="site-name">MangaPlus</span>
                        <span class="site-url">mangadex.org</span>
                    </div>
                </a>
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
                    Create markers like "Favorite", "Top Tier", or "To-Read". You can customize the color and border style (dashed, double, etc.) for each marker. For when your prefered website allows custom markers/folders.
                </GuideCard>

                <GuideCard id="guide-general" title="General Preferences" icon="⚙️">
                    Toggle <b>Mark Homepage</b> to see highlights on the front page. Use <b>Sync & Mark Read</b> to track history. <b>Family Friendly</b> mode hides entries with adult-only tags.
                </GuideCard>

                <GuideCard id="guide-websites" title="Website Preferences" icon="⚙️">
                    Specific settings that only change extensions behaviour on specific websites (e.x.  set higlighter border thicknes that is dependant on website).
                </GuideCard>

                <GuideCard id="guide-entries" title="Saved Entries" icon="📚">
                    Your local manga library. Synchronizes with AniList + Mangadex to get all the data needed. Use filters to browse your collection and inspect or manage your content and reading history.
                </GuideCard>

                <GuideCard id="guide-backup" title="Backup & Restore" icon="💾">
                    <b>Export</b> Downloads a file with every single information saved by extension <b>Import</b> allows you to restore exported data or use export from other websites to merge data.
                </GuideCard>

                <GuideCard id="guide-mangadex-import" title="MangaDex Import" icon="ℹ️">
                   Importing from MangaDex requires fetching data directly from their website. <strong>You will be temporarily redirected</strong> to <em>mangadex.org</em> to retrieve your list securely. Please ensure you are logged in if your list is private (Private lists are not supported yet, public only).
                </GuideCard>

                <GuideCard id="guide-personalization" title="Personalization" icon="🌙">
                    everything that changes the look or adds/removes features of extension itself is in Appearance tab. it will not affect any other website.
                </GuideCard>

                <GuideCard id="guide-dashboard" title="Dashboard Settings" icon="📊">
                    <b>Manga Dashboard</b> replaces every new tab you open. Use <b>Packed Layout</b> to show more detailed statistics if you have many entries. 
                </GuideCard>

                <GuideCard id="guide-styles" title="Highlight Styles" icon="🖼️">
                    Customize the default appearance of highlights. Choose between <b>Solid, Dashed, Dotted</b> styles and adjust the <b>Border Thickness</b> for better visibility.
                </GuideCard>

                <GuideCard id="guide-fresh-sync" title="Fresh Sync" icon="⚡">
                    Use the <b>Fresh Sync Entries</b> button in the Saved Entries tab to completely rebuild your library metadata and covers from AniList. <i>Note: This clears the local library cache first.</i>
                </GuideCard>
            </div>

            <!-- Support Developer Section -->
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

.supported-sites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 10px;
}

.site-link-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-link-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent-primary);
    box-shadow: 0 4px 12px rgba(67, 24, 255, 0.1);
    background: var(--bg-body);
}

.site-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: white;
    padding: 2px;
}

.site-info {
    display: flex;
    flex-direction: column;
}

.site-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
}

.site-url {
    font-size: 12px;
    color: var(--text-secondary);
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
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
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
