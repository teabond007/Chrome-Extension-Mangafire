import { createMangaCardSmall } from './manga-card-small.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if feature is enabled
    const data = await chrome.storage.local.get(['NewTabDashboardfeatureEnabled', 'savedEntriesMerged']);
    const isEnabled = data.NewTabDashboardfeatureEnabled !== false; // Default to true if not set

    if (!isEnabled) {
        // Feature disabled - redirect to default
        // In most cases, extensions can't easily jump back to the internal default NTP once overridden,
        // so we redirect to Google or a blank page, or just show a message.
        // For now, let's redirect to Google to avoid an empty screen.
        window.location.href = "https://www.google.com";
        return;
    }

    // Show body
    document.body.classList.add('loaded');

    const savedEntries = data.savedEntriesMerged || [];
    
    // 2. Initialize UI Components
    initClock();
    initGreeting();
    initBackground(savedEntries);
    initSearch();
    initSettingsLink();
    renderReadingList(savedEntries);
});

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
            window.location.href = `https://mangafire.to/filter?keyword=${encodeURIComponent(query)}`;
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
