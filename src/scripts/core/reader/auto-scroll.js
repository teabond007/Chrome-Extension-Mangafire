/**
 * @fileoverview Universal auto-scroll controller for vertical manga/webtoon reading.
 * Handles both window scroll and custom scroll containers used by manga sites.
 */

/**
 * AutoScrollController manages smooth automatic scrolling for reader pages.
 */
class AutoScrollController {
    constructor(options = {}) {
        this.speed = options.speed || 50;
        this.isRunning = false;
        this.intervalId = null;
        this.showPanel = options.showPanel !== false;
        this.vueApp = null;
        this.adapter = options.adapter || null;
        this.scrollTarget = null;
        this.lastScrollPos = -1;
        this.stuckCount = 0;
    }

    /**
     * Finds the scrollable element on the page.
     * Tries multiple selectors and methods to find the right container.
     */
    findScrollTarget() {
        // Common reader container selectors for various manga sites
        const selectors = [
            '#chapter-reader',
            '.chapter-content', 
            '.reader-content',
            '.reading-content',
            '#content',
            '.manga-reader',
            '.read-container',
            'main',
            'article',
            '.container'
        ];

        // First, check if any element has more scroll height than viewport
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                const style = window.getComputedStyle(el);
                const isScrollable = style.overflow === 'auto' || 
                                    style.overflow === 'scroll' ||
                                    style.overflowY === 'auto' || 
                                    style.overflowY === 'scroll';
                
                if (isScrollable && el.scrollHeight > el.clientHeight) {
                    return { element: el, useElement: true };
                }
            }
        }

        // Check document element and body
        const docEl = document.documentElement;
        const body = document.body;
        
        // If body or documentElement has scroll, use window
        if (body.scrollHeight > window.innerHeight || docEl.scrollHeight > window.innerHeight) {
            return { element: window, useElement: false };
        }

        // Find any scrollable element with significant content
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            if (el.scrollHeight > el.clientHeight + 100) {
                const style = window.getComputedStyle(el);
                if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                    style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    return { element: el, useElement: true };
                }
            }
        }

        // Default to window
        return { element: window, useElement: false };
    }

    /**
     * Gets current scroll position.
     */
    getScrollPos() {
        if (this.scrollTarget.useElement) {
            return this.scrollTarget.element.scrollTop;
        }
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    }

    /**
     * Performs the scroll action.
     */
    doScroll(amount) {
        if (this.scrollTarget.useElement) {
            this.scrollTarget.element.scrollTop += amount;
        } else {
            window.scrollBy(0, amount);
        }
    }

    /**
     * Starts the auto-scroll animation.
     */
    start() {
        if (this.isRunning) return;

        // Find scroll target
        this.scrollTarget = this.findScrollTarget();
        this.isRunning = true;
        this.lastScrollPos = this.getScrollPos();
        this.stuckCount = 0;
        
        this.scrollAmount = this.speed / 60;
        
        this.intervalId = setInterval(() => {
            if (!this.isRunning) {
                this.stop();
                return;
            }

            this.doScroll(this.scrollAmount);
            
            // Check if stuck (scroll position not changing)
            const currentPos = this.getScrollPos();
            if (Math.abs(currentPos - this.lastScrollPos) < 0.1) {
                this.stuckCount++;
                if (this.stuckCount > 60) { // ~1 second of no movement
                    this.stop();
                    return;
                }
            } else {
                this.stuckCount = 0;
            }
            this.lastScrollPos = currentPos;
            
        }, 1000 / 60);

        this.updatePanelState();
    }

    /**
     * Stops the auto-scroll.
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        this.updatePanelState();
    }

    /**
     * Toggles auto-scroll on/off.
     */
    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Sets the scroll speed.
     */
    setSpeed(speed) {
        this.speed = Math.max(10, Math.min(400, speed));
        
        // Update live scroll amount if running
        if (this.isRunning) {
            this.scrollAmount = this.speed / 60;
        }

        this.updatePanelState();
    }

    /**
     * Updates Vue panel UI state.
     */
    updatePanelState() {
        if (this.vueApp && this.vueApp.vm) {
            this.vueApp.vm.isRunning = this.isRunning;
            this.vueApp.vm.speed = this.speed;
        }
    }

    /**
     * Creates and mounts the Vue control panel.
     */
    createControlPanel() {
        if (!this.adapter) {
            console.warn('[AutoScroll] Navigation adapter missing, cannot mount reader controls.');
            return;
        }

        const props = {
            speed: this.speed,
            isRunning: this.isRunning
        };
        const handlers = {
            onToggle: () => this.toggle(),
            onSpeedChange: (val) => this.setSpeed(val)
        };

        import('../overlay-factory.js').then(module => {
            this.vueApp = module.OverlayFactory.mountReaderControls(props, handlers);
        });
    }

    /**
     * Initializes the auto-scroll controller.
     */
    init() {
        if (this.showPanel) {
            this.createControlPanel();
        }
        window.bmhAutoScroll = this;
    }

    destroy() {
        this.stop();
        if (this.vueApp && this.vueApp.app) {
            this.vueApp.app.unmount();
            this.vueApp.container.remove();
        }
        delete window.bmhAutoScroll;
    }
}

export default AutoScrollController;
