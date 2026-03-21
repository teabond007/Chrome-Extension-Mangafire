<template>
    <div id="tab-about" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'about' }">
        <header class="header">
            <div class="header-text">
                <h1>About</h1>
                <p class="subtitle">Information, usage guide, and extension architecture.</p>
            </div>
        </header>

        <div class="content-grid">
            <!-- Project Info Card -->
            <div class="card">
                <div class="card-body prose">
                    <h2>Universal Content Highlighter & Tracker</h2>
                    <p>A sophisticated Chrome Extension designed to unify your reading and viewing experience across the web. Rather than relying on hardcoded support for specific sites, it uses a powerful <strong>Custom Sites</strong> engine that allows you to track progress, save history, and visualize bookmarks on <em>any</em> website through user-defined DOM selectors.</p>

                    <h3>🚀 Why Use This?</h3>
                    <p>Managing content across dozens of different platforms leads to fragmented history and forgotten bookmarks. 
                    <strong>Universal Content Manager</strong> solves this by:</p>
                    <ul>
                        <li><strong>Standardizing your library</strong>: A single, persistent database for all your entries, regardless of which site they come from.</li>
                        <li><strong>Visual Context</strong>: Injecting custom UI elements (like status borders or reading badges) directly into the websites you browse.</li>
                        <li><strong>Zero-Lock-in Sync</strong>: Seamless cross-device synchronization using your own <strong>Google Drive</strong>, keeping you in full control of your data.</li>
                    </ul>

                    <hr class="divider">

                    <h3>✨ Key Features</h3>
                    
                    <h4>🌍 Universal Site Support</h4>
                    <ul class="feature-list">
                        <li><strong>Custom Sites Engine</strong>: Add support for any site in seconds using the visual selector tool.</li>
                        <li><strong>DOM-Based Tracking</strong>: Automatically detects when you move between listing pages and reader pages based on element presence.</li>
                    </ul>

                    <h4>☁️ Cloud Sync & Privacy</h4>
                    <ul class="feature-list">
                        <li><strong>Google Drive Integration</strong>: Securely sync your library and settings across all your devices using your private App Data folder.</li>
                        <li><strong>Local-First Architecture</strong>: All data is stored and processed on your machine. No external servers track your behavior.</li>
                    </ul>

                    <h4>🎨 Enhancement Suite</h4>
                    <ul class="feature-list">
                        <li><strong>Smart Highlighting</strong>: Visualize your saved entries with custom colored borders and interactive markers.</li>
                        <li><strong>Auto-Scroll & Reader Tools</strong>: Floating controls for hands-free reading on any page identified as a "Reader Page".</li>
                        <li><strong>Progress Persistence</strong>: Remembers your exact scroll position and chapter history across different domains.</li>
                    </ul>

                    <h4>📊 Library Management</h4>
                    <ul class="feature-list">
                        <li><strong>Advanced Statistics</strong>: Visualize your library trends with detailed breakdown charts and consumption metrics.</li>
                        <li><strong>Mass Actions</strong>: Bulk-update statuses, merge duplicates, or export specific subsets of your data.</li>
                    </ul>

                    <hr class="divider">

                    <h3>📖 Getting Started</h3>
                    <ol class="usage-list">
                        <li><strong>Initialize Your Library</strong>: Import existing data via the <strong>Profile</strong> tab (JSON/MangaDex) to get started quickly.</li>
                        <li><strong>Configure Your Sites</strong>: Navigate to the <strong>Custom Sites</strong> tab to add tracking support for your favorite websites.</li>
                        <li><strong>Browse & Interact</strong>: Once a site is configured, the extension will automatically highlight your entries and track your progress as you read.</li>
                        <li><strong>Enable Sync</strong>: Sign in with Google in the <strong>Profile</strong> tab to ensure your data is backed up and available on other machines.</li>
                    </ol>
                    
                    <hr class="divider">

                    <h3>⚖️ Terms & Privacy</h3>
                    <p>This extension is built with a <strong>Privacy-First</strong> philosophy. We do not collect analytics, track your browsing history, or store your data on our own servers. Your data belongs to you.</p>
                    <ul>
                        <li><strong>Governing Law</strong>: Terms are governed by the laws of <strong>Slovenia</strong>.</li>
                        <li><strong>License</strong>: Free for personal use. Commercial redistribution or reselling is strictly prohibited.</li>
                    </ul>
                </div>
            </div>

            <!-- User Guide Header -->
            <div class="section-title-full">
                <h2 class="section-label">User Guide & Feature Help</h2>
            </div>

            <!-- Guide Section: Core Functionality -->
            <h3 class="guide-section-header">Core Functionality</h3>
            <div class="guide-grid">
                <GuideCard id="guide-general" title="General Preferences" icon="⚙️">
                    Global controls for how the extension interacts with web content. Enable <b>Quick Actions</b> to add interactive hover buttons on external sites, or toggle <b>Reading Badges</b> to see your progress directly on thumbnails.
                </GuideCard>

                <GuideCard id="guide-smart-automation" title="Smart Automation" icon="⚡">
                   Reduces manual work by automating metadata updates. <b>Sync & Mark Read</b> uses your browsing history to automatically update your library when you visit a chapter page. <b>Inactivity Fade</b> visually dims entries you haven't interacted with recently.
                </GuideCard>

                <GuideCard id="guide-reader" title="Reader Enhancements" icon="📚">
                    Specialized tools for reading pages. <b>Auto-Scroll</b> provides hands-free navigation with precise speed control, while <b>Progress Tracking</b> saves your exact vertical position, allowing you to resume reading instantly on any device.
                </GuideCard>

                <GuideCard id="guide-statuses" title="Custom Statuses" icon="🎨">
                   Create virtual categories (e.g., "Favorites", "To-Buy") that go beyond standard site statuses. Custom statuses allow you to apply unique visual styles (different border colors or patterns) to specific groups of entries across all your configured sites.
                </GuideCard>

                <GuideCard id="guide-websites" title="Site Customization" icon="🌐">
                     Fine-tune how the extension looks on specific domains. Adjust <b>Highlight Thickness</b> to match the visual density of different sites, ensuring your status borders are clearly visible without obstructing the site's original UI.
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
                    Configure <b>Reader Selectors</b> to enable progress tracking. By identifying a unique element on chapter pages, the extension can automatically detect when you are reading and save your position.
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

                <GuideCard id="guide-backup" title="Backup & Restore" icon="💾">
                    Your data is your own. Use the backup tools to create local JSON snapshots of your entire library and configuration. This is ideal for manual migrations or as a secondary safeguard alongside cloud sync.
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

            <!-- Support Developer Section -->
            <div class="support-dev-card standard-card">
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
import { useSettingsStore } from '../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
</script>

<style scoped lang="scss">
/* About Page styles */
.prose {
    color: var(--text-primary);
    line-height: 1.6;

    h2 {
        font-size: 24px;
        margin-bottom: 8px;
        color: var(--accent-primary);
    }

    h3 {
        font-size: 18px;
        margin-top: 24px;
        margin-bottom: 12px;
        font-weight: 600;
    }

    p {
        margin-bottom: 16px;
        color: var(--text-secondary);
    }

    a {
        color: var(--accent-primary);
        text-decoration: none;
        font-weight: 500;

        &:hover {
            text-decoration: underline;
        }
    }

    ul, ol {
        margin-bottom: 16px;
        padding-left: 20px;
        color: var(--text-secondary);

        li {
            margin-bottom: 8px;
        }
    }

    strong {
        color: var(--text-primary);
    }
}

.divider {
    border: 0;
    height: 1px;
    background: var(--border-color);
    margin: 30px 0;
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

.section-title-full {
    grid-column: 1 / -1;
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

/* Support Dev Card */
.support-dev-card {
    margin-top: 40px;
    background: linear-gradient(135deg, rgba(117, 81, 255, 0.1) 0%, rgba(67, 24, 255, 0.05) 100%);
    border: 1px solid rgba(117, 81, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-lg, 16px);

    .support-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;

        h2 {
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
    }

    .support-links-group {
        display: flex;
        gap: 15px;
        margin-top: 25px;

        .support-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            height: 48px;
            font-weight: 600;
        }
    }
}
</style>
