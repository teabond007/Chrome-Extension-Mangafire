import { STORAGE_KEYS } from '../../../config.js';
import { useSettingsStore } from '../store/settings.store.js';

/**
 * Initializes special "Info Redirect" buttons that link across tabs.
 * Typically used for "How to" labels that redirect the user to a specific guide on the About page.
 * 
 * @returns {void}
 */
export function initInfoRedirects() {
    document.querySelectorAll('.info-redirect-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const targetId = btn.getAttribute('data-target');

            // Automatically switch context to the 'About' tab via Pinia
            const settingsStore = useSettingsStore();
            settingsStore.activeTab = 'about';

            // Scroll to the specific guide card or section element
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    setTimeout(() => {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Apply a visual highlight pulse to draw user attention
                        targetElement.classList.add('highlight-pulse');
                        setTimeout(() => targetElement.classList.remove('highlight-pulse'), 2000);
                    }, 300);
                }
            }
        });
    });
}

/**
 * Initializes the "Scroll to Top" floating button functionality.
 * Monitors the main content container's scroll position to show/hide the button dynamically.
 * 
 * @returns {void}
 */
export function initScrollToTop() {
    const btn = document.getElementById("scrollToTopBtn");
    const container = document.querySelector(".main-content");
    if (!btn || !container) return;

    // Show button only after user has scrolled down significantly
    container.addEventListener("scroll", () => {
        if (container.scrollTop > 300) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    });

    // Handle smooth scrolling back to the top of the container
    btn.addEventListener("click", () => {
        container.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/**
 * Check for URL hash/params to open specific views (e.g. #library?showDetails=Title)
 * Handles deep linking from background script or other extension parts.
 */
export function initUrlParams() {
    const hash = window.location.hash; // e.g. #library?showDetails=...
    if (!hash) return;

    if (hash.includes('library') || hash.includes('saved-entries')) {
        // Switch to Saved Entries tab via Pinia
        const settingsStore = useSettingsStore();
        settingsStore.activeTab = 'saved-entries';
    }

    // Parse 'showDetails' param
    if (hash.includes('showDetails=')) {
        try {
            const parts = hash.split('showDetails=');
            if (parts.length > 1) {
                const title = decodeURIComponent(parts[1].split('&')[0]);
                
                // Wait for data load then show modal
                if (chrome.runtime?.id) {
                    chrome.storage.local.get([STORAGE_KEYS.LIBRARY_ENTRIES], (data) => {
                        const entries = data[STORAGE_KEYS.LIBRARY_ENTRIES] || [];
                        const normalizedTitle = title.toLowerCase().trim();
                    // Improved matching strategy
                        let entry = entries.find(e => e.title.toLowerCase().trim() === normalizedTitle);
                        
                        if (!entry) {
                             const targetSlug = normalizedTitle.replace(/[^a-z0-9]/g, '');
                             entry = entries.find(e => {
                                 const eSlug = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                                 return eSlug === targetSlug || eSlug.includes(targetSlug) || targetSlug.includes(eSlug);
                             });
                        }
                        
                        if (entry) {
                            const attemptShow = (retries = 0) => {
                                if (window.showMangaDetails) {
                                    window.showMangaDetails(entry);
                                } else if (retries < 20) {
                                    setTimeout(() => attemptShow(retries + 1), 200);
                                }
                            };
                            attemptShow();
                        } else {
                            console.warn(`[UI] Could not find entry for details param: ${title}`);
                        }
                    });
                }
            }
        } catch (e) {
            console.error("[UI] Error parsing URL params:", e);
        }
    }
}

/**
 * Initialize listeners for runtime messages related to navigation (e.g. showMangaDetails).
 */
export function initMessageListeners() {
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "showMangaDetails") {
            // 1. Switch to Saved Entries tab via Pinia
            const settingsStore = useSettingsStore();
            settingsStore.activeTab = 'saved-entries';
            
            // 2. Find entry and show modal
            if (chrome.runtime?.id) {
                chrome.storage.local.get([STORAGE_KEYS.LIBRARY_ENTRIES], (data) => {
                    const entries = data[STORAGE_KEYS.LIBRARY_ENTRIES] || [];
                    const targetTitle = (msg.title || '').toLowerCase().trim();
                    
                    // Improved matching strategy
                    let entry = entries.find(e => e.title.toLowerCase().trim() === targetTitle);
                    
                    if (!entry) {
                         // Try to match by slug if exact title fails
                         const targetSlug = targetTitle.replace(/[^a-z0-9]/g, '');
                         entry = entries.find(e => {
                             const eSlug = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                             return eSlug === targetSlug || eSlug.includes(targetSlug) || targetSlug.includes(eSlug);
                         });
                    }
                    
                    if (entry) {
                        const attemptShow = (retries = 0) => {
                            if (window.showMangaDetails) {
                                window.showMangaDetails(entry);
                            } else if (retries < 10) {
                                setTimeout(() => attemptShow(retries + 1), 200);
                            }
                        };
                        attemptShow();
                    } else {
                        console.warn(`[UI] Could not find entry for details: ${msg.title}`);
                    }
                });
            }
        }
    });
}
