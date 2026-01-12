/**
 * Lightweight Manga Card Component for New Tab Dashboard
 */

export function createMangaCardSmall(entry) {
    const ani = entry.anilistData;
    const coverUrl = ani?.coverImage?.large || 'https://via.placeholder.com/200x300?text=No+Cover';
    const title = ani?.title?.english || ani?.title?.romaji || entry.title;
    const chapters = entry.readChapters || 0;
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'manga-card-sm';
    
    // Add border color based on status or custom marker if available
    // For "Reading" it's usually green-ish in many sites, but we'll stick to a clean look
    // Unless we want to pull colors from the extension settings.
    card.style.borderColor = 'rgba(79, 70, 229, 0.4)';

    card.innerHTML = `
        <div class="card-image-box">
            <img src="${coverUrl}" alt="${title}" loading="lazy">
        </div>
        <div class="card-content">
            <h3 title="${title}">${title}</h3>
            <div class="card-info">
                <span>Ch. ${chapters}</span>
                <span>${ani?.format || 'Manga'}</span>
            </div>
        </div>
    `;

    // Click to visit MangaFire
    card.addEventListener('click', () => {
        // We try to reconstruct the URL or just search for it
        const query = encodeURIComponent(entry.title);
        window.location.href = `https://mangafire.to/filter?keyword=${query}`;
    });

    return card;
}
