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
        this.panel = null;
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
        
        const scrollAmount = this.speed / 60;
        
        this.intervalId = setInterval(() => {
            if (!this.isRunning) {
                this.stop();
                return;
            }

            this.doScroll(scrollAmount);
            
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
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    /**
     * Updates panel UI state.
     */
    updatePanelState() {
        if (this.vueApp && this.vueApp.vm) {
            this.vueApp.vm.isRunning = this.isRunning;
            return;
        }

        if (!this.panel) return;
        const btn = this.panel.querySelector('.bmh-as-toggle');
        if (btn) {
            btn.textContent = this.isRunning ? '⏸ Stop' : '▶ Start';
            btn.className = 'bmh-as-toggle' + (this.isRunning ? ' active' : '');
        }
    }

    /**
     * Creates the control panel.
     */
    createControlPanel() {
        // Phase 2: Use Vue mounting for MangaFire
        if (this.adapter && this.adapter.id === 'mangafire') {
            const props = {
                speed: this.speed,
                isRunning: this.isRunning
            };
            const handlers = {
                onToggle: () => this.toggle(),
                onSpeedChange: (val) => this.setSpeed(val)
            };

            import('./overlay-factory.js').then(module => {
                this.vueApp = module.OverlayFactory.mountReaderControls(props, handlers);
            });
            return;
        }

        const existing = document.querySelector('.bmh-autoscroll-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'bmh-autoscroll-panel bmh-panel-idle';
        panel.innerHTML = `
            <button class="bmh-as-toggle" type="button">▶ Start</button>
            <div class="bmh-as-speed-control">
                <span class="bmh-as-label">Speed:</span>
                <input type="range" class="bmh-as-speed" min="20" max="400" value="${this.speed}">
                <input type="number" class="bmh-as-speed-input" min="20" max="400" value="${this.speed}">
            </div>
        `;

        const self = this;
        let idleTimeout = null;

        // Idle state handlers
        const setIdle = () => panel.classList.add('bmh-panel-idle');
        const setActive = () => {
            panel.classList.remove('bmh-panel-idle');
            if (idleTimeout) clearTimeout(idleTimeout);
        };

        panel.addEventListener('mouseenter', setActive);
        panel.addEventListener('mouseleave', () => {
            idleTimeout = setTimeout(setIdle, 2000);
        });
        
        panel.querySelector('.bmh-as-toggle').onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.toggle();
            return false;
        };

        const slider = panel.querySelector('.bmh-as-speed');
        const numberInput = panel.querySelector('.bmh-as-speed-input');
        
        slider.oninput = function(e) {
            const val = parseInt(e.target.value);
            self.setSpeed(val);
            numberInput.value = val;
        };

        numberInput.oninput = function(e) {
            const val = parseInt(e.target.value) || 20;
            self.setSpeed(val);
            slider.value = val;
        };

        numberInput.onblur = function() {
            const clamped = Math.max(20, Math.min(400, parseInt(numberInput.value) || 20));
            numberInput.value = clamped;
            slider.value = clamped;
            self.setSpeed(clamped);
        };

        this.injectStyles();
        document.body.appendChild(panel);
        this.panel = panel;
        return panel;
    }

    /**
     * Injects CSS styles.
     */
    injectStyles() {
        if (document.getElementById('bmh-autoscroll-styles')) return;

        const style = document.createElement('style');
        style.id = 'bmh-autoscroll-styles';
        style.textContent = `
            .bmh-autoscroll-panel {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                background: rgba(0, 0, 0, 0.95) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 10px !important;
                padding: 10px 14px !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                z-index: 2147483647 !important;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                font-size: 13px !important;
                color: white !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
                transition: opacity 0.3s ease !important;
                opacity: 1 !important;
            }
            .bmh-autoscroll-panel.bmh-panel-idle {
                opacity: 0.4 !important;
            }
            .bmh-autoscroll-panel.bmh-panel-idle:hover {
                opacity: 1 !important;
            }
            .bmh-as-toggle {
                background: #4f46e5 !important;
                color: white !important;
                border: none !important;
                padding: 8px 14px !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                min-width: 70px !important;
            }
            .bmh-as-toggle:hover { background: #4338ca !important; }
            .bmh-as-toggle.active { background: #dc2626 !important; }
            .bmh-as-toggle.active:hover { background: #b91c1c !important; }
            .bmh-as-speed-control {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .bmh-as-label {
                color: rgba(255, 255, 255, 0.7) !important;
                font-size: 11px !important;
            }
            .bmh-as-speed {
                width: 60px !important;
                height: 4px !important;
                -webkit-appearance: none !important;
                background: rgba(255, 255, 255, 0.3) !important;
                border-radius: 2px !important;
            }
            .bmh-as-speed::-webkit-slider-thumb {
                -webkit-appearance: none !important;
                width: 12px !important;
                height: 12px !important;
                background: white !important;
                border-radius: 50% !important;
            }
            .bmh-as-speed-input {
                width: 42px !important;
                padding: 4px 6px !important;
                font-size: 11px !important;
                background: rgba(255, 255, 255, 0.15) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 4px !important;
                color: white !important;
                text-align: center !important;
            }
            .bmh-as-speed-input:focus {
                outline: none !important;
                border-color: rgba(255, 255, 255, 0.5) !important;
                background: rgba(255, 255, 255, 0.2) !important;
            }
            .bmh-as-speed-input::-webkit-inner-spin-button,
            .bmh-as-speed-input::-webkit-outer-spin-button {
                -webkit-appearance: none !important;
                margin: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    init() {
        if (this.showPanel) {
            this.createControlPanel();
        }
        window.bmhAutoScroll = this;
    }

    destroy() {
        this.stop();
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        delete window.bmhAutoScroll;
    }
}

export default AutoScrollController;
