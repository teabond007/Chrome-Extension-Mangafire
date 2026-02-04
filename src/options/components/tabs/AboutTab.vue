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
                    <h2>MangaFire & Multi-Site Content Manager</h2>
                    <p>A powerful Chrome Extension designed for <strong>MangaFire.to</strong>, <strong>MangaDex</strong>, <strong>Asura Scans</strong>, and <strong>Webtoons</strong>. It enhances your browsing experience by automatically highlighting manga based on your bookmarks, tracking your reading history across platforms, and syncing your library between devices.</p>

                    <h3>🚀 Why Use This?</h3>
                    <p>Reading across multiple sites can be disjointed. You lose track of chapters, and bookmarks are scattered. 
                    <strong>Content Manager</strong> solves this by:</p>
                    <ul>
                        <li><strong>Unifying your library</strong>: A single dashboard for all your manga, regardless of the source.</li>
                        <li><strong>Visual Tags</strong>: Injecting colored status borders (e.g., "Reading", "Plan to Read") directly onto the websites you browse.</li>
                        <li><strong>Cloud Sync</strong>: Seamless cross-device synchronization using your own <strong>Google Drive</strong>.</li>
                    </ul>

                    <hr class="divider">

                    <h3>✨ Key Features</h3>
                    
                    <h4>🌍 Cross-Platform Support</h4>
                    <ul class="feature-list">
                        <li><strong>Supported Sites</strong>: MangaFire, MangaDex, Asura Scans, Webtoons, Manganato, MangaPlus.</li>
                        <li><strong>Universal Tracking</strong>: Reading progress is saved automatically no matter which site you use.</li>
                    </ul>

                    <h4>☁️ Cloud Sync & Backup</h4>
                    <ul class="feature-list">
                        <li><strong>Google Drive Integration</strong>: Connect your Google Account to sync your library, history, and settings across all your computers.</li>
                        <li><strong>Private Data</strong>: Your data is stored in a private "App Data" folder in your Drive—secure and invisible to others.</li>
                        <li><strong>Conflict Resolution</strong>: Smart handling of data conflicts (Newer wins/Local wins/Cloud wins).</li>
                    </ul>

                    <h4>🎨 Visual & Reader Enhancements</h4>
                    <ul class="feature-list">
                        <li><strong>Smart Highlighting</strong>: Instantly spot your saved manga with custom colored borders while browsing.</li>
                        <li><strong>Quick Actions Overlay</strong>: Hover over covers on supported sites to update status or rating without leaving the page.</li>
                        <li><strong>Auto-Scroll</strong>: Hands-free reading with adjustable speed controls.</li>
                        <li><strong>Progress Tracking</strong>: Remembers your exact scroll position within chapters.</li>
                    </ul>

                    <h4>📊 Advanced Library Dashboard</h4>
                    <ul class="feature-list">
                        <li><strong>New Tab Dashboard</strong>: Optionally replaces your new tab page with a rich library overview and "Next Up" recommendations.</li>
                        <li><strong>Statistics</strong>: Visualize your reading habits with detailed charts (Format distribution, Status breakdown).</li>
                        <li><strong>Bulk Operations</strong>: Mass-update manga statuses or clean duplicates with one click.</li>
                        <li><strong>Smart Filters</strong>: Filter by Status, Format, Genre, Demographic, or "Binge-worthy" length.</li>
                    </ul>

                    <h4>🤖 Smart Automation</h4>
                    <ul class="feature-list">
                        <li><strong>Sync & Mark Read</strong>: Automatically detects when you read a chapter and updates your local library.</li>
                        <li><strong>Smart Resume</strong>: Predicts the next chapter you want to read and puts it one click away.</li>
                        <li><strong>Inactivity Fade</strong>: Visually dims entries you haven't touched in 30+ days.</li>
                    </ul>

                    <hr class="divider">

                    <h3>📖 Getting Started</h3>
                    <ol class="usage-list">
                        <li><strong>Import Data</strong>: If you have a list on MangaDex or AniList, use the <strong>Import</strong> tab to populate your library immediately.</li>
                        <li><strong>Browse</strong>: Go to any supported site (e.g., MangaFire). You'll see status markers on manga you've imported.</li>
                        <li><strong>Read</strong>: Open a chapter. The extension will automatically track your progress.</li>
                        <li><strong>Sync</strong>: Enable Google Drive sync in the <strong>Profile</strong> tab to keep your other devices in loop.</li>
                    </ol>
                    
                    <hr class="divider">

                    <h3>⚠️ Disclaimer</h3>
                    <ul>
                        <li>This is an <strong>unofficial</strong> tool and is not affiliated with any of the supported manga websites.</li>
                        <li>Use responsibly.</li>
                    </ul>

                    <hr class="divider">

                    <h3>🔒 Privacy & Security</h3>
                    <p>This extension is built with a <strong>Privacy-First</strong> approach:</p>
                    <ul class="feature-list">
                        <li><strong>Local-First</strong>: Primary database is stored in <code>chrome.storage.local</code>.</li>
                        <li><strong>User-Owned Cloud</strong>: Cloud sync uses <em>your</em> Google Drive. We assume no improved liability for external servers.</li>
                        <li><strong>No Tracking</strong>: No analytics, no behavioral tracking, no third-party data collection.</li>
                    </ul>

                    <hr class="divider">

                    <h3 id="guide-tos">⚖️ Terms of Service</h3>
                    <p>By using this extension, you agree to the following terms:</p>
                    <ul class="feature-list">
                        <li><strong>License & Usage</strong>: This software is free for personal use. You are strictly <strong>prohibited from selling, reselling, or commercially exploiting</strong> this extension or its source code. You may not repackage or redistribute this software claiming it as your own work.</li>
                        <li><strong>Data Ownership</strong>: You retain full ownership of your data. We do not access, collect, or sell your reading history or personal information.</li>
                        <li><strong>Liability</strong>: The software is provided "as is". We are not responsible for any data loss or issues arising from its use.</li>
                        <li><strong>Governing Law</strong>: These terms are governed by the laws of <strong>Slovenia</strong>.</li>
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

            <!-- Guide Section: General & Reading -->
            <h3 class="guide-section-header">General & Reading</h3>
            <div class="guide-grid">
                <GuideCard id="guide-general" title="General Preferences" icon="⚙️">
                    Global controls for how the extension interacts with content. <b>Mark Homepage</b> is Mangafire specific and just applys colored borders to the homepage. 
                    <b>Family friendly</b> is a feature that will hide any manga that is 18+ but it is not perfect and may not hide all of them.
                    <b>Quick actions</b> will add on manga hower button on extrernal sites.
                </GuideCard>

                <GuideCard id="guide-smart-automation" title="Smart Automation" icon="⚡">
                   Reduces manual tracking. <b>Sync & Mark Read</b> updates your history based on the URL you visit. 
                   <b>Smart Resume</b> predicts your next chapter on the dashboard so you can jump back in with one click.
                </GuideCard>

                <GuideCard id="guide-reader" title="Reader Enhancements" icon="📚">
                    Enhances the reading experience on supported sites. <b>Auto-Scroll</b> adds a floating control for hands-free reading. 
                    <b>Progress Tracking</b> saves your position within a chapter, allowing you to resume exactly where you left off even if you close the tab.
                </GuideCard>

                <GuideCard id="guide-markers" title="Custom Markers" icon="🎨">
                   Use markers when you need more than the standard statuses. They act as "virtual folders" or tags (e.g., "Favorite", "Top Tier"), allowing you to categorize entries 
                   and visualize them with unique border styles on supported websites without adhering to the site's own restrictions.
                </GuideCard>

                <GuideCard id="guide-websites" title="Website Specifics" icon="🌐">
                     Configurations here apply logic specific to individual platforms. For example, adjusting <b>Highlight Thickness</b> per site ensures borders look good 
                     regardless of the site's native thumbnail scaling or layout density.
                </GuideCard>
            </div>

          

            <!-- Guide Section: Appearance & Dashboard -->
            <h3 class="guide-section-header">Appearance & Dashboard</h3>
            <div class="guide-grid">
                <GuideCard id="guide-personalization" title="Extension Appearance" icon="🌙">
                    These settings modify the extension's own interface (Popup, Options, Dashboard). Changes here are purely cosmetic and local, 
                    ensuring a consistent look across the extension without altering the visual appearance of the third-party manga sites you visit.
                </GuideCard>

                <GuideCard id="guide-quick-access" title="Quick Access Shortcuts" icon="🔗">
                    Customizes the 5 shortcut circles on your Dashboard. Map them to your most-visited URLs (like specific manga list pages, profiles, or external sites) 
                    to create a personalized navigation hub that stays consistent on every new tab.
                </GuideCard>

                <GuideCard id="guide-dashboard" title="Dashboard" icon="📊">
                    Replaces your browser's new tab page with a rich library overview. The <b>Packed Layout</b> aggregates your reading stats and "Next Up" recommendations 
                    into a dense view, perfect for users with large libraries who want immediate access to their next read.
                </GuideCard>

                <GuideCard id="guide-styles" title="Highlight Styles" icon="🖼️">
                    Global visual settings for the status borders injected into websites. Choosing distinct styles like <b>Dashed</b> or <b>Dotted</b> helps distinguish 
                    your statuses even for colorblind users or on displays with poor color accuracy.
                </GuideCard>
            </div>

       

            <!-- Guide Section: Library & Data Management -->
            <h3 class="guide-section-header">Library & Data Management</h3>
            <div class="guide-grid">
                <GuideCard id="guide-entries" title="Saved Entries" icon="📚">
                    Your central hub for all tracked content. It aggregates data from local history and cloud syncs. Use this to manually fix metadata, 
                    apply bulk status updates, or audit what the extension is tracking independent of the source websites.
                </GuideCard>

                <GuideCard id="guide-stats" title="Library Statistics" icon="📊">
                    Access detailed breakdowns of your reading habits via the <b>Stats</b> button. It calculates total read time, chapter counts, and visualizes 
                    distribution by Format (Manga/Manhwa) and Status, helping you understand your consumption patterns at a glance.
                </GuideCard>

                <GuideCard id="guide-fresh-sync" title="Fresh Sync Entries" icon="⚡">
                   A maintenance tool for your library metadata. When triggered, it wipes the local cache for <i>all</i> entries and forces a fetch from the original providers (AniList/MangaDex).
                   Use this if you encounter broken images, missing titles, or if data seems "stuck" despite a normal sync.
                </GuideCard>

                <GuideCard id="guide-backup" title="Backup & Restore" icon="💾">
                    Creates a portable JSON snapshot of your entire state. Essential for manual backups or migrating to a browser/machine where Google Drive sync isn't an option.
                    Both your library database and specific extension settings are preserved.
                </GuideCard>

                <GuideCard id="guide-mangadex-import" title="MangaDex Import" icon="⬇️">
                   Fetches a public MDList to populate your library. Since MangaDex doesn't have a public API for private lists without OAuth, 
                   we temporarily redirect you to their site to securely read the list data locally before redirecting back.
                </GuideCard>
            </div>

            

            <!-- Guide Section: Profile & Sync -->
            <h3 class="guide-section-header">Reference: Profile & Cloud Sync</h3>
            <div class="guide-grid">
                <GuideCard id="guide-profile-account" title="Google Drive Connection" icon="👤">
                    We use your personal Google Drive 'App Data' folder to store your library. This ensures your data remains <b>private</b> and under your control—we never see your files. 
                    Signing in grants this extension access <i>only</i> to its own created config files, not your photos or documents.
                </GuideCard>

                <GuideCard id="guide-profile-sync" title="Selective Sync" icon="☁️">
                    Auto-sync runs silently in the background. You can fine-tune performance by selectively syncing only what you need—for example, 
                    disabling <b>Reading History</b> sync can significantly speed up the process if you have thousands of entries and only care about titles/statuses.
                </GuideCard>

                <GuideCard id="guide-profile-sync-auto" title="Auto Sync" icon="🔄">
                   Background process that keeps your local state up to date. Set the interval (in days) to balance freshness with performance. 
                   Requires a valid session (being logged in to the extension).
                </GuideCard>

                <GuideCard id="guide-profile-advanced" title="Conflict Resolution" icon="🔧">
                    Determines priority when local and cloud data differ. <b>Newer wins</b> compares timestamps to keep the most recent change. 
                    <b>Local/Cloud wins</b> strictly overwrites the other side without checking time, useful if one source is known to be corrupted or outdated.
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
import GuideCard from '../common/GuideCard.vue';
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

.guide-section-header {
    margin-top: 30px;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: 600;
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    gap: 8px;
}

.guide-section-header::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--border-color), transparent);
    margin-left: 10px;
    opacity: 0.5;
}


</style>
