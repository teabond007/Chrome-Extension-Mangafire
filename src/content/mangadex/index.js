import { CardEnhancer } from '@/content/CardEnhancer';
import './styles.css';

import { ReaderEnhancer } from '@/content/ReaderEnhancer';

const MangaDexAdapter = {
    id: 'mangadex',
    name: 'MangaDex',
    
    // Selectors
    selectors: {
        // Matches classic grids, list items, and various card-like containers on MangaDex
        card: '.manga-card, .hchaptercard, a[href*="/title/"]:has(img), [class*="chapter-feed__container"]',
        
        // Inside a card, finding the title and link
        cardLink: 'a[href*="/title/"]',
        // Title selectors are tricky on MangaDex due to variety of layouts
        cardTitle: 'a[href*="/title/"] h6, a.title span, a.title, [class*="title"]',
    },
    
    // Extraction Logic
    extractCardData(card) {
        try {
            // Find the primary link to the manga title
            const linkEl = card.querySelector(this.selectors.cardLink) || 
                           (card.tagName === 'A' && card.href.includes('/title/') ? card : null);
                           
            if (!linkEl) return null;
            
            const url = linkEl.href;
            const uuid = this.extractUUID(url);
            
            let title = '';
            
            // Try specific internal title elements
            let titleEl = card.querySelector('h6') || 
                          card.querySelector('span.font-bold') ||
                          card.querySelector('.title') ||
                          card.querySelector('[class*="title"]');
            
            // If no internal title, check the link itself
            if (!titleEl) {
                 if (linkEl.textContent && linkEl.textContent.trim().length > 0) {
                     title = linkEl.textContent.trim();
                 }
            } else {
                title = titleEl.textContent.trim();
            }
            
            // Cleanup title (sometimes includes extra data)
            if (!title && linkEl.title) title = linkEl.title;

            return {
                title: title || 'Unknown Title',
                url,
                id: uuid,      // MangaDex uses UUIDs as stable IDs
                slug: this.extractSlug(title) // Use title slug as fallback
            };
        } catch (e) {
            console.warn('[MangaDex] Extraction error:', e);
            return null;
        }
    },
    
    extractUUID(url) {
        if (!url) return '';
        const match = url.match(/\/(title|chapter)\/([a-f0-9-]{36})/i);
        return match ? match[2] : '';
    },
    
    extractSlug(title) {
        return title ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
    },

    // Visual Application
    applyBorder(card, color) {
        let target = card;
        
        // If it's the "dense" list view (hchaptercard), target the image specifically or the row?
        // Usually MangaDex list items (div) have the style, or the cover image wrapper.
        // Let's target the cover wrapper if possible to avoid layout shift.
        const cover = card.querySelector('.manga-card-cover') || card.querySelector('img')?.parentElement;
        
        if (cover) {
            target = cover;
            // Ensure container has relative positioning for the overlay
            if (getComputedStyle(target).position === 'static') {
                target.style.position = 'relative';
            }
        }
        
        target.style.border = `3px solid ${color}`;
        target.style.borderRadius = '8px';
        target.style.boxSizing = 'border-box';
        
        // Add a class to help styles target this if needed
        target.classList.add('bmh-bordered');
    },

    // --- Reader Specifics ---
    isReaderPage() {
        return window.location.href.includes('/chapter/');
    },

    parseUrl(url) {
        // Getting info from URL is hard for UUIDs, need to rely on title parsing or API 
        // fallback (which we skip for now).
        // Try page title parsing: "Title - Vol.x Ch.y - ..."
        const title = document.title;
        const chMatch = title.match(/Ch\.(\d+(\.\d+)?)/) || title.match(/Chapter (\d+)/);
        
        const uuid = this.extractUUID(url);

        if (chMatch) {
            // Need a way to match back to Title ID?
            // For now, simpler tracking using title name slug if valid id not found?
            // Actually, for saving progress, we need to know WHICH manga this is.
            // On MangaDex reader, there is usually a link back to the title page.
            const titleLink = document.querySelector('a[href*="/title/"]');
            let seriesId = '';
            let seriesSlug = '';
            
            if (titleLink) {
                seriesId = this.extractUUID(titleLink.href);
                seriesSlug = this.extractSlug(titleLink.textContent);
            }

            return {
                id: seriesId,
                slug: seriesSlug,
                chapterNo: chMatch[1]
            };
        }
        return null;
    },

    goToNextChapter() {
        // MangaDex uses Keyboard shortcuts but lacks obvious "next" button in some layouts
        // But in Long Strip mode there are buttons at bottom usually
        // SVG icons are common. 
        // Let's try sending "Right Arrow" event? No, safer to click if found.
        // Or leave empty if MD handles it well?
        const links = document.querySelectorAll('a');
        for(let l of links) {
            if (l.textContent.includes('Next Chapter')) { l.click(); return; }
        }
    },

    goToPrevChapter() {
        const links = document.querySelectorAll('a');
        for(let l of links) {
            if (l.textContent.includes('Previous Chapter')) { l.click(); return; }
        }
    }
};

// Initialize
const enhancer = new CardEnhancer(MangaDexAdapter);
enhancer.init();

if (MangaDexAdapter.isReaderPage()) {
    // Delay slightly to let SPA load
    setTimeout(() => {
        const reader = new ReaderEnhancer(MangaDexAdapter);
        reader.init();
    }, 1000);
}

console.log('[MangaDex] Enhancer loaded.');
