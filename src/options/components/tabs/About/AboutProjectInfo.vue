<template>
    <div class="card">
        <div class="card-body prose">
            <h2>Universal Content Manager</h2>
            <p>A sophisticated Chrome Extension designed to unify your reading and viewing experience across the web. Rather than relying on hardcoded support for specific sites, it uses a powerful <strong>Custom Sites</strong> engine that allows you to track progress, save history, and visualize bookmarks on <em>any</em> website through user-defined DOM selectors.</p>

            <h3><span class="icon-svg icon-zap" style="margin-right: 8px; color: var(--accent-primary);"></span>Why Use This?</h3>
            <p>Managing content across dozens of different platforms leads to fragmented history and forgotten bookmarks. 
            <strong>Universal Content Manager</strong> solves this by:</p>
            <ul>
                <li><strong>Standardizing your library</strong>: A single, persistent database for all your entries, regardless of which site they come from, with dynamic pagination.</li>
                <li><strong>Visual Context</strong>: Injecting custom UI elements ( reading badges, and status ribbons) directly into the websites you browse.</li>
                <li><strong>Local-First Architecture</strong>: All data is stored and processed on your machine without cloud dependency, keeping you in full control of your data.</li>
            </ul>

            <hr class="divider">

            <h3><span class="icon-svg icon-sparkles" style="margin-right: 8px; color: var(--accent-primary);"></span>Key Features</h3>
            
            <h4><span class="icon-svg icon-globe" style="margin-right: 8px; color: var(--accent-primary);"></span>Universal Site Support</h4>
            <ul class="feature-list">
                <li><strong>Custom Sites Engine</strong>: Add support for any site in seconds using the visual selector tool.</li>
                <li><strong>DOM-Based Tracking</strong>: Automatically detects when you move between listing pages and reader pages based on element presence.</li>
            </ul>

            <h4><span class="icon-svg icon-backup" style="margin-right: 8px; color: var(--accent-primary);"></span>Privacy & Portability</h4>
            <ul class="feature-list">
                <li><strong>Local Backups</strong>: Easily export and import your entire library and configurations as a single JSON file.</li>
                <li><strong>Local-First Architecture</strong>: All data is stored and processed on your machine. No external servers track your behavior.</li>
            </ul>

            <h4><span class="icon-svg icon-palette" style="margin-right: 8px; color: var(--accent-primary);"></span>Enhancement Suite</h4>
            <ul class="feature-list">
                <li><strong>Smart Highlighting</strong>: Visualize your saved entries with custom colored borders,  corner status ribbons, and interactive markers.</li>
                <li><strong>Reader Enhancement</strong>: Support for specialized tools on pages identified as a "Reader Page".</li>
                <li><strong>Progress Persistence</strong>: Remembers your exact scroll position and chapter history across different domains.</li>
            </ul>

            <h4><span class="icon-svg icon-list" style="margin-right: 8px; color: var(--accent-primary);"></span>Library Management</h4>
            <ul class="feature-list">
                <li><strong>Advanced Filters</strong>: Search and sort your library with multiple filtering modes.</li>
                <li><strong>Mass Actions</strong>: Easily manage and curate your collections.</li>
            </ul>

            <hr class="divider">

            <h3><span class="icon-svg icon-book-open" style="margin-right: 8px; color: var(--accent-primary);"></span>Getting Started</h3>
            <ol class="usage-list">
                <li><strong>Initialize Your Library</strong>: Import existing data via the <strong>Backup</strong> tab (JSON) to get started quickly.</li>
                <li><strong>Configure Your Sites</strong>: Navigate to the <strong>Custom Sites</strong> tab to add tracking support for your favorite websites.</li>
                <li><strong>Browse & Interact</strong>: Once a site is configured, the extension will automatically highlight your entries and track your progress as you read.</li>
                <li><strong>Local Backup</strong>: Periodically export your data in the <strong>Backup</strong> tab to ensure your library is safe.</li>
            </ol>
            
            <hr class="divider">

            <h3><span class="icon-svg icon-info" style="margin-right: 8px; color: var(--accent-primary);"></span>Terms & Privacy</h3>
            <p>This extension is built with a <strong>Privacy-First</strong> philosophy. We do not collect analytics, track your browsing history, or store your data on our own servers. Your data belongs to you.</p>
            <ul>
                <li><strong>Governing Law</strong>: Terms are governed by the laws of <strong>Slovenia</strong>.</li>
                <li><strong>License</strong>: Free for personal use. Commercial redistribution or reselling is strictly prohibited.</li>
            </ul>
        </div>
    </div>
</template>

<style scoped lang="scss">
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
</style>
