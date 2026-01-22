/**
 * anime-utils.js
 * Utility functions for safe anime.js animations.
 */

/**
 * Checks if anime.js is available.
 * @returns {boolean} True if anime is defined.
 */
function isAnimeAvailable() {
    return typeof anime !== 'undefined';
}

/**
 * Creates a line drawing animation for SVG paths.
 * @param {string|HTMLElement} selector - Target element(s).
 * @param {Object} options - Animation options (duration, easing, etc.).
 * @returns {Object} The anime instance.
 */
export function createDrawable(selector, options = {}) {
    if (!isAnimeAvailable()) return null;

    const defaults = {
        targets: selector,
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 1500,
        direction: 'alternate',
        loop: false
    };

    return anime({ ...defaults, ...options });
}

/**
 * Morphs an SVG path to a new shape.
 * @param {string|HTMLElement} selector - Target path element.
 * @param {string} newPathData - The 'd' attribute value to morph to.
 * @param {Object} options - Animation options.
 * @returns {Object} The anime instance.
 */
export function morphTo(selector, newPathData, options = {}) {
    if (!isAnimeAvailable()) return null;

    const defaults = {
        targets: selector,
        d: [{ value: newPathData }],
        easing: 'easeOutQuad',
        duration: 700
    };

    return anime({ ...defaults, ...options });
}

// ============ SPECIFIC ANIMATION CONTROLLERS ============

export class ViewToggleAnimator {
    constructor(containerInfo) {
        this.containerInfo = containerInfo; // { containerId, listBtnId, gridBtnId }
        this.svg = null;
        this.paths = [];
        this.isGrid_ = true; // Default state
    }

    /**
     * Initializes the custom SVG for view toggling.
     * Replaces the static icons with a single morphable SVG.
     */
    init() {
        const container = document.getElementById(this.containerInfo.containerId);
        if (!container) return;

        // Create our morphable SVG
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", "24");
        this.svg.setAttribute("height", "24");
        this.svg.setAttribute("viewBox", "0 0 16 16");
        this.svg.style.cursor = "pointer";
        this.svg.style.color = "var(--text-secondary)";
        
        // Define paths for 4 items (Grid state initially)
        // We use 4 rectangles that can merge into 2 tall ones
        const pathData = [
            "M 1,1 h 6 v 6 h -6 Z", // Top-Left
            "M 9,1 h 6 v 6 h -6 Z", // Top-Right
            "M 1,9 h 6 v 6 h -6 Z", // Bottom-Left
            "M 9,9 h 6 v 6 h -6 Z"  // Bottom-Right
        ];

        pathData.forEach((d, i) => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            path.setAttribute("fill", "currentColor");
            path.setAttribute("rx", "1"); // Note: rx doesn't apply to path, strictly speaking, needed pure path smoothing or just sharp rects
            this.svg.appendChild(path);
            this.paths.push(path);
        });
    }
}

/**
 * Creates and plays a success checkmark animation.
 * @param {HTMLElement} targetContainer - Where to show the checkmark.
 * @returns {Promise} A promise that resolves when the main drawing animation completes.
 */
export function playSuccessAnimation(targetContainer) {
    if (!isAnimeAvailable()) return Promise.resolve();
    
    // Remove existing
    const existing = targetContainer.querySelector('.anime-success-checkmark');
    if (existing) existing.remove();
    
    // Ensure relative positioning
    targetContainer.style.position = "relative";
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add('anime-success-checkmark');
    svg.setAttribute("width", "40");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 52 52");
    svg.style.position = "absolute";
    svg.style.top = "50%";
    svg.style.left = "50%";
    svg.style.transform = "translate(-50%, -50%)";
    svg.style.zIndex = "100";
    svg.style.pointerEvents = "none";
    
    // Checkmark path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M14.1 27.2l7.1 7.2 16.7-16.8");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#4CAF50");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    
    svg.appendChild(path);
    targetContainer.appendChild(svg);
    
    // Animate and return promise
    const anim = createDrawable(path, {
        duration: 800,
        easing: 'easeInOutQuad',
        complete: () => {
             // Fade out after completion (fire and forget)
             anime({
                 targets: svg,
                 opacity: 0,
                 delay: 1000,
                 duration: 500,
                 easing: 'linear',
                 complete: () => svg.remove()
             });
        }
    });
    
    return anim.finished;
}

/**
 * Animates the entrance of grid items with a staggered delay.
 * @param {string|NodeList|Array} targets - Selector or list of elements to animate.
 */
export function animateGridEntrance(targets) {
    if (!isAnimeAvailable()) return;
    
    anime({
        targets: targets,
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.95, 1],
        delay: anime.stagger(50, {start: 100}), // 50ms delay between each item
        duration: 600,
        easing: 'easeOutCubic'
    });
}

/**
 * Animates a modal opening with an elastic effect.
 * @param {HTMLElement} modalContent - The modal content element.
 */
export function animateModalEntry(modalContent) {
    if (!isAnimeAvailable()) return;
    
    // Reset initial state
    anime.set(modalContent, {
        scale: 0.8,
        opacity: 0,
        rotateX: 10
    });
    
    anime({
        targets: modalContent,
        scale: 1,
        opacity: 1,
        rotateX: 0,
        duration: 800,
        easing: 'easeOutElastic(1, .6)'
    });
}

/**
 * Applies micro-interactions to buttons.
 * Call this once after DOM load.
 */
export function initButtonMicroInteractions() {
    if (!isAnimeAvailable()) return;
    
    const buttons = document.querySelectorAll('button, .btn, .card-action-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            anime({
                targets: btn,
                scale: 1.05,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            anime({
                targets: btn,
                scale: 1,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
}
