<template>
    <div>
        <!-- User Guide Header -->
        <div class="section-title-full">
            <h2 class="section-label">User Guide & Feature Help</h2>
        </div>

        <!-- Guide Section: Core Functionality -->
        <h3 class="guide-section-header">Core Functionality</h3>
        <div class="guide-grid">
            <GuideCard id="guide-library" title="Your Library" icon="📚">
                The central hub for all your bookmarked content. Use the <b>Filter Bar</b> to search for specific titles, sort by activity, or filter by genre and status. Easily switch between <b>Large, Compact, and List</b> views to match your preference.
            </GuideCard>

            <GuideCard id="guide-general" title="General Preferences" icon="⚙️">
                Global controls for how the extension interacts with web content. Enable <b>Quick Actions</b> to add interactive hover buttons on external sites, or toggle <b>Reading Badges</b> to see your progress directly on thumbnails.
            </GuideCard>

            <GuideCard id="guide-smart-automation" title="Smart Automation" icon="⚡">
                Reduces manual work by automating updates. <b>Sync & Mark Read</b> uses your browsing history to automatically update your library when you visit a chapter page. <b>Auto Read Stale</b> automatically moves "Reading" entries to "Read" after 30 days of inactivity.
            </GuideCard>

            <GuideCard id="guide-reader" title="Reader Enhancements" icon="📚">
                Specialized tools for reading pages. <b>Auto-Scroll</b> provides hands-free navigation with precise speed control, while <b>Progress Tracking</b> saves your exact vertical position, allowing you to resume reading instantly on any device.
            </GuideCard>

            <GuideCard id="guide-statuses" title="Custom Statuses" icon="🎨">
                Create virtual categories (e.g., "Favorites", "To-Buy") that go beyond standard site statuses. Custom statuses allow you to apply unique visual styles (different border colors or patterns) to specific groups of entries across all your configured sites.
            </GuideCard>

            <GuideCard id="guide-custom-list" title="Site Customization" icon="🌐">
                Fine-tune how the extension looks on specific domains. Adjust <b>Highlight Thickness</b> and enable <b>Glowing Borders</b> or <b>Status Ribbons</b> to ensure your manga markers are clearly visible without obstructing the site's original UI.
            </GuideCard>
        </div>

        <!-- Guide Section: Custom Sites System -->
        <h3 class="guide-section-header">Custom Sites System</h3>
        <div class="guide-grid">
            <GuideCard id="guide-custom-add" title="Adding a New Site" icon="➕">
                Use the <b>Visual Selector Tool</b> to teach the extension how to recognize content on any site. You'll select the main "Card" container and the "Title" element to enable highlighting and tracking.
            </GuideCard>

            <GuideCard id="guide-selector-tool" title="The Selector Tool" icon="🎯">
                Our path-based selector uses absolute DOM paths for stability. If a site has multiple designs (e.g., Grid vs. List), you can create <b>Variant Groups</b> to ensure the extension works perfectly in all view modes.
            </GuideCard>

            <GuideCard id="guide-reader-selectors" title="Reader Tracking" icon="📖">
                Configure <b>Reader Selectors</b> to enable progress tracking on custom sites. By identifying a unique element on chapter pages, the extension can automatically detect when you are reading and save your position.
            </GuideCard>

            <GuideCard id="guide-custom-share" title="Portability" icon="📤">
                Configurations are fully portable. You can <b>Export</b> your site settings as JSON to share with others or <b>Import</b> configurations from the community to instantly support new platforms.
            </GuideCard>
        </div>

        <!-- Guide Section: Appearance & Data -->
        <h3 class="guide-section-header">Appearance & Data</h3>
        <div class="guide-grid">
            <GuideCard id="guide-personalization" title="Extension Appearance" icon="🌙">
                Customize the extension's own interface (Popup and Options page). These settings are purely cosmetic and ensure the extension fits your aesthetic preferences without altering the appearance of the websites you visit.
            </GuideCard>

            <GuideCard id="guide-styles" title="Highlight Styles" icon="🖼️">
                Global visual settings for injected borders. Choose between <b>Solid, Dashed, Dotted,</b> or <b>Double</b> styles to distinguish your statuses and markers, even on sites with complex or busy backgrounds.
            </GuideCard>

            <GuideCard id="guide-stats" title="Library Statistics" icon="📊">
                Track your consumption patterns over time. This section provides detailed metrics on your most-read formats, status distribution, and total chapter counts, helping you stay on top of your library growth.
            </GuideCard>

            <GuideCard id="guide-profile-export" title="Export Data" icon="📤">
                Create a local JSON snapshot of your entire library, history, and custom site configurations. This is the safest way to manually preserve your data or migrate between browsers without cloud dependency.
            </GuideCard>

            <GuideCard id="guide-profile-import" title="Import Data" icon="📥">
                Restore your library from a previously exported JSON file. <b>Warning:</b> Importing will merge with your current local data, favoring the imported values if duplicates are found.
            </GuideCard>

            <GuideCard id="guide-backup" title="Storage Management" icon="💾">
                Monitor your local storage usage. Unlike cloud sync, these tools interact directly with your browser's persistent storage, allowing you to clear cache or reset specific modules if you encounter performance issues.
            </GuideCard>
        </div>

        <!-- Guide Section: Profile & Cloud Sync -->
        <h3 class="guide-section-header">Profile & Cloud Sync</h3>
        <div class="guide-grid">
            <GuideCard id="guide-profile-account" title="Google Drive Sync" icon="👤">
                Cross-device sync uses your personal Google Drive <b>App Data</b> folder. This is a private space that only the extension can access—your photos and other documents remain entirely invisible to us.
            </GuideCard>

            <GuideCard id="guide-profile-sync" title="Selective Sync" icon="☁️">
                Optimize performance by choosing exactly what gets synced. You can toggle sync for <b>Library Entries</b>, <b>Reading History</b>, or <b>Custom Site Configs</b> independently to suit your needs.
            </GuideCard>

            <GuideCard id="guide-mangadex-import" title="MangaDex Import" icon="⬇️">
                A specialized import tool for MangaDex users. It temporarily navigates to the MangaDex site to securely read your public lists and add them to your local library with one click.
            </GuideCard>
        </div>
    </div>
</template>

<script setup>
import GuideCard from '../../common/GuideCard.vue';
</script>

<style scoped lang="scss">
.section-title-full {
    margin-top: 30px;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
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

    &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(to right, var(--border-color), transparent);
        margin-left: 10px;
        opacity: 0.5;
    }
}

.guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }

    :deep(.guide-card) {
        height: auto;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }

        .guide-text {
            font-size: 13px;
            line-height: 1.6;
            color: var(--text-secondary);
            margin: 0;

            b { color: var(--text-primary); }
        }
    }
}
</style>
