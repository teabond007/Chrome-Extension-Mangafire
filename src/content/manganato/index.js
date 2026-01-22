import { CardEnhancer } from '@/content/CardEnhancer';
import './styles.css';

import { ReaderEnhancer } from '@/content/ReaderEnhancer';

const ManganatoAdapter = {
    id: 'manganato',
    name: 'Manganato',
    unitName: 'chapter',
    
    selectors: {
        card: '.content-genres-item, .list-truyen-item-wrap, .sh, .item, .daily-update .item', 
        cardTitle: 'h3 a, a.genres-item-name, a.title',
        cardLink: 'h3 a, a.genres-item-name, a.title', // Often the same
        cardCover: 'img'
    },
    
    extractCardData(card) {
        try {
            const linkEl = card.querySelector(this.selectors.cardLink) || 
                           (card.tagName === 'A' ? card : null);
             
            if (!linkEl) return null;
            
            const url = linkEl.href;
            const slug = this.extractSlug(url);
            
            const title = linkEl.getAttribute('title') || linkEl.textContent.trim();

            return {
                title,
                url,
                slug,
                id: slug
            };
        } catch (e) {
            return null;
        }
    },
    
    extractSlug(url) {
        try {
            // https://manganato.com/manga-xx12345
            const urlObj = new URL(url);
            const path = urlObj.pathname.replace(/^\//, ''); // remove leading slash
            return path.split('/')[0];
        } catch (e) {
            return '';
        }
    },

    applyBorder(card, color) {
        card.style.border = `3px solid ${color}`;
        card.style.borderRadius = '5px'; // Manganato uses smaller radius
        card.style.boxSizing = 'border-box';
        
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
    },
    
    // --- Reader Specifics ---
    isReaderPage() {
        return window.location.pathname.includes('chapter-');
    },
    
    parseUrl(url) {
        // e.g. .../manga-xx12345/chapter-10
        const match = url.match(/\/([^/]+)\/chapter-([\d.-]+)/);
        if (match) {
            return {
                slug: match[1],
                chapterNo: match[2]
            };
        }
        return null;
    },

    goToNextChapter() {
        const btn = document.querySelector('.navi-change-chapter-btn-next');
        if (btn) btn.click();
    },

    goToPrevChapter() {
        const btn = document.querySelector('.navi-change-chapter-btn-prev');
        if (btn) btn.click();
    }
};

// Initialize
const enhancer = new CardEnhancer(ManganatoAdapter);
enhancer.init();

if (ManganatoAdapter.isReaderPage()) {
    const reader = new ReaderEnhancer(ManganatoAdapter);
    reader.init();
}

console.log('[Manganato] Enhancer loaded.');
