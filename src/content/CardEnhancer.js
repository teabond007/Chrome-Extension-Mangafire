import { defineCustomElement } from 'vue';
import QuickActions from './components/QuickActionsOverlay.ce.vue';
import StatusPicker from './components/StatusPicker.ce.vue';
import RatingPicker from './components/RatingPicker.ce.vue';
import { Config } from '@/core/config';
import { STORAGE_KEYS, createLibraryEntry, slugify } from '@/core/storage-schema';

// Register Custom Element
const QuickActionsElement = defineCustomElement(QuickActions);
if (!customElements.get('bmh-quick-actions')) {
    customElements.define('bmh-quick-actions', QuickActionsElement);
}

const StatusPickerElement = defineCustomElement(StatusPicker);
if (!customElements.get('bmh-status-picker')) {
    customElements.define('bmh-status-picker', StatusPickerElement);
}

const RatingPickerElement = defineCustomElement(RatingPicker);
if (!customElements.get('bmh-rating-picker')) {
    customElements.define('bmh-rating-picker', RatingPickerElement);
}

export class CardEnhancer {
    constructor(adapter) {
        this.adapter = adapter;
        this.settings = {
            highlighting: true,
            quickActions: true
        };
        this.library = new Map();
        this.observer = null;
        this.config = null;
    }

    async init() {
        console.log(`[CardEnhancer] Initializing for ${this.adapter.name}...`);
        
        await this.loadSettings();
        await this.loadLibrary();
        
        this.enhanceVisibleCards();
        this.startObserver();
        
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                if (changes[STORAGE_KEYS.LIBRARY]) {
                    this.loadLibrary().then(() => this.enhanceVisibleCards());
                }
                // Reload config if features/colors change
                if (changes.features || changes.statusColors) {
                    this.loadSettings().then(() => this.enhanceVisibleCards());
                }
            }
        });
    }

    async loadSettings() {
        this.config = await Config.load();
        this.settings.highlighting = this.config.isFeatureEnabled('highlighting');
        this.settings.quickActions = this.config.isFeatureEnabled('quickActions');
    }

    async loadLibrary() {
        const data = await chrome.storage.local.get(STORAGE_KEYS.LIBRARY);
        const entries = data[STORAGE_KEYS.LIBRARY] || [];
        this.library.clear();
        entries.forEach(entry => {
            // Index by ID and Slug for fast lookup
            if (entry.sourceId) this.library.set(`${entry.source}:${entry.sourceId}`, entry);
            if (entry.slug) this.library.set(`${entry.source}:${entry.slug}`, entry);
            // Fallback: also index by simple slug if source matches current adapter
            if (entry.slug && entry.source === this.adapter.id) {
                this.library.set(entry.slug, entry);
            }
        });
    }

    startObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldEnhance = false;
            for (const m of mutations) {
                if (m.addedNodes.length > 0) {
                    shouldEnhance = true;
                    break;
                }
            }
            if (shouldEnhance) {
                // Debounce simple
                if (this._debounce) clearTimeout(this._debounce);
                this._debounce = setTimeout(() => this.enhanceVisibleCards(), 200);
            }
        });
        
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    enhanceVisibleCards() {
        const selector = this.adapter.selectors.card;
        if (!selector) return;
        
        const cards = document.querySelectorAll(selector);
        cards.forEach(card => this.enhanceCard(card));
    }

    enhanceCard(card) {
        if (card.dataset.bmhEnhanced) return;
        
        const cardData = this.adapter.extractCardData(card);
        if (!cardData || (!cardData.id && !cardData.title)) return;
        
        const entry = this.findMatch(cardData);
        
        // Mark as enhanced
        card.dataset.bmhEnhanced = 'true';
        
        // Listen for hover to show overlay
        card.addEventListener('mouseenter', () => {
             const overlay = card.querySelector('bmh-quick-actions');
             if (overlay) overlay.setAttribute('visible', '');
        });
        card.addEventListener('mouseleave', () => {
             const overlay = card.querySelector('bmh-quick-actions');
             if (overlay) overlay.removeAttribute('visible');
        });

        // Apply visual enhancements logic
        if (this.settings.highlighting && entry) {
            this.applyBorder(card, entry);
        }
        
        if (this.settings.quickActions) {
            this.mountQuickActions(card, entry || this.createTemporaryEntry(cardData));
        }
    }

    findMatch(cardData) {
        // Try specific ID first
        if (cardData.id) {
            const key = `${this.adapter.id}:${cardData.id}`;
            if (this.library.has(key)) return this.library.get(key);
        }
        
        // Try slug
        if (cardData.slug) {
            // Try namespace first
            const nsKey = `${this.adapter.id}:${cardData.slug}`;
            if (this.library.has(nsKey)) return this.library.get(nsKey);
            // Try raw slug
            if (this.library.has(cardData.slug)) return this.library.get(cardData.slug);
        }
        
        return null;
    }

    createTemporaryEntry(cardData) {
        // Return a partially hydrated object for non-library items
        // Important: It must contain enough info to create a new entry if user interacts
        return {
            id: cardData.id,
            title: cardData.title,
            slug: cardData.slug,
            status: null,
            source: this.adapter.id,
            sourceUrl: cardData.url,
            // Mock empty tracking data
            lastReadChapter: null,
            personalData: { rating: 0 }
        };
    }

    applyBorder(card, entry) {
        const color = this.config ? this.config.getStatusColor(entry.status) : 'transparent';
        
        if (this.adapter.applyBorder) {
            this.adapter.applyBorder(card, color);
        } else {
            // Default logic
            card.style.border = `3px solid ${color}`;
            card.style.borderRadius = '8px';
        }
    }

    mountQuickActions(card, entry) {
        const overlay = document.createElement('bmh-quick-actions');
        overlay.entry = entry;
        overlay.statusColors = this.config ? this.config.statusColors : {};
        
        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }
        
        overlay.addEventListener('continue', () => this.handleContinue(entry));
        overlay.addEventListener('open-status', (e) => this.handleStatus(e, entry));
        overlay.addEventListener('open-rating', (e) => this.handleRating(e, entry));
        overlay.addEventListener('details', () => this.handleDetails(entry));
        
        card.appendChild(overlay);
    }

    // Actions
    handleContinue(entry) {
        if (entry.lastReadUrl) {
            window.location.href = entry.lastReadUrl;
        } else if (entry.sourceUrl) {
            window.location.href = entry.sourceUrl;
        }
    }

    handleStatus(event, entry) {
        // Position relative to button click event if possible, or center
        const rect = event.target.getBoundingClientRect();
        this.mountPicker('bmh-status-picker', {
            currentStatus: entry.status,
            statusColors: this.config.statusColors,
            position: { top: rect.bottom + 8, left: rect.left }
        }, (newStatus) => {
            this.updateLibraryEntry(entry, { status: newStatus });
        });
    }

    handleRating(event, entry) {
        const rect = event.target.getBoundingClientRect();
        this.mountPicker('bmh-rating-picker', {
            currentRating: entry.personalData?.rating || 0,
            position: { top: rect.bottom + 8, left: rect.left }
        }, (newRating) => {
            // Rating is stored in personalData
            const personalData = entry.personalData || {};
            personalData.rating = newRating;
            this.updateLibraryEntry(entry, { personalData });
        });
    }

    mountPicker(tagName, props, onSelect) {
        // Remove existing pickers
        document.querySelectorAll('bmh-status-picker, bmh-rating-picker').forEach(el => el.remove());

        const picker = document.createElement(tagName);
        Object.assign(picker, props);
        
        // Boundary Check for Position could go here
        
        picker.addEventListener('select', (e) => {
            onSelect(e.detail[0]); // Vue custom event detail is array args
            picker.remove();
        });
        
        picker.addEventListener('close', () => picker.remove());
        
        document.body.appendChild(picker);
    }

    async updateLibraryEntry(entry, updates) {
        const data = await chrome.storage.local.get(STORAGE_KEYS.LIBRARY);
        let library = data[STORAGE_KEYS.LIBRARY] || [];
        
        const index = library.findIndex(item => 
            (item.source === entry.source && item.sourceId === entry.id) || 
            (item.slug && item.slug === entry.slug && item.source === entry.source)
        );

        if (index !== -1) {
            // Update existing
            library[index] = { ...library[index], ...updates };
        } else {
            // Add new
            if (!updates.status && !updates.personalData?.rating) return; // Don't save if cleared
            
            const newEntry = createLibraryEntry({
                ...entry,
                ...updates
            });
            library.push(newEntry);
        }

        await chrome.storage.local.set({ [STORAGE_KEYS.LIBRARY]: library });
        console.log(`[CardEnhancer] Updated entry: ${entry.title}`, updates);
    }

    handleDetails(entry) {
        console.log('Details for', entry);
        if (entry.sourceUrl) window.open(entry.sourceUrl, '_blank');
    }
}
