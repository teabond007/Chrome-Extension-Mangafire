/**
 * @fileoverview Quick Actions Overlay Factory
 * Creates compact hover tooltip with quick actions for manga/webtoon cards.
 * Platform-agnostic: works with any adapter that provides required configuration.
 * 
 * Provides the Quick Actions Overlay
 * @module core/overlay-factory
 * @version 3.8.2
 */

import { createApp } from 'vue';
import { STATUS_COLORS } from '../../config.js';
import QuickActions from '../content/components/QuickActions.vue';
import StatusPicker from '../content/components/StatusPicker.vue';
import StatusBadge from '../content/components/StatusBadge.vue';


/**
 * Factory for creating quick action tooltips on manga/webtoon cards.
 * Provides consistent UX across all platforms while respecting platform-specific terminology.
 */
export class OverlayFactory {
    /**
     * Create and mount a Vue-based Status Picker.
     * @param {HTMLElement} host - The anchor element (usually the button clicked)
     * @param {Object} entry - Library entry data
     * @param {Array} customStatuses - User custom statuses
     * @param {Function} onSelect - Callback when status is selected
     */
    static mountStatusPicker(host, entry, customStatuses, onSelect) {
        const safeCustomStatuses = Array.isArray(customStatuses) ? customStatuses : [];
        // Remove existing pickers first
        document.querySelectorAll('.bmh-vue-picker-container').forEach(p => p.remove());

        const container = document.createElement('div');
        container.className = 'bmh-vue-picker-container bmh-vue-status-picker';
        document.body.appendChild(container);

        const shadow = container.attachShadow({ mode: 'open' });
        const mountPoint = document.createElement('div');
        shadow.appendChild(mountPoint);

        // Inject Picker styles
        const style = document.createElement('style');
        style.textContent = `
            .bmh-status-picker {
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);

                animation: bmh-picker-slide 0.2s ease-out;
                font-family: sans-serif;
            }
            @keyframes bmh-picker-slide {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .bmh-picker-header {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .bmh-picker-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .bmh-picker-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: left;
            }
            .bmh-picker-option:hover { background: rgba(255, 255, 255, 0.1); }
            .bmh-picker-option.active { background: rgba(255, 255, 255, 0.15); }
            .bmh-picker-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }
        `;
        shadow.appendChild(style);

        const rect = host.getBoundingClientRect();
        container.style.position = 'fixed';
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.bottom + 8}px`;
        container.style.zIndex = '10000';

        let outsideClickHandler;
        const cleanup = () => {
            app.unmount();
            container.remove();
            if (outsideClickHandler) {
                document.removeEventListener('click', outsideClickHandler);
            }
        };

        const app = createApp(StatusPicker, {
            entry,
            customStatuses: safeCustomStatuses,
            onSelect: (status) => {
                onSelect(status, entry);
                cleanup();
            }
        });

        outsideClickHandler = (e) => {
            if (!container.contains(e.target) && !host.contains(e.target)) {
                cleanup();
            }
        };

        setTimeout(() => document.addEventListener('click', outsideClickHandler), 0);
        
        return app.mount(mountPoint);
    }

    /**
     * Create and mount a Vue-based Status Badge.
     * @param {HTMLElement} host - The card element
     * @param {String} text - Badge text
     * @param {String} type - 'progress' or 'new'
     * @param {Object} position - Position overrides
     */
    static mountStatusBadge(host, text, type = 'progress', position = {}) {
        const container = document.createElement('div');
        container.className = 'bmh-vue-badge-container';
        host.appendChild(container);

        const shadow = container.attachShadow({ mode: 'open' });
        const mountPoint = document.createElement('div');
        shadow.appendChild(mountPoint);

        // Inject Badge styles
        const style = document.createElement('style');
        style.textContent = `
            .bmh-badge {
                position: absolute;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 700;
                color: white;
                z-index: 50;
                pointer-events: none;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                font-family: sans-serif;
            }
            .bmh-badge-progress {
                background: rgba(0, 0, 0, 0.75);

                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .bmh-badge-new {
                background: linear-gradient(135deg, #FF6B6B, #FF8E53);
                animation: bmh-pulse 2s infinite;
            }
            @keyframes bmh-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }
        `;
        shadow.appendChild(style);

        const app = createApp(StatusBadge, { text, type, position });
        return app.mount(mountPoint);
    }

    /**
     * Create and mount a status ribbon in the corner.
     * @param {HTMLElement} host - The card element
     * @param {String} text - Ribbon text
     * @param {String} color - Ribbon background color
     */
    static mountStatusRibbon(host, text, color) {
        const container = document.createElement('div');
        container.className = 'bmh-vue-ribbon-container';
        host.appendChild(container);

        const shadow = container.attachShadow({ mode: 'open' });
        const mountPoint = document.createElement('div');
        shadow.appendChild(mountPoint);

        const style = document.createElement('style');
        style.textContent = `
            .bmh-ribbon {
                position: absolute;
                top: 0;
                right: 0;
                background: ${color};
                color: white;
                font-size: 10px;
                font-weight: 700;
                padding: 4px 20px 4px 10px;
                clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%);
                z-index: 15;
                font-family: sans-serif;
                pointer-events: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                text-transform: uppercase;
            }
        `;
        shadow.appendChild(style);
        
        const ribbon = document.createElement('div');
        ribbon.className = 'bmh-ribbon';
        ribbon.textContent = text;
        mountPoint.appendChild(ribbon);
    }

    /**
     * Create and mount a Vue-based Quick Actions tooltip.
     * @param {HTMLElement} host - The element to attach the tooltip to
     * @param {Object} entry - Library entry data
     * @param {Object} adapter - Platform adapter
     * @param {Object} callbacks - Action callback functions
     */
    static mountQuickActions(host, entry, adapter, callbacks = {}) {
        // Create a container for the Shadow DOM
        const container = document.createElement('div');
        container.className = 'bmh-vue-container';
        host.appendChild(container);

        // Create Shadow Root for style isolation
        const shadow = container.attachShadow({ mode: 'open' });
        
        // Create a mount point inside the shadow DOM
        const mountPoint = document.createElement('div');
        shadow.appendChild(mountPoint);

        // Inject scoped styles into the shadow DOM
        const style = document.createElement('style');
        style.textContent = `
            .bmh-quick-tooltip {
                display: flex;
                gap: 6px;
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 100;
                opacity: 0;
                transform: translateY(-8px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
            }
            :host(:hover) .bmh-quick-tooltip,
            :host-context([data-bmh-enhanced]:hover) .bmh-quick-tooltip {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            .bmh-tt-btn {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 8px;
                background: rgba(15, 15, 20, 0.95);
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;

                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 0;
            }
            .bmh-tt-btn:hover {
                transform: translateY(-2px) scale(1.05);
                background: rgba(30, 30, 40, 0.95);
                border-color: rgba(255,255,255,0.2);
                box-shadow: 0 6px 16px rgba(0,0,0,0.6);
            }
            .bmh-tt-continue {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .bmh-tt-continue.bmh-btn-disabled {
                background: rgba(60, 60, 70, 0.8);
                opacity: 0.5;
                filter: grayscale(1);
                box-shadow: none;
                cursor: not-allowed;
            }
            .bmh-tt-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                box-shadow: 0 0 8px var(--status-color);
            }
            .bmh-tt-info {
                color: #60a5fa;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent !important;
                box-shadow: none !important;
                border-color: transparent !important;
            }
            .bmh-tt-info svg {
                width: 20px;
                height: 20px;
                display: block;
            }
        `;
        shadow.appendChild(style);

        // Create Vue App
        const app = createApp(QuickActions, {
            entry,
            adapter,
            callbacks
        });

        app.mount(mountPoint);
        
        return app;
    }

    /**
     * Create a compact tooltip with quick action icons.
     * Shows on hover, minimal and unobtrusive.
     * @param {Object} entry - Library entry data
     * @param {Object} adapter - Platform adapter with configuration
     * @param {Object} callbacks - Action callback functions
     * @returns {HTMLElement} The tooltip element
     */
    static create(entry, adapter, callbacks = {}) {
        const tooltip = document.createElement('div');
        tooltip.className = 'bmh-quick-tooltip';
        tooltip.dataset.entryId = entry.slug || entry.id || '';

        const unitName = adapter.unitName === 'episode' ? 'Ep.' : 'Ch.';
        const lastRead = parseFloat(entry.lastReadChapter) || 0;
        const nextChapter = OverlayFactory.calculateNextChapter(entry);
        const statusColor = OverlayFactory.getStatusColor(entry.status);
        const hasHistory = lastRead > 0;

        tooltip.innerHTML = `
            <button class="bmh-tt-btn bmh-tt-continue ${!hasHistory ? 'bmh-btn-disabled' : ''}" 
                    data-action="continue" 
                    title="${hasHistory ? `Continue ${unitName} ${nextChapter}` : `Start Reading ${unitName} 1`}">
                ▶
            </button>
            <button class="bmh-tt-btn bmh-tt-status" data-action="status" title="${entry.status || 'Set Status'}" style="--status-color: ${statusColor}">
                <span class="bmh-tt-status-dot" style="background: ${statusColor}"></span>
            </button>
            <button class="bmh-tt-btn bmh-tt-info" data-action="details" title="View Details">
                ℹ
            </button>
        `;

        OverlayFactory.attachEventListeners(tooltip, entry, callbacks);
        return tooltip;
    }

    /**
     * Attach event listeners to action buttons.
     */
    static attachEventListeners(container, entry, callbacks) {
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const action = btn.dataset.action;
                if (callbacks[action]) {
                    callbacks[action](entry, btn, e);
                }
            });
        });
    }

    /**
     * Calculate the next chapter number.
     */
    static calculateNextChapter(entry) {
        const lastRead = parseFloat(entry.lastReadChapter) || 0;
        return Math.floor(lastRead) + 1;
    }

    /**
     * Get color for a reading status.
     */
    static getStatusColor(status) {
        const statusLower = (status || '').toLowerCase();
        
        // Try to match from centralized config
        for (const [key, color] of Object.entries(STATUS_COLORS)) {
            if (statusLower === key.toLowerCase() || statusLower.includes(key.toLowerCase())) {
                return color;
            }
        }

        return 'transparent';
    }

    /**
     * Create a status picker dropdown.
     */
    static createStatusPicker(entry, onSelect, customStatuses = []) {
        const picker = document.createElement('div');
        picker.className = 'bmh-status-picker';

        const safeCustomStatuses = Array.isArray(customStatuses) ? customStatuses : [];

        const defaultStatuses = [
            { name: 'Reading', color: '#4ade80' },
            { name: 'Completed', color: '#60a5fa' },
            { name: 'Plan to Read', color: '#fbbf24' },
            { name: 'On-Hold', color: '#f97316' },
            { name: 'Dropped', color: '#ef4444' },
            { name: 'Re-reading', color: '#a855f7' }
        ];

        const allStatuses = [...defaultStatuses, ...safeCustomStatuses];

        picker.innerHTML = `
            <div class="bmh-picker-header">Change Status</div>
            <div class="bmh-picker-options">
                ${allStatuses.map(s => `
                    <button class="bmh-picker-option ${entry.status === s.name ? 'active' : ''}" 
                            data-status="${s.name}">
                        <span class="bmh-picker-dot" style="background: ${s.color}"></span>
                        ${s.name}
                    </button>
                `).join('')}
            </div>
        `;

        picker.querySelectorAll('[data-status]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelect?.(btn.dataset.status, entry);
                picker.remove();
            });
        });

        OverlayFactory.autoCloseOnOutsideClick(picker);
        return picker;
    }

    /**
     * Helper to auto-close picker on outside click.
     */
    static autoCloseOnOutsideClick(picker) {
        setTimeout(() => {
            const handler = (e) => {
                if (!picker.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', handler);
                }
            };
            document.addEventListener('click', handler);
        }, 0);
    }

    /**
     * Inject CSS styles for tooltips, pickers, and modal.
     */
    static injectStyles() {
        if (document.getElementById('bmh-overlay-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'bmh-overlay-styles';
        styles.textContent = `
            /* ===== COMPACT TOOLTIP ===== */
            .bmh-quick-tooltip {
                position: absolute;
                top: 8px;
                right: 8px;
                display: flex;
                gap: 4px;
                opacity: 0;
                transform: translateY(-8px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 60;
                pointer-events: none;
            }

            [data-bmh-enhanced]:hover .bmh-quick-tooltip {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .bmh-tt-btn {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 8px;
                background: rgba(15, 15, 20, 0.9);
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;

                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }

            .bmh-tt-btn:hover {
                transform: translateY(-2px) scale(1.05);
                background: rgba(30, 30, 40, 0.95);
                border-color: rgba(255,255,255,0.2);
                box-shadow: 0 6px 16px rgba(0,0,0,0.6);
            }

            .bmh-tt-continue {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .bmh-tt-continue.bmh-btn-disabled {
                background: rgba(60, 60, 70, 0.8);
                opacity: 0.5;
                filter: grayscale(1);
                box-shadow: none;
                cursor: not-allowed;
            }

            .bmh-tt-continue:not(.bmh-btn-disabled):hover {
                background: linear-gradient(135deg, #10b981, #059669);
            }

            .bmh-tt-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                box-shadow: 0 0 8px var(--status-color);
            }

            .bmh-tt-info {
                color: #60a5fa;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }
            .bmh-tt-info svg {
                width: 20px;
                height: 20px;
                display: block;
            }

            /* ===== PICKERS (Status) ===== */
            .bmh-status-picker {
                position: fixed;
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                z-index: 10000;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);

                animation: bmh-picker-slide 0.2s ease-out;
            }

            @keyframes bmh-picker-slide {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            .bmh-picker-header {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .bmh-picker-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .bmh-picker-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: left;
            }

            .bmh-picker-option:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .bmh-picker-option.active {
                background: rgba(255, 255, 255, 0.15);
            }

            .bmh-picker-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            /* Animation keyframes */
            @keyframes bmh-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Alias for backward compatibility.
     */
    static injectPickerStyles() {
        OverlayFactory.injectStyles();
    }
}

export default OverlayFactory;
