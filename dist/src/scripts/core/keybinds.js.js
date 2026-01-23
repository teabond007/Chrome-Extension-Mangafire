/**
 * @fileoverview Keyboard shortcuts manager for manga reader pages.
 * Provides configurable keybindings for navigation, auto-scroll, and reader controls.
 */

/**
 * KeybindManager handles keyboard shortcuts for reader pages.
 * Supports customizable bindings stored in chrome.storage.
 */
class KeybindManager {
    /**
     * Default keyboard bindings.
     * Users can override these in settings.
     * @type {Object.<string, string>}
     */
    static defaults = {
        'ArrowDown': 'scrollDown',
        'ArrowUp': 'scrollUp',
        ' ': 'toggleAutoScroll',  // Space key
        'Escape': 'exitReader',
        'f': 'toggleFullscreen',
        'F': 'toggleFullscreen',
        'n': 'nextChapter',
        'N': 'nextChapter',
        'p': 'prevChapter',
        'P': 'prevChapter',
        'Home': 'scrollToTop',
        'End': 'scrollToBottom'
    };

    /**
     * Creates a new KeybindManager instance.
     * @param {Object} adapter - Platform adapter with navigation methods
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.bindings = new Map();
        this.enabled = true;
        this.boundHandler = this.handleKey.bind(this);
    }

    /**
     * Loads user keybindings from chrome.storage.
     * Merges with defaults, allowing user overrides.
     */
    async loadBindings() {
        try {
            const data = await chrome.storage.local.get('keybinds');
            const custom = data.keybinds || {};

            // Merge defaults with custom (custom takes priority)
            const merged = { ...KeybindManager.defaults, ...custom };
            
            Object.entries(merged).forEach(([key, action]) => {
                this.bindings.set(key, action);
            });

            console.log('[Keybinds] Loaded', this.bindings.size, 'bindings');
        } catch (e) {
            console.warn('[Keybinds] Failed to load bindings:', e);
            // Fall back to defaults
            Object.entries(KeybindManager.defaults).forEach(([key, action]) => {
                this.bindings.set(key, action);
            });
        }
    }

    /**
     * Saves current keybindings to chrome.storage.
     */
    async saveBindings() {
        try {
            const bindings = Object.fromEntries(this.bindings);
            await chrome.storage.local.set({ keybinds: bindings });
        } catch (e) {
            console.warn('[Keybinds] Failed to save bindings:', e);
        }
    }

    /**
     * Starts listening for keyboard events.
     * Uses capture phase to handle events before site's own handlers.
     */
    start() {
        document.addEventListener('keydown', this.boundHandler, { capture: true });
        console.log('[Keybinds] Started listening');
    }

    /**
     * Stops listening for keyboard events.
     */
    stop() {
        document.removeEventListener('keydown', this.boundHandler, { capture: true });
        console.log('[Keybinds] Stopped listening');
    }

    /**
     * Temporarily enables/disables keybinds (e.g., during modal open).
     * @param {boolean} enabled - Whether keybinds should be active
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Handles keydown events and triggers corresponding actions.
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKey(event) {
        // Skip if disabled or user is typing in an input
        if (!this.enabled) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
        if (event.target.isContentEditable) return;

        // Skip if modifier keys are pressed (except for standalone modifiers)
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        const action = this.bindings.get(event.key);
        if (action) {
            event.preventDefault();
            event.stopPropagation();
            this.executeAction(action);
        }
    }

    /**
     * Executes the action associated with a keybind.
     * @param {string} action - The action name to execute
     */
    executeAction(action) {
        const actions = {
            // Navigation
            nextPage: () => this.adapter.goToNextPage?.() || this.scrollPage(1),
            prevPage: () => this.adapter.goToPrevPage?.() || this.scrollPage(-1),
            nextChapter: () => this.adapter.goToNextChapter?.(),
            prevChapter: () => this.adapter.goToPrevChapter?.(),
            
            // Scrolling - use 50% of viewport for more controlled movement
            scrollDown: () => window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' }),
            scrollUp: () => window.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' }),
            scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            scrollToBottom: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
            
            // Auto-scroll
            toggleAutoScroll: () => window.bmhAutoScroll?.toggle(),
            speedUp: () => {
                if (window.bmhAutoScroll) {
                    window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed + 20);
                }
            },
            speedDown: () => {
                if (window.bmhAutoScroll) {
                    window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed - 20);
                }
            },
            
            // Reader controls
            toggleFullscreen: () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen().catch(e => {
                        console.warn('[Keybinds] Fullscreen failed:', e);
                    });
                }
            },
            exitReader: () => {
                // Exit fullscreen first if active
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    // Try to go to manga detail page
                    this.adapter.exitReader?.();
                }
            }
        };

        const actionFn = actions[action];
        if (actionFn) {
            actionFn();
            console.log('[Keybinds] Executed:', action);
        } else {
            console.warn('[Keybinds] Unknown action:', action);
        }
    }

    /**
     * Scrolls by a number of "pages" (viewport heights).
     * @param {number} pages - Number of pages to scroll (negative for up)
     */
    scrollPage(pages) {
        window.scrollBy({
            top: window.innerHeight * 0.5 * pages,
            behavior: 'smooth'
        });
    }

    /**
     * Updates a specific keybinding.
     * @param {string} key - The keyboard key
     * @param {string} action - The action to bind
     */
    setBinding(key, action) {
        this.bindings.set(key, action);
        this.saveBindings();
    }

    /**
     * Removes a keybinding.
     * @param {string} key - The keyboard key to unbind
     */
    removeBinding(key) {
        this.bindings.delete(key);
        this.saveBindings();
    }

    /**
     * Resets all keybindings to defaults.
     */
    resetToDefaults() {
        this.bindings.clear();
        Object.entries(KeybindManager.defaults).forEach(([key, action]) => {
            this.bindings.set(key, action);
        });
        this.saveBindings();
    }

    /**
     * Initializes the keybind manager.
     * Loads bindings and starts listening.
     */
    async init() {
        await this.loadBindings();
        this.start();
        
        // Make globally accessible
        window.bmhKeybinds = this;
        
        console.log('[Keybinds] Initialized');
    }

    /**
     * Cleans up the keybind manager.
     */
    destroy() {
        this.stop();
        delete window.bmhKeybinds;
    }
}

export default KeybindManager;
