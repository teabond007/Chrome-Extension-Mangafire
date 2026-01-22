import { CardEnhancer } from '@/content/CardEnhancer';
import './styles.css';

import { ReaderEnhancer } from '@/content/ReaderEnhancer';

const MangaFireAdapter = {
    id: 'mangafire',
    name: 'MangaFire',
    unitName: 'chapter',
    
    selectors: {
        card: '.unit, .swiper-slide, .item', // Added .item for search results often used
        cardLink: 'a[href*="/manga/"]',
        cardTitle: '.info a, .info h6 a, .above a',
    },
    
    extractCardData(card) {
        try {
            const titleEl = card.querySelector(this.selectors.cardTitle);
            const title = titleEl ? titleEl.textContent.trim() : '';
            
            const linkEl = card.querySelector(this.selectors.cardLink);
            const url = linkEl ? linkEl.href : '';
            
            // Extract slug from URL: /manga/slug.id
            // MangaFire URLs often: https://mangafire.to/manga/one-piece.dkw
            // Slug: one-piece.dkw
            let slug = '';
            let id = '';
            
            if (url) {
                const match = url.match(/\/manga\/([^/?#]+)/);
                if (match) {
                    slug = match[1];
                    // ID is often the last part after dot
                    const parts = slug.split('.');
                    if (parts.length > 1) {
                        id = parts[parts.length - 1];
                    }
                }
            }
            
            return {
                title,
                url,
                slug,
                id
            };
        } catch (e) {
            console.warn('Error extracting card data', e);
            return null;
        }
    },
    
    applyBorder(card, color) {
        // MangaFire specific: some cards are swiper-slides or have specific structure
        let target = card;
        
        // If swiper-slide, usually inner container needs border
        if (card.classList.contains('swiper-slide')) {
             const inner = card.querySelector('.poster') || card;
             inner.style.border = `3px solid ${color}`;
             inner.style.borderRadius = '8px';
             inner.style.boxSizing = 'border-box';
             // Ensure relative for overlay
             if (getComputedStyle(inner).position === 'static') inner.style.position = 'relative';
             return;
        }
        
        // Normal unit
        const poster = card.querySelector('.poster');
        if (poster) {
            target = poster;
        }
        
        target.style.border = `3px solid ${color}`;
        target.style.borderRadius = '8px';
        target.style.boxSizing = 'border-box';
        // Ensure relative for overlay
        if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    },

    // --- Reader Specifics ---
    isReaderPage() {
        return window.location.href.includes('/read/');
    },
    
    parseUrl(url) {
        // Example: https://mangafire.to/read/slug.id/en/chapter-10
        const match = url.match(/\/read\/([^/]+)\/.*chapter-([\d.]+)/);
        if (match) {
            const fullSlug = match[1];
            // fullSlug = slug.id
            const parts = fullSlug.split('.');
            const id = parts.length > 1 ? parts[parts.length - 1] : '';

            return {
                slug: fullSlug, // Use full slug as key
                id: id,
                chapterNo: match[2]
            };
        }
        return null;
    },

    goToNextChapter() {
        // Try arrow key simulation or finding UI button
        // MangaFire reader UI is tricky, often obfuscated or Custom
        // Try general selectors
        const nextBtns = Array.from(document.querySelectorAll('a, button'));
        const next = nextBtns.find(b => b.textContent.toLowerCase().includes('next') && !b.hidden);
        if (next) next.click();
    },

    goToPrevChapter() {
        const prevBtns = Array.from(document.querySelectorAll('a, button'));
        const prev = prevBtns.find(b => b.textContent.toLowerCase().includes('prev') && !b.hidden);
        if (prev) prev.click();
    }
};

// Initialize
const enhancer = new CardEnhancer(MangaFireAdapter);
enhancer.init();

// Reader Initialization
if (MangaFireAdapter.isReaderPage()) {
    const reader = new ReaderEnhancer(MangaFireAdapter);
    reader.init();
}

console.log('[MangaFire] Enhancer loaded.');
