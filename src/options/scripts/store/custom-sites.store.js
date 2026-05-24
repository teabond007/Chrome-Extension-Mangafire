/**
 * @fileoverview Pinia store for managing user-defined custom site configurations.
 * Enables the extension to support any manga reading site via user-created selectors.
 * @module store/custom-sites.store
 */
import { defineStore } from 'pinia';
import { DATA } from '../../../config.js';

/**
 * @typedef {Object} CustomSiteConfig
 * @property {string} id - UUID for the site configuration
 * @property {string} hostname - The site hostname (e.g., "bato.to")
 * @property {string} [url] - The exact listing URL provided by user
 * @property {string} name - User-friendly display name
 * @property {string} selectors.card - Manga card container selector
 * @property {string} selectors.title - Title element selector (relative to card)
 * @property {Object} [readerSelectors] - CSS selectors for reader page elements
 * @property {string} [readerSelectors.readerDetect] - Element whose presence identifies a reader page
 * @property {string} [readerSelectors.readerTitle] - Manga title on reader page
 * @property {string} [readerSelectors.readerChapter] - Chapter number/name on reader page
 * @property {boolean} enabled - Whether this site config is active
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

export const useCustomSitesStore = defineStore('customSites', {
    state: () => ({
        sites: [],
        isLoading: true,
        editingSite: null
    }),

    getters: {
        enabledSites: function(state) {
            console.log("getting enabled sites");
            var result = [];
            for (var i = 0; i < state.sites.length; i++) {
                if (state.sites[i] && state.sites[i].enabled == true) {
                    result.push(state.sites[i]);
                }
            }
            return result;
        },
        
        getSiteByHostname: function(state) {
            return function(hostname) {
                console.log("find site by hostname: " + hostname);
                for (var i = 0; i < state.sites.length; i++) {
                    if (state.sites[i] && state.sites[i].hostname === hostname) {
                        return state.sites[i];
                    }
                }
                return null;
            };
        },
        
        getSiteById: function(state) {
            return function(id) {
                console.log("find site by id: " + id);
                for (var i = 0; i < state.sites.length; i++) {
                    if (state.sites[i] && state.sites[i].id === id) {
                        return state.sites[i];
                    }
                }
                return null;
            };
        }
    },

    actions: {
        async loadSites() {
            console.log("loading custom sites from storage");
            this.isLoading = true;
            try {
                var data = await chrome.storage.local.get([DATA.CUSTOM_SITES]);
                var list = data[DATA.CUSTOM_SITES] || [];
                console.log("loaded sites count: " + list.length);
                this.sites = list;
            } catch (err) {
                console.log("load sites error: " + err);
            } finally {
                this.isLoading = false;
            }
        },

        async saveSites() {
            console.log("saving custom sites to storage");
            try {
                var serialized = JSON.stringify(this.sites);
                var parsed = JSON.parse(serialized);
                await chrome.storage.local.set({ [DATA.CUSTOM_SITES]: parsed });
                console.log("sites saved successfully");
                
                // notify background script
                chrome.runtime.sendMessage({ type: 'custom-sites-updated' });
            } catch (err) {
                console.log("save sites error: " + err);
            }
        },

        async addSite(siteData) {
            console.log("adding new custom site");
            try {
                var newSite = {
                    id: crypto.randomUUID(),
                    hostname: siteData.hostname || '',
                    url: siteData.url || ('https://' + (siteData.hostname || '')),
                    name: siteData.name || 'Untitled Site',
                    selectors: {
                        card: (siteData.selectors ? siteData.selectors.card : '') || '',
                        title: (siteData.selectors ? siteData.selectors.title : '') || ''
                    },
                    readerSelectors: siteData.readerSelectors || {
                        readerDetect: '',
                        readerTitle: '',
                        readerChapter: ''
                    },
                    enabled: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                this.sites.push(newSite);
                await this.saveSites();
                console.log("added site: " + newSite.name);
                return newSite;
            } catch (err) {
                console.log("add site error: " + err);
                return null;
            }
        },

        async updateSite(id, updates) {
            console.log("updating site: " + id);
            try {
                var idx = -1;
                for (var i = 0; i < this.sites.length; i++) {
                    if (this.sites[i] && this.sites[i].id === id) {
                        idx = i;
                        break;
                    }
                }

                if (idx === -1) {
                    console.log("site not found for update");
                    return;
                }

                var site = this.sites[idx];
                
                // copy updates manually
                for (var key in updates) {
                    if (key === 'selectors' && updates.selectors) {
                        site.selectors = {
                            card: updates.selectors.card || '',
                            title: updates.selectors.title || ''
                        };
                    } else if (key === 'readerSelectors' && updates.readerSelectors) {
                        site.readerSelectors = {
                            readerDetect: updates.readerSelectors.readerDetect || '',
                            readerTitle: updates.readerSelectors.readerTitle || '',
                            readerChapter: updates.readerSelectors.readerChapter || ''
                        };
                    } else {
                        site[key] = updates[key];
                    }
                }
                
                site.updatedAt = Date.now();
                this.sites[idx] = site;
                
                await this.saveSites();
                console.log("updated site successfully");
            } catch (err) {
                console.log("update site error: " + err);
            }
        },

        async removeSite(id) {
            console.log("removing site: " + id);
            try {
                var newSites = [];
                for (var i = 0; i < this.sites.length; i++) {
                    if (this.sites[i] && this.sites[i].id !== id) {
                        newSites.push(this.sites[i]);
                    }
                }
                this.sites = newSites;
                await this.saveSites();
                console.log("site removed");
            } catch (err) {
                console.log("remove site error: " + err);
            }
        },

        async toggleSite(id) {
            console.log("toggling site: " + id);
            try {
                for (var i = 0; i < this.sites.length; i++) {
                    if (this.sites[i] && this.sites[i].id === id) {
                        this.sites[i].enabled = !this.sites[i].enabled;
                        this.sites[i].updatedAt = Date.now();
                        console.log("site toggled to: " + this.sites[i].enabled);
                        break;
                    }
                }
                await this.saveSites();
            } catch (err) {
                console.log("toggle site error: " + err);
            }
        },

        setEditingSite(site) {
            console.log("setting editing site");
            if (site) {
                // simple clone
                var serialized = JSON.stringify(site);
                this.editingSite = JSON.parse(serialized);
            } else {
                this.editingSite = null;
            }
        },

        exportSites() {
            console.log("exporting custom sites");
            return JSON.stringify(this.sites, null, 2);
        },

        async importSites(jsonString) {
            console.log("importing custom sites from json");
            try {
                var imported = JSON.parse(jsonString);
                if (!Array.isArray(imported)) {
                    console.log("invalid import format");
                    return 0;
                }

                var count = 0;
                for (var i = 0; i < imported.length; i++) {
                    var site = imported[i];
                    
                    // check if hostname already exists
                    var exists = false;
                    for (var j = 0; j < this.sites.length; j++) {
                        if (this.sites[j] && this.sites[j].hostname === site.hostname) {
                            exists = true;
                            break;
                        }
                    }
                    
                    if (exists == true) {
                        console.log("site hostname already exists: " + site.hostname);
                        continue;
                    }
                    
                    site.id = crypto.randomUUID();
                    site.createdAt = Date.now();
                    site.updatedAt = Date.now();
                    this.sites.push(site);
                    count++;
                }

                await this.saveSites();
                console.log("imported count: " + count);
                return count;
            } catch (err) {
                console.log("import sites error: " + err);
                throw err;
            }
        }
    }
});
