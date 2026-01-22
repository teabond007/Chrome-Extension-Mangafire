import { CardEnhancer } from '@/content/CardEnhancer';
import './styles.css';

import { ReaderEnhancer } from '@/content/ReaderEnhancer';

const WebtoonsAdapter = {
    id: 'webtoons',
    name: 'Webtoons',
    unitName: 'episode',
    
    selectors: {
        // Matches standard list items, ranking items, card items
        card: '.daily_card_item, .ranking_item, .challenge_item, li[class*="card"], .item_list li, .card_item',
        cardTitle: '.title, .subj, .info .subj, p.subj',
        cardLink: 'a[href*="/webtoon/"], a[href*="/challenge/"], a[href*="title_no"]',
        cardCover: '.thumb img, .pic img, img'
    },
    
    extractCardData(card) {
        try {
            // Webtoons has many layouts inside <li> elements
            const linkEl = card.querySelector(this.selectors.cardLink) || 
                           (card.tagName === 'A' ? card : null);
            
            if (!linkEl) return null;
            
            const url = linkEl.href;
            const info = this.extractInfoFromUrl(url);
            
            let title = '';
            
            // Try explicit title elements inside the card
            const titleEl = card.querySelector(this.selectors.cardTitle);
            if (titleEl) {
                title = titleEl.textContent.trim();
            } else {
                // Try from link attribute
                if (linkEl.title) title = linkEl.title;
                else title = linkEl.textContent.trim();
            }

            return {
                title,
                url,
                id: info.titleNo,       // Webtoons uses title_no
                slug: info.slug
            };
        } catch (e) {
            console.warn('[Webtoons] Error extracting card data', e);
            return null;
        }
    },
    
    extractInfoFromUrl(url) {
        if (!url) return { titleNo: '', slug: '' };
        try {
            const urlObj = new URL(url);
            // Example: /en/fantasy/tower-of-god/list?title_no=95
            // Extract slug
            const match = urlObj.pathname.match(/\/(?:webtoon|challenge|canvas)\/([^/]+)\/([^/]+)/);
            // typically /lang/genre/slug so match[2]
            // or /en/genre/slug
            
            let slug = '';
            // Generic extraction from path
            const parts = urlObj.pathname.split('/').filter(p => p);
            // Search for known keywords
            const genreIndex = parts.findIndex(p => ['fantasy', 'action', 'romance', 'drama', 'thriller', 'horror', 'comedy', 'slice-of-life', 'sf', 'supernatural', 'sports', 'historical', 'tiptoon'].includes(p));
            if (genreIndex !== -1 && parts[genreIndex + 1]) {
                slug = parts[genreIndex + 1];
            } else {
                 // Try index 2 (lang/genre/slug)
                 if (parts.length >= 3) slug = parts[2];
            }
            
            return {
                titleNo: urlObj.searchParams.get('title_no') || '',
                slug: slug || parts[parts.length - 2] // Fallback
            };
        } catch (e) {
            return { titleNo: '', slug: '' };
        }
    },
    
    applyBorder(card, color) {
        // Webtoons often uses <li> as cards. We should style the <li> usually 
        // OR the internal wrapper to avoid spacing issues.
        // Let's try the internal <a> or wrapper if exists.
        
        // Use the card element itself if it behaves like a box
        card.style.border = `3px solid ${color}`;
        card.style.borderRadius = '8px';
        card.style.boxSizing = 'border-box';
        
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
    },

    // --- Reader Specifics ---
    isReaderPage() {
        return window.location.href.includes('/viewer') && window.location.href.includes('episode_no');
    },

    parseUrl(url) {
        const info = this.extractInfoFromUrl(url);
        const urlObj = new URL(url);
        const ep = urlObj.searchParams.get('episode_no');
        
        if (info.titleNo && ep) {
            return {
                id: info.titleNo,
                slug: info.slug,
                chapterNo: ep
            };
        }
        return null;
    },

    goToNextChapter() {
       const btn = document.querySelector('.pg_next');
       if (btn) btn.click();
    },

    goToPrevChapter() {
       const btn = document.querySelector('.pg_prev');
       if (btn) btn.click();
    }
};

// Initialize
const enhancer = new CardEnhancer(WebtoonsAdapter);
enhancer.init();

if (WebtoonsAdapter.isReaderPage()) {
    const reader = new ReaderEnhancer(WebtoonsAdapter);
    reader.init();
}

console.log('[Webtoons] Enhancer loaded.');
