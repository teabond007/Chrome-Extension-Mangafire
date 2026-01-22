import { CardEnhancer } from '@/content/CardEnhancer';
import './styles.css';

import { ReaderEnhancer } from '@/content/ReaderEnhancer';

const AsuraScansAdapter = {
    id: 'asurascans',
    name: 'Asura Scans',
    
    selectors: {
        card: 'a[href*="/series/"]:has(img), .w-full.p-2.border, .grid-flow-row .group, div.grid.grid-cols-12:has(a[href*="/series/"]), .grid.grid-cols-2 a[href*="/series/"]',
        cardTitle: 'span.font-medium, a[href*="/series/"] span, h2, h3, .font-bold',
        cardLink: 'a[href*="/series/"]',
    },
    
    extractCardData(card) {
        try {
            // Determine if 'card' is the link itself or a container
            let linkEl;
            if (card.tagName === 'A' && card.href.includes('/series/')) {
                linkEl = card;
            } else {
                linkEl = card.querySelector(this.selectors.cardLink);
            }
            
            if (!linkEl) return null;

            const url = linkEl.href;
            const slug = this.extractSlug(url);
            
            // Extract title
            let title = '';
            // Try explicit title selector inside card
            const titleEl = card.querySelector(this.selectors.cardTitle);
            if (titleEl) {
                title = titleEl.textContent.trim();
            } else if (linkEl.title) {
                title = linkEl.title;
            } else {
                // Fallback: try finding text inside the link
                title = linkEl.textContent.trim();
            }
            // Cleanup title (remove "Chapter ...")
            title = title.split(/\n|Chapter/i)[0].trim();

            return {
                title,
                url,
                slug,
                id: slug // Asura uses slug as ID generally
            };
        } catch (e) {
            console.warn('Error extracting card data', e);
            return null;
        }
    },
    
    extractSlug(url) {
        try {
            const urlObj = new URL(url);
            const segments = urlObj.pathname.split('/').filter(s => s);
            const seriesIndex = segments.indexOf('series');
            if (seriesIndex !== -1 && segments[seriesIndex + 1]) {
                return segments[seriesIndex + 1];
            }
            // Fallback for different URL structures
            return segments[segments.length - 1];
        } catch (e) {
            return '';
        }
    },
    
    applyBorder(card, color) {
        card.style.border = `3px solid ${color}`;
        card.style.borderRadius = '8px';
        card.style.boxSizing = 'border-box';
        
        // Ensure relative position for overlay
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
    },

    // --- Reader Specifics ---
    isReaderPage() {
        // Typically contains /chapter/ or ends with -chapter-X
        // Asura URL: https://asuracomic.net/series/ranker-who-lives-a-second-time-daa13/chapter-169
        return window.location.href.includes('/chapter');
    },

    parseUrl(url) {
        try {
            // Match /series/slug/chapter-number
            const match = url.match(/\/series\/([^/]+)\/chapter-([\d.]+)/);
            if (match) {
                return {
                    slug: match[1],
                    id: match[1],
                    chapterNo: match[2]
                };
            }
        } catch (e) {
            return null;
        }
        return null;
    },

    goToNextChapter() {
        // Asura typically has buttons with specific classes or text
        const next = document.querySelector('.next-chapter, a[href*="chapter"]:not([href*="series"])'); // Heuristic
        if (next) next.click();
        else {
             // Look for text "Next"
             const links = Array.from(document.querySelectorAll('a'));
             const nextLink = links.find(l => l.innerText.includes('Next') || l.innerText.includes('NEXT'));
             if (nextLink) nextLink.click();
        }
    },

    goToPrevChapter() {
        const prev = document.querySelector('.prev-chapter, a[href*="chapter"]:not([href*="series"])');
         if (prev) prev.click();
         else {
             const links = Array.from(document.querySelectorAll('a'));
             const prevLink = links.find(l => l.innerText.includes('Prev') || l.innerText.includes('PREV'));
             if (prevLink) prevLink.click();
        }
    }
};

// Initialize
const enhancer = new CardEnhancer(AsuraScansAdapter);
enhancer.init();

if (AsuraScansAdapter.isReaderPage()) {
    const reader = new ReaderEnhancer(AsuraScansAdapter);
    reader.init();
}

console.log('[AsuraScans] Enhancer loaded.');
