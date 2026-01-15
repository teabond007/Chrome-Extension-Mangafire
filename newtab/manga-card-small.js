/**
 * Lightweight Manga Card Component for New Tab Dashboard
 */

export function createMangaCardSmall(entry) {
    const ani = entry.anilistData;
    const coverUrl = ani?.coverImage?.large || 'https://via.placeholder.com/200x300?text=No+Cover';
    const title = ani?.title?.english || ani?.title?.romaji || entry.title;
    
    // Get last chapter from savedReadChapters if available
    // We'll pass it in or fetch it from entry. 
    // In background.js we don't save the chapter number to the entry yet, only the timestamp.
    // Let's assume we might want to pass more info in the future.
    // For now, let's just stick to what we have or use the chapters count.
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
                <span>Ch. ${entry.lastChapterRead || entry.readChapters || 0}</span>
                <span>${ani?.format || 'Manga'}</span>
            </div>
        </div>
    `;

    // Click to visit MangaFire (Direct Link if possible)
    card.addEventListener('click', async () => {
        if (entry.mangaSlug && entry.lastChapterRead) {
            let targetChapter = entry.lastChapterRead;
            
            // Smart Resume: Try to go to next chapter
            const data = await chrome.storage.local.get(['SmartResumeLinkfeatureEnabled']);
            if (data.SmartResumeLinkfeatureEnabled) {
               // Extract number, increment, preserve format? 
               // Simple numeric increment is safest for now
               const currentNum = parseFloat(String(targetChapter).replace(/[^\d.]/g, ''));
               if (!isNaN(currentNum)) {
                   targetChapter = currentNum + 1;
               }
            }

            // Reconstruct the direct reader URL: /read/[slug]/en/chapter-[num]
            // We assume /en/ as requested
            window.location.href = `https://mangafire.to/read/${entry.mangaSlug}/en/chapter-${targetChapter}`;
        } else {
            // Fallback to search if slug is missing
            const query = encodeURIComponent(entry.title);
            window.location.href = `https://mangafire.to/filter?keyword=${query}`;
        }
    });

    return card;
}
