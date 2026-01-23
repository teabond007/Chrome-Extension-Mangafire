import { createMangaCardSmall } from './manga-card-small.js';

export async function init() {
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
    
    // Smoothly reveal body by removing inline opacity and adding class
    document.body.style.opacity = '';
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
    
    const familyFriendly = data.FamilyFriendlyfeatureEnabled === true;
    renderReadingList(savedEntries, familyFriendly);

    if (isPacked) {
        renderLibraryStats(bookmarks);
        renderReadingHistory(history);
        initDiscovery(bookmarks);
    }
    
    // 3. Start Animations
    setTimeout(animateIntro, 100);

    // 4. Listen for storage changes to refresh dashboard
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && (changes.savedEntriesMerged || changes.savedReadChapters)) {
            chrome.storage.local.get(['savedEntriesMerged'], (newData) => {
                renderReadingList(newData.savedEntriesMerged || [], familyFriendly);
            });
        }
    });

    // 5. Refresh on Tab Focus to ensure latest data
    window.addEventListener('focus', async () => {
        const newData = await chrome.storage.local.get(['savedEntriesMerged']);
        renderReadingList(newData.savedEntriesMerged || [], familyFriendly);
    });
}

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

        // Use DuckDuckGo favicon service (more reliable for some domains)
        const domain = new URL(site.url).hostname;
        const iconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

        item.innerHTML = `
            <div class="shortcut-icon">
                <img src="${iconUrl}" alt="${site.name}" loading="lazy" onerror="this.src='../icons/favicon128.png'">
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
        // Fallback default background - Use a fresh reliable ID
        bgOverlay.style.backgroundImage = "url('https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=2000&auto=format&fit=crop')";
    }
}

function initSearch() {
    const input = document.getElementById('manga-search-input');
    const btn = document.getElementById('search-btn');

    const doSearch = () => {
        const query = input.value.trim();
        if (query) {
            // Perform a standard Google search
            window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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

function renderReadingList(entries, familyFriendly = false) {
    const grid = document.getElementById('reading-grid');
    const countBadge = document.getElementById('reading-count');

    // Deduplicate entries by ID or slug
    const seen = new Set();
    const uniqueEntries = entries.filter(e => {
        const id = e.anilistData?.id || e.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });

    // Filter "Reading" manga or anything with recent history
    const readingManga = uniqueEntries
        .filter(e => {
            // Only show if it has recorded history (lastRead timestamp or chapter progress)
            const hasHistory = !!e.lastRead || (e.readChapters > 0) || !!e.lastChapterRead;
            
            if (!hasHistory) return false;

            // Apply Family Friendly filter
            if (familyFriendly && e.anilistData?.genres) {
                if (e.anilistData.genres.some(g => ['Ecchi', 'Hentai'].includes(g))) return false;
            }
            return true;
        })
        .sort((a, b) => {
            const timeA = Math.max(a.lastRead || 0, a.lastUpdated || 0);
            const timeB = Math.max(b.lastRead || 0, b.lastUpdated || 0);
            return timeB - timeA;
        })
        .slice(0, 5);

    grid.innerHTML = "";
    countBadge.textContent = readingManga.length;

    if (readingManga.length === 0) {
        grid.innerHTML = '<div class="loading-state">No recently read manga found. Start reading to see them here!</div>';
        return;
    }

    readingManga.forEach(entry => {
        const card = createMangaCardSmall(entry);
        grid.appendChild(card);
    });

    // Update section title if we are showing history
    const sectionTitle = document.querySelector('.reading-section h2');
    if (sectionTitle) {
        sectionTitle.textContent = "Recently Read";
    }
}

function animateIntro() {
    // Fallback: if anime.js is not available, just show elements immediately
    if (typeof window.anime === 'undefined') {
        document.querySelectorAll('.top-bar, .search-section, .quick-access-section, .dashboard-content-wrapper > *').forEach(el => {
            el.style.opacity = '1';
        });
        return;
    }
    
    window.anime.timeline({
        easing: 'easeOutExpo',
        duration: 800
    })
    .add({
        targets: '.top-bar',
        translateY: [-20, 0],
        opacity: [0, 1],
        delay: 200
    })
    .add({
        targets: '.search-section, .quick-access-section',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100)
    }, '-=600')
    .add({
        targets: '.dashboard-content-wrapper > *',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(150)
    }, '-=500');
}

