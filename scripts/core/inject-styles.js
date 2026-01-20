/**
 * @fileoverview Shared Styles Injector
 * Injects global CSS for card enhancements across all platforms.
 * 
 * Part of Phase 2: Universal Card Enhancement
 * @module core/inject-styles
 * @version 3.8.0
 */

/**
 * Injects shared CSS for enhanced cards.
 * Should be called once per page load by content scripts.
 */
export function injectSharedStyles() {
    if (document.getElementById('bmh-shared-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'bmh-shared-styles';
    styles.textContent = `
        /* Badge Base Styles */
        .bmh-badge {
            position: absolute;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            z-index: 20;
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }

        .bmh-badge-progress {
            bottom: 4px;
            left: 4px;
        }

        .bmh-badge-new {
            background: #ef4444;
            top: 4px;
            right: 4px;
            animation: bmh-pulse 2s infinite;
        }

        @keyframes bmh-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }

        /* Quick Actions Overlay */
        .bmh-quick-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 60%, transparent 100%);
            padding: 40px 8px 8px;
            opacity: 0;
            transition: opacity 0.25s ease;
            z-index: 50;
            pointer-events: none;
            border-radius: 0 0 8px 8px;
        }

        [data-bmh-enhanced]:hover .bmh-quick-actions {
            opacity: 1;
            pointer-events: auto;
        }

        .bmh-qa-content {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .bmh-qa-btn {
            width: 100%;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center;
        }

        .bmh-qa-continue {
            background: #4ade80;
            color: #1e293b;
        }

        .bmh-qa-continue:hover {
            background: #22c55e;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(74, 222, 128, 0.3);
        }

        .bmh-qa-status {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .bmh-qa-status:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.4);
        }

        .bmh-qa-rating {
            display: flex;
            justify-content: center;
            gap: 4px;
            padding: 6px;
            cursor: pointer;
        }

        .bmh-qa-rating:hover {
            transform: scale(1.05);
        }

        /* Ensure parent card is positioned for absolute children */
        [data-bmh-enhanced] {
            position: relative !important;
        }

        /* Prevent badge overlap */
        [data-bmh-enhanced] .bmh-badge:not(:only-of-type) {
            backdrop-filter: blur(4px);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .bmh-badge {
                font-size: 10px;
                padding: 3px 6px;
            }

            .bmh-qa-btn {
                font-size: 11px;
                padding: 6px 10px;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .bmh-badge {
                background: rgba(0, 0, 0, 0.92);
                border-color: rgba(255, 255, 255, 0.15);
            }

            .bmh-quick-actions {
                background: linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.9) 60%, transparent 100%);
            }
        }

        /* Platform-specific adjustments */
        
        /* MangaPlus: Fit within their card design */
        a[href*="mangaplus"] [data-bmh-enhanced] .bmh-quick-actions {
            border-radius: 0 0 4px 4px;
        }

        /* Webtoons: Adjust for episode cards */
        li[class*="card"] [data-bmh-enhanced] .bmh-badge-progress {
            bottom: 8px;
            left: 8px;
        }

        /* Asura Scans: Tailwind grid compatibility */
        div.grid a[data-bmh-enhanced] .bmh-quick-actions {
            border-radius: 0 0 8px 8px;
        }

        /* Manganato: Traditional layout */
        .content-genres-item [data-bmh-enhanced] .bmh-badge {
            font-size: 10px;
        }
    `;

    document.head.appendChild(styles);
}

/**
 * Remove injected styles (useful for cleanup/testing).
 */
export function removeSharedStyles() {
    const styles = document.getElementById('bmh-shared-styles');
    if (styles) styles.remove();
}

export default { injectSharedStyles, removeSharedStyles };
