/**
 * @fileoverview Asura Scans CardEnhancer Test Script
 * Test the new CardEnhancer on Asura Scans.
 * 
 * To run this test:
 * 1. Open Asura Scans in browser
 * 2. Open DevTools Console
 * 3. Paste this entire script
 * 4. Check for enhanced cards with borders and badges
 */

(async function testAsuraCardEnhancer() {
    console.log('[CardEnhancer Test] Starting...');

    // ========================================================================
    // INLINE CONFIG (from scripts/core/config.js)
    // ========================================================================
    const STATUS_COLORS = {
        'Reading': '#4ade80',
        'Completed': '#60a5fa',
        'Plan to Read': '#fbbf24',
        'On-Hold': '#f97316',
        'Dropped': '#ef4444',
        'Re-reading': '#a855f7'
    };

    // ========================================================================
    // INLINE ASURA ADAPTER (from scripts/platforms/asurascans/adapter.js)
    // ========================================================================
    const AsuraAdapter = {
        id: 'asurascans',
        name: 'Asura Scans',
        unitName: 'chapter',
        PREFIX: 'asura:',
        
        selectors: {
            card: 'a[href*="/series/"]:has(img), div.grid.grid-cols-12:has(a[href*="/series/"])',
            cardTitle: 'span.font-medium, a[href*="/series/"] span, h2, h3',
            cardLink: 'a[href*="/series/"]',
            cardCover: 'img.object-cover, img'
        },

        extractCardData(cardElement) {
            let title = '';
            let url = '';
            let slug = '';

            const linkEl = cardElement.tagName === 'A' ? cardElement : cardElement.querySelector('a[href*="/series/"]');
            
            if (linkEl) {
                url = linkEl.href;
                slug = this.extractSlug(url);
                const titleEl = linkEl.querySelector('span') || linkEl;
                title = titleEl.textContent?.trim() || '';
            }

            if (!title && cardElement.classList.contains('grid')) {
                const titleLink = cardElement.querySelector('span.font-medium a, a[href*="/series/"]');
                if (titleLink) {
                    title = titleLink.textContent?.trim();
                    url = titleLink.href;
                    slug = this.extractSlug(url);
                }
            }

            return { id: slug, title, slug, url };
        },

        extractSlug(url) {
            try {
                const parts = new URL(url).pathname.split('/').filter(p => p);
                const seriesIndex = parts.indexOf('series');
                if (seriesIndex !== -1 && parts[seriesIndex + 1]) {
                    return parts[seriesIndex + 1];
                }
                return parts[parts.length - 1];
            } catch (e) {
                return '';
            }
        },

        applyBorder(element, color, size, style) {
            element.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
            element.style.setProperty('border-radius', '8px', 'important');
            element.style.setProperty('box-sizing', 'border-box', 'important');
        },

        getBadgePosition() {
            return { bottom: '8px', left: '8px' };
        }
    };

    // ========================================================================
    // SIMPLIFIED CARD ENHANCER
    // ========================================================================
    class TestCardEnhancer {
        constructor(adapter, settings = {}) {
            this.adapter = adapter;
            this.settings = {
                highlighting: true,
                progressBadges: true,
                border: {
                    size: settings.CustomBorderSize || 4,
                    style: 'solid'
                }
            };
        }

        async enhanceAll() {
            const cards = this.findCards();
            console.log(`[CardEnhancer] Found ${cards.length} cards`);
            
            const library = await this.loadLibrary();
            console.log(`[CardEnhancer] Loaded ${library.length} library entries`);

            let enhanced = 0;
            for (const card of cards) {
                if (card.element.dataset.bmhEnhanced) continue;

                const match = this.findMatch(card, library);
                if (match) {
                    this.applyEnhancements(card, match);
                    enhanced++;
                    console.log(`[CardEnhancer] Enhanced: ${match.title} (${match.status})`);
                }
                card.element.dataset.bmhEnhanced = 'true';
            }

            console.log(`[CardEnhancer] Enhanced ${enhanced} cards`);
            return enhanced;
        }

        findCards() {
            const selector = this.adapter.selectors.card;
            return Array.from(document.querySelectorAll(selector))
                .map(el => ({
                    element: el,
                    data: this.adapter.extractCardData(el)
                }))
                .filter(card => card.data.title || card.data.id);
        }

        async loadLibrary() {
            return new Promise((resolve) => {
                chrome.storage.local.get(['savedEntriesMerged', 'userBookmarks', 'savedReadChapters'], (data) => {
                    if (chrome.runtime.lastError) {
                        console.error('[CardEnhancer] Storage error:', chrome.runtime.lastError);
                        resolve([]);
                        return;
                    }

                    const savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
                    const userBookmarks = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
                    const readChapters = data.savedReadChapters || {};

                    const merged = new Map();
                    [...userBookmarks, ...savedEntries].forEach(entry => {
                        if (entry?.title) {
                            entry.readChapters = this.getReadChaptersForEntry(entry, readChapters);
                            entry.lastReadChapter = this.getHighestChapter(entry.readChapters);
                            merged.set(entry.title, entry);
                        }
                    });

                    resolve(Array.from(merged.values()));
                });
            });
        }

        getReadChaptersForEntry(entry, readChapters) {
            const namespacedKey = `${this.adapter.PREFIX}${entry.slug}`;
            if (readChapters[namespacedKey]) return readChapters[namespacedKey];
            if (readChapters[entry.title]) return readChapters[entry.title];
            return [];
        }

        findMatch(card, library) {
            const normalizedTitle = this.normalizeTitle(card.data.title);
            return library.find(e =>
                this.normalizeTitle(e.title) === normalizedTitle
            );
        }

        applyEnhancements(card, entry) {
            if (this.settings.highlighting) {
                this.applyBorder(card, entry);
            }
            if (this.settings.progressBadges && entry.readChapters?.length > 0) {
                this.applyProgressBadge(card, entry);
            }
        }

        applyBorder(card, entry) {
            const status = entry.status?.trim().toLowerCase() || '';
            let color = 'transparent';

            for (const [key, value] of Object.entries(STATUS_COLORS)) {
                if (status.includes(key.toLowerCase())) {
                    color = value;
                    break;
                }
            }

            if (color === 'transparent') return;

            this.adapter.applyBorder(
                card.element,
                color,
                this.settings.border.size,
                this.settings.border.style
            );
        }

        applyProgressBadge(card, entry) {
            const totalChapters = entry.chapters || entry.anilistData?.chapters;
            const text = totalChapters
                ? `Ch. ${entry.lastReadChapter}/${totalChapters}`
                : `Ch. ${entry.lastReadChapter}`;

            const badge = this.createBadge(text);
            const position = this.adapter.getBadgePosition();
            Object.assign(badge.style, position);

            const imgContainer = card.element.querySelector('div.relative, img')?.parentElement || card.element;
            imgContainer.style.position = 'relative';
            imgContainer.appendChild(badge);
        }

        createBadge(text) {
            const badge = document.createElement('div');
            badge.className = 'bmh-badge bmh-badge-progress';
            badge.textContent = text;
            badge.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                font-size: 11px;
                font-weight: 700;
                padding: 4px 8px;
                border-radius: 6px;
                z-index: 20;
                pointer-events: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
            `;
            return badge;
        }

        normalizeTitle(title) {
            if (!title) return '';
            return title.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        getHighestChapter(chapters) {
            if (!chapters || chapters.length === 0) return 0;
            let highest = 0;
            chapters.forEach(ch => {
                const match = String(ch).match(/^(\d+\.?\d*)/);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (num > highest) highest = num;
                }
            });
            return highest;
        }
    }

    // ========================================================================
    // RUN TEST
    // ========================================================================
    try {
        const enhancer = new TestCardEnhancer(AsuraAdapter);
        const count = await enhancer.enhanceAll();
        
        console.log(`✅ [CardEnhancer Test] Successfully enhanced ${count} cards!`);
        console.log('[CardEnhancer Test] Check the page for colored borders and progress badges.');
        
        return { success: true, enhanced: count };
    } catch (error) {
        console.error('❌ [CardEnhancer Test] Error:', error);
        return { success: false, error: error.message };
    }
})();
