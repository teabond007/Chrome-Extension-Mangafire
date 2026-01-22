import { CardEnhancer } from '@/content/CardEnhancer';
import './styles.css';

import { ReaderEnhancer } from '@/content/ReaderEnhancer';

const MangaPlusAdapter = {
    id: 'mangaplus',
    name: 'MangaPlus',
    unitName: 'chapter',
    
    selectors: {
        card: 'a[href*="/titles/"]',
        // In MangaPlus, the card IS the link often, or wrapped tightly
        cardTitle: 'h3, div[class*="TitleName"], p.title', // Selectors vary by layout (featured vs list)
        cardLink: 'a[href*="/titles/"]', 
        cardCover: 'img'
    },
    
    extractCardData(card) {
        try {
            let linkEl = card;
            if (card.tagName !== 'A') {
                linkEl = card.querySelector('a[href*="/titles/"]');
            }
            if (!linkEl) return null;
            
            const url = linkEl.href;
            const id = this.extractIdFromUrl(url); // MangaPlus uses numeric IDs
            
            let title = '';
            // Try internal elements
            const titleEl = card.querySelector('h3') || 
                            card.querySelector('div[class*="TitleName"]') ||
                            card.querySelector('p');
            
            if (titleEl) {
                title = titleEl.textContent.trim();
            } else {
                 // Try searching nearby or parent if the card is just the image wrapper
                 // Fallback to extraction from image alt?
                 const img = card.querySelector('img');
                 if (img && img.alt) title = img.alt;
            }

            return {
                title,
                url,
                id: id,
                slug: id // MP uses ID as unique identifier primarily
            };
        } catch (e) {
            console.warn('[MangaPlus] Error extracting card data', e);
            return null;
        }
    },
    
    extractIdFromUrl(url) {
        if (!url) return '';
        // https://mangaplus.shueisha.co.jp/titles/100020
        const match = url.match(/\/titles\/(\d+)/);
        return match ? match[1] : '';
    },

    applyBorder(card, color) {
        // Target the cover container if possible for better visuals
        const cover = card.querySelector('div[class*="Cover"]') || card.querySelector('img') || card;
        
        cover.style.border = `3px solid ${color}`;
        cover.style.boxSizing = 'border-box';
        cover.style.borderRadius = '4px';
        
        if (getComputedStyle(cover).position === 'static') {
            cover.style.position = 'relative';
        }
    },
    
    // --- Reader Specifics ---
    isReaderPage() {
        return window.location.href.includes('/viewer/');
    },

    parseUrl(url) {
        //Viewer URL: https://mangaplus.shueisha.co.jp/viewer/1015694
        // Logic requires fetching title ID which isn't in viewer URL usually.
        // We might just track by viewer ID (chapter ID) and let background resolve it if needed?
        // Or DOM scrape.
        
        if (this.isReaderPage()) {
             // Try to find title link in DOM
             const titleLink = document.querySelector('a[href*="/titles/"]');
             let titleId = '';
             let chapterId = '';
             
             const match = url.match(/\/viewer\/(\d+)/);
             if (match) chapterId = match[1];
             
             if (titleLink) {
                 titleId = this.extractIdFromUrl(titleLink.href);
             }
             
             return {
                 id: titleId,  // Series ID
                 slug: titleId,
                 chapterNo: chapterId // Temporarily treat Chapter ID as number for uniqueness if real number not found
                 // Note: MangaPlus chapters don't always have clean numbers in DOM easily accessible without shadow DOM diving sometimes.
             };
        }
        return null;
    },

    goToNextChapter() {
        // SPA navigation usually
    },

    goToPrevChapter() {
        
    }
};

// Initialize
const enhancer = new CardEnhancer(MangaPlusAdapter);
enhancer.init();

if (MangaPlusAdapter.isReaderPage()) {
    // Delay to allow React hydration
    setTimeout(() => {
        const reader = new ReaderEnhancer(MangaPlusAdapter);
        reader.init();
    }, 1500);
}

console.log('[MangaPlus] Enhancer loaded.');
