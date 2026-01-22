import { defineCustomElement } from 'vue';
import AutoScrollPanel from './components/AutoScrollPanel.ce.vue';
import { Config } from '@/core/config';
import { STORAGE_KEYS } from '@/core/storage-schema';

// Register
const AutoScrollPanelElement = defineCustomElement(AutoScrollPanel);
if (!customElements.get('bmh-autoscroll-panel')) {
    customElements.define('bmh-autoscroll-panel', AutoScrollPanelElement);
}

export class ReaderEnhancer {
    constructor(adapter) {
        this.adapter = adapter;
        this.autoScroll = null;
        this.config = null;
        this.settings = {
            autoScrollEnabled: false,
            autoScrollSpeed: 50,
            keybindsEnabled: true
        };
        // State
        this.scrollInterval = null;
        this.isScrolling = false;
        this.panelElement = null;
    }

    async init() {
        console.log('[ReaderEnhancer] Initializing...');
        
        // Load settings
        await this.loadSettings();

        // 1. Initialize AutoScroll if enabled
        if (this.settings.autoScrollEnabled) {
            this.mountPanel();
        }

        // 2. Initialize Keybinds
        if (this.settings.keybindsEnabled) {
            this.setupKeybinds();
        }

        // 3. Progress Tracking (Auto-save chapter)
        this.startProgressTracking();
    }

    async loadSettings() {
        this.config = await Config.load();
        const stored = await chrome.storage.local.get(['autoScrollEnabled', 'autoScrollSpeed']);
        this.settings.autoScrollEnabled = stored.autoScrollEnabled !== false;
        this.settings.autoScrollSpeed = stored.autoScrollSpeed || 50;
    }

    mountPanel() {
        if (document.querySelector('bmh-autoscroll-panel')) return;

        this.panelElement = document.createElement('bmh-autoscroll-panel');
        
        // Positioning (can be saved/restored later)
        this.panelElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
        `;
        
        // Pass props
        this.panelElement.initialSpeed = this.settings.autoScrollSpeed;
        this.panelElement.initialState = false;

        // Events
        this.panelElement.addEventListener('toggle', (e) => this.toggleScroll(e.detail[0]));
        this.panelElement.addEventListener('update:speed', (e) => this.updateSpeed(e.detail[0]));

        document.body.appendChild(this.panelElement);
    }

    // --- Auto Scroll Logic ---

    toggleScroll(shouldScroll) {
        if (shouldScroll) {
            this.startScroll();
        } else {
            this.stopScroll();
        }
    }

    startScroll() {
        if (this.scrollInterval) return;
        this.isScrolling = true;
        
        const frameRate = 60;
        const pixelsPerSecond = this.settings.autoScrollSpeed;
        const pixelsPerFrame = pixelsPerSecond / frameRate;
        
        let accumulator = 0;

        this.scrollInterval = setInterval(() => {
            const scrollTarget = this.findScrollTarget();
            
            accumulator += pixelsPerFrame;
            const scrollAmount = Math.floor(accumulator);
            
            if (scrollAmount >= 1) {
                if (scrollTarget === window) {
                   window.scrollBy(0, scrollAmount);
                } else {
                   scrollTarget.scrollTop += scrollAmount;
                }
                accumulator -= scrollAmount;
            }
            
            // Safety: Check if at bottom? (Optional)

        }, 1000 / frameRate);
    }

    stopScroll() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        this.isScrolling = false;
        // Sync UI if toggled via keybind
        if (this.panelElement) {
            // We can't easily push state into the Vue CE props reactively without re-setting
            // But we can call a method if exposed?
            // For CE, props changes work if we set the property on the element.
            // this.panelElement.isRunning = false; // Need to expose proper prop/method
        }
    }

    updateSpeed(newSpeed) {
        this.settings.autoScrollSpeed = newSpeed;
        // Persist
        chrome.storage.local.set({ autoScrollSpeed: newSpeed });
        
        // Restart if running to apply new speed calculation
        if (this.isScrolling) {
            this.stopScroll();
            this.startScroll();
        }
    }

    findScrollTarget() {
        // Platform specific logic or generic overrides?
        // Generic approach:
        // 1. Try generic selectors often used for reader containers
        const candidates = [
            '#chapter-reader', '.chapter-content', '.reader-content', 
            '.reading-content', '#content', '.manga-reader', 
            '.read-container', 'main', 'article'
        ];

        for (const sel of candidates) {
            const el = document.querySelector(sel);
            if (el && el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY.includes('auto')) {
                return el;
            }
        }
        
        // 2. Check if body/html scrolls
        return window;
    }

    // --- Keybinds ---
    setupKeybinds() {
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            
            // Todo: customizable keybinds
            switch(e.key) {
                case ' ': // Space: toggle scroll
                    e.preventDefault();
                    if (this.isScrolling) {
                         this.toggleScroll(false);
                         // Update UI
                         if(this.panelElement) this.panelElement.toggle(); 
                    } else {
                         this.toggleScroll(true);
                         if(this.panelElement) this.panelElement.toggle();
                    }
                    break;
                case 'ArrowDown':
                    // e.preventDefault();
                    // window.scrollBy({ top: 300, behavior: 'smooth' });
                    break;
                // Add next/prev chapter bindings
                case 'n':
                case 'N':
                    this.adapter.goToNextChapter?.();
                    break;
                case 'p':
                case 'P':
                    this.adapter.goToPrevChapter?.();
                    break;
            }
        });
    }
    
    // --- Progress Tracking ---
    startProgressTracking() {
        // Wait a bit to ensure page loaded
        setTimeout(() => {
            this.saveCurrentChapter();
        }, 5000); // 5s delay

        // Also track scroll depth?
    }

    async saveCurrentChapter() {
        if (!this.adapter.parseUrl) return;
        
        const data = this.adapter.parseUrl(window.location.href);
        if (!data || !data.chapterNo) return;
        
        // Just extract basics
        const { slug, id, chapterNo } = data;
        if (!slug && !id) return;

        // Message background or direct storage?
        // Direct storage is faster for content scripts usually if permission exists.
        
        // We need to update:
        // 1. savedReadChapters: { [slug]: [ch1, ch2] }
        // 2. savedEntriesMerged: find entry and update lastReadChapter
        
        try {
            const storage = await chrome.storage.local.get(['savedReadChapters', 'savedEntriesMerged']);
            let readChapters = storage.savedReadChapters || {};
            let library = storage.savedEntriesMerged || [];
            
            // Key resolution (same as CardEnhancer logic ideally)
            const key = slug || `${this.adapter.id}:${id}`;
            
            if (!readChapters[key]) readChapters[key] = [];
            const strCh = String(chapterNo);
            
            if (!readChapters[key].includes(strCh)) {
                readChapters[key].push(strCh);
                // Sort roughly?
                readChapters[key].sort((a,b) => parseFloat(a) - parseFloat(b));
                
                await chrome.storage.local.set({ savedReadChapters: readChapters });
                console.log(`[ReaderEnhancer] Marked ch ${chapterNo} as read for ${key}`);
            }

            // Update Library Entry stats
            const entryIndex = library.findIndex(item => 
                 (item.source === this.adapter.id && item.sourceId === id) || 
                 (item.slug && item.slug === slug)
            );

            if (entryIndex !== -1) {
                const entry = library[entryIndex];
                const currentMax = parseFloat(entry.lastReadChapter || 0);
                
                if (parseFloat(chapterNo) > currentMax) {
                    entry.lastReadChapter = chapterNo;
                    entry.lastReadUrl = window.location.href;
                    entry.lastReadDate = Date.now();
                }
                
                // Keep read count in sync generally?
                entry.readChapters = readChapters[key].length;
                
                library[entryIndex] = entry;
                await chrome.storage.local.set({ savedEntriesMerged: library });
            }

        } catch (e) {
            console.error('[ReaderEnhancer] Failed to save progress', e);
        }
    }
}
