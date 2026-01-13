import { createMangaCardSmall } from './manga-card-small.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if feature is enabled
    const data = await chrome.storage.local.get([
        'NewTabDashboardfeatureEnabled', 
        'savedEntriesMerged', 
        'DashboardLayoutStylePacked',
        'userbookmarkshistory',
        'userBookmarks'
    ]);
    const isEnabled = data.NewTabDashboardfeatureEnabled !== false; // Default to true if not set

    if (!isEnabled) {
        // Feature disabled - redirect to the native New Tab Page
        chrome.tabs.getCurrent((tab) => {
            if (tab) {
                chrome.tabs.update(tab.id, { url: "chrome://new-tab-page" });
            } else {
                window.location.href = "chrome://new-tab-page";
            }
        });
        return;
    }

    // 1.5 Handle Layout
    const isPacked = data.DashboardLayoutStylePacked === true;
    document.body.classList.add(isPacked ? 'layout-packed' : 'layout-clean');
    // Show body
    document.body.classList.add('loaded');

    const savedEntries = data.savedEntriesMerged || [];
    const bookmarks = data.userBookmarks || [];
    const history = data.userbookmarkshistory || [];
    
    // 2. Initialize UI Components
    initClock();
    initGreeting();
    initBackground(savedEntries);
    initQuickAccess(); // Add this
    initSearch();
    initSettingsLink();
    renderReadingList(savedEntries);

    if (isPacked) {
        renderLibraryStats(bookmarks);
        renderReadingHistory(history);
        initDiscovery(bookmarks);
    }
});

function renderLibraryStats(bookmarks) {
    const statsContainer = document.getElementById('library-stats');
    if (!statsContainer) return;

    const stats = {
        'Reading': 0,
        'Plan to Read': 0,
        'Completed': 0,
        'Total': bookmarks.length
    };

    bookmarks.forEach(b => {
        if (stats[b.status] !== undefined) stats[b.status]++;
    });

    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${stats['Reading']}</span>
            <span class="stat-label">Reading</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats['Plan to Read']}</span>
            <span class="stat-label">Planner</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats['Completed']}</span>
            <span class="stat-label">Finished</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats['Total']}</span>
            <span class="stat-label">Library</span>
        </div>
    `;
}

function renderReadingHistory(history) {
    const list = document.getElementById('recent-history-list');
    if (!list || history.length === 0) {
        if (list) list.innerHTML = '<div class="loading-state">No recent reading history found. Start reading to see links here!</div>';
        return;
    }

    list.innerHTML = "";
    history.forEach(url => {
        const item = document.createElement('a');
        item.className = 'history-item';
        item.href = url;
        
        // Extract a "clean" name from the URL for now
        let displayName = url.split('/read/')[1] || "Manga Link";
        displayName = displayName.split('/')[0].replace(/-/g, ' ');

        item.innerHTML = `
            <div class="history-icon">📖</div>
            <div class="history-info">
                <div class="shortcut-name">${displayName}</div>
                <div class="history-link-text">${url}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function initDiscovery(bookmarks) {
    const text = document.getElementById('random-suggestion-text');
    const btn = document.getElementById('random-suggestion-btn');
    if (!text || !btn) return;

    const showRandom = () => {
        if (bookmarks.length === 0) return;
        const random = bookmarks[Math.floor(Math.random() * bookmarks.length)];
        text.innerHTML = `How about reading <strong>${random.title}</strong>? It's currently marked as <em>${random.status}</em>.`;
    };

    btn.addEventListener('click', showRandom);
    showRandom();
}

async function initQuickAccess() {
    const grid = document.getElementById('quick-access-grid');
    if (!grid) return;

    const defaultShortcuts = [
        { name: 'YouTube', url: 'https://www.youtube.com' },
        { name: 'ChatGPT', url: 'https://chat.openai.com' },
        { name: 'Spotify', url: 'https://open.spotify.com' },
        { name: 'Gmail', url: 'https://mail.google.com' },
        { name: 'Discord', url: 'https://discord.com' }
    ];

    const data = await chrome.storage.local.get(['QuickAccessShortcuts']);
    const shortcuts = data.QuickAccessShortcuts || defaultShortcuts;

    grid.innerHTML = "";
    shortcuts.forEach(site => {
        if (!site.url) return;

        const item = document.createElement('a');
        item.className = 'quick-access-item';
        item.href = site.url;
        item.title = site.name;

        // Use Google's favicon service for high-quality icons
        const domain = new URL(site.url).hostname;
        const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        item.innerHTML = `
            <div class="shortcut-icon">
                <img src="${iconUrl}" alt="${site.name}" onerror="this.src='../icons/favicon128.png'">
            </div>
            <span class="shortcut-name">${site.name}</span>
        `;
        grid.appendChild(item);
    });
}

function initClock() {
    const clockEl = document.getElementById('digital-clock');
    const updateClock = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}`;
    };
    updateClock();
    setInterval(updateClock, 1000);
}

function initGreeting() {
    const greetingEl = document.getElementById('greeting-text');
    const hour = new Date().getHours();
    let text = "Good morning";
    if (hour >= 12 && hour < 17) text = "Good afternoon";
    else if (hour >= 17 || hour < 4) text = "Good evening";
    greetingEl.textContent = text;
}

function initBackground(entries) {
    const bgOverlay = document.getElementById('bg-overlay');
    
    // Find all banner images
    const banners = entries
        .filter(e => e.anilistData && e.anilistData.bannerImage)
        .map(e => e.anilistData.bannerImage);

    if (banners.length > 0) {
        const randomBanner = banners[Math.floor(Math.random() * banners.length)];
        bgOverlay.style.backgroundImage = `url('${randomBanner}')`;
    } else {
        // Fallback default background
        bgOverlay.style.backgroundImage = "url('https://images.unsplash.com/photo-1541562232579-512a21359920?q=80&w=2000&auto=format&fit=crop')";
    }
}

function initSearch() {
    const input = document.getElementById('manga-search-input');
    const btn = document.getElementById('search-btn');

    const doSearch = () => {
        const query = input.value.trim();
        if (query) {
            // Using /search might be more compatible or redirect to a page that generates the required 'vrf'
            window.location.href = `https://mangafire.to/search?keyword=${encodeURIComponent(query)}`;
        }
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });
    btn.addEventListener('click', doSearch);
}

function initSettingsLink() {
    const btn = document.getElementById('open-settings-btn');
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
}

function renderReadingList(entries) {
    const grid = document.getElementById('reading-grid');
    const countBadge = document.getElementById('reading-count');

    // Filter "Reading" manga
    const readingManga = entries
        .filter(e => e.status === "Reading")
        .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
        .slice(0, 5);

    grid.innerHTML = "";
    countBadge.textContent = readingManga.length;

    if (readingManga.length === 0) {
        grid.innerHTML = '<div class="loading-state">No manga currently in "Reading" list. Sync your bookmarks or add some manga!</div>';
        return;
    }

    readingManga.forEach(entry => {
        const card = createMangaCardSmall(entry);
        grid.appendChild(card);
    });
}
