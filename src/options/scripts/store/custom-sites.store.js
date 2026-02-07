/**
 * @fileoverview Pinia store for managing user-defined custom site configurations.
 * Enables the extension to support any manga reading site via user-created selectors.
 * @module store/custom-sites.store
 */
import { defineStore } from 'pinia';
import { storage } from '../core/storage-adapter.js';

/**
 * @typedef {Object} CustomSiteConfig
 * @property {string} id - UUID for the site configuration
 * @property {string} hostname - The site hostname (e.g., "bato.to")
 * @property {string} name - User-friendly display name
 * @property {string} [description] - Optional description
 * @property {Object} selectors - CSS selectors for DOM elements
 * @property {string} selectors.card - Manga card container selector
 * @property {string} selectors.title - Title element selector (relative to card)
 * @property {string} selectors.url - Link element selector (relative to card)
 * @property {string} [selectors.image] - Cover image selector
 * @property {string} [selectors.nextBtn] - Next chapter button (for reader pages)
 * @property {string} [selectors.prevBtn] - Previous chapter button
 * @property {string} [customFunction] - Advanced: custom JS for complex extraction
 * @property {boolean} enabled - Whether this site config is active
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

export const useCustomSitesStore = defineStore('customSites', {
    state: () => ({
        /** @type {CustomSiteConfig[]} */
        sites: [],
        isLoading: true,
        /** @type {CustomSiteConfig|null} Current site being edited */
        editingSite: null
    }),

    getters: {
        /** Returns only enabled site configs */
        enabledSites: (state) => state.sites.filter(s => s.enabled),
        
        /** Get site config by hostname */
        getSiteByHostname: (state) => (hostname) => {
            return state.sites.find(s => s.hostname === hostname);
        },
        
        /** Get site config by ID */
        getSiteById: (state) => (id) => {
            return state.sites.find(s => s.id === id);
        }
    },

    actions: {
        /**
         * Load all custom site configurations from storage.
         */
        async loadSites() {
            this.isLoading = true;
            try {
                const data = await storage.get(['customSites']);
                this.sites = data.customSites || [];
            } catch (err) {
                console.error('[CustomSitesStore] Failed to load sites:', err);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Persist current sites array to storage.
         */
        async saveSites() {
            try {
                await storage.set({ customSites: JSON.parse(JSON.stringify(this.sites)) });
                // Notify background to update content script registrations
                chrome.runtime.sendMessage({ type: 'custom-sites-updated' });
            } catch (err) {
                console.error('[CustomSitesStore] Failed to save sites:', err);
            }
        },

        /**
         * Add a new custom site configuration.
         * @param {Partial<CustomSiteConfig>} siteData - Initial site data
         * @returns {CustomSiteConfig} The created site config
         */
        async addSite(siteData) {
            const newSite = {
                id: crypto.randomUUID(),
                hostname: siteData.hostname || '',
                name: siteData.name || 'Untitled Site',
                description: siteData.description || '',
                selectors: {
                    card: siteData.selectors?.card || '',
                    title: siteData.selectors?.title || '',
                    url: siteData.selectors?.url || '',
                    image: siteData.selectors?.image || '',
                    nextBtn: siteData.selectors?.nextBtn || '',
                    prevBtn: siteData.selectors?.prevBtn || ''
                },
                customFunction: siteData.customFunction || '',
                enabled: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            this.sites.push(newSite);
            await this.saveSites();
            return newSite;
        },

        /**
         * Update an existing site configuration.
         * @param {string} id - Site ID to update
         * @param {Partial<CustomSiteConfig>} updates - Fields to update
         */
        async updateSite(id, updates) {
            const idx = this.sites.findIndex(s => s.id === id);
            if (idx === -1) return;

            this.sites[idx] = {
                ...this.sites[idx],
                ...updates,
                updatedAt: Date.now()
            };
            await this.saveSites();
        },

        /**
         * Remove a site configuration.
         * @param {string} id - Site ID to remove
         */
        async removeSite(id) {
            this.sites = this.sites.filter(s => s.id !== id);
            await this.saveSites();
        },

        /**
         * Toggle enabled state for a site.
         * @param {string} id - Site ID to toggle
         */
        async toggleSite(id) {
            const site = this.sites.find(s => s.id === id);
            if (site) {
                site.enabled = !site.enabled;
                site.updatedAt = Date.now();
                await this.saveSites();
            }
        },

        /**
         * Set the site currently being edited (for UI state).
         * @param {CustomSiteConfig|null} site 
         */
        setEditingSite(site) {
            this.editingSite = site ? { ...site } : null;
        },

        /**
         * Export all site configurations as JSON.
         * @returns {string} JSON string of all sites
         */
        exportSites() {
            return JSON.stringify(this.sites, null, 2);
        },

        /**
         * Import site configurations from JSON.
         * @param {string} jsonString - JSON string of sites array
         * @returns {number} Number of sites imported
         */
        async importSites(jsonString) {
            try {
                const imported = JSON.parse(jsonString);
                if (!Array.isArray(imported)) throw new Error('Invalid format');

                let count = 0;
                for (const site of imported) {
                    // Skip if hostname already exists
                    if (this.sites.some(s => s.hostname === site.hostname)) continue;
                    
                    // Generate new ID to avoid conflicts
                    site.id = crypto.randomUUID();
                    site.createdAt = Date.now();
                    site.updatedAt = Date.now();
                    this.sites.push(site);
                    count++;
                }

                await this.saveSites();
                return count;
            } catch (err) {
                console.error('[CustomSitesStore] Import failed:', err);
                throw err;
            }
        }
    }
});
