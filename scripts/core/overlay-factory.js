/**
 * @fileoverview Quick Actions Overlay Factory
 * Creates compact hover tooltip with quick actions for manga/webtoon cards.
 * Platform-agnostic: works with any adapter that provides required configuration.
 * 
 * Part of Phase 2.2: Quick Actions Overlay
 * @module core/overlay-factory
 * @version 3.8.1
 */

/**
 * Factory for creating quick action tooltips on manga/webtoon cards.
 * Provides consistent UX across all platforms while respecting platform-specific terminology.
 */
export class OverlayFactory {
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
        const nextChapter = OverlayFactory.calculateNextChapter(entry);
        const statusColor = OverlayFactory.getStatusColor(entry.status);
        const currentRating = entry.personalData?.rating || 0;

        tooltip.innerHTML = `
            <button class="bmh-tt-btn bmh-tt-continue" data-action="continue" title="Continue ${unitName} ${nextChapter}">
                ▶
            </button>
            <button class="bmh-tt-btn bmh-tt-status" data-action="status" title="${entry.status || 'Set Status'}" style="--status-color: ${statusColor}">
                <span class="bmh-tt-status-dot" style="background: ${statusColor}"></span>
            </button>
            <button class="bmh-tt-btn bmh-tt-rating" data-action="rating" title="Rating: ${currentRating}/10">
                ${currentRating > 0 ? currentRating : '★'}
            </button>
            <button class="bmh-tt-btn bmh-tt-info" data-action="details" title="View Details">
                ℹ
            </button>
        `;

        OverlayFactory.attachEventListeners(tooltip, entry, callbacks);
        return tooltip;
    }

    /**
     * Create full expanded overlay (legacy, still available).
     */
    static createExpanded(entry, adapter, callbacks = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'bmh-quick-actions bmh-qa-expanded';
        overlay.dataset.entryId = entry.slug || entry.id || '';

        const unitName = adapter.unitName === 'episode' ? 'Ep.' : 'Ch.';
        const nextChapter = OverlayFactory.calculateNextChapter(entry);
        const currentRating = entry.personalData?.rating || 0;

        overlay.innerHTML = `
            <div class="bmh-qa-content">
                <button class="bmh-qa-btn bmh-qa-continue" data-action="continue" title="Continue to ${unitName} ${nextChapter}">
                    <span class="bmh-qa-icon">▶</span>
                    Continue ${unitName} ${nextChapter}
                </button>
                <button class="bmh-qa-btn bmh-qa-status" data-action="status" title="Change reading status">
                    <span class="bmh-qa-status-indicator" style="background: ${OverlayFactory.getStatusColor(entry.status)}"></span>
                    ${entry.status || 'Add to Library'}
                </button>
                <div class="bmh-qa-row">
                    <div class="bmh-qa-rating" data-action="rating" title="Rate (${currentRating}/10)">
                        ${OverlayFactory.renderRatingBadge(currentRating)}
                    </div>
                    <button class="bmh-qa-btn bmh-qa-details" data-action="details" title="View details">
                        <span class="bmh-qa-icon">ℹ️</span>
                    </button>
                </div>
            </div>
        `;

        OverlayFactory.attachEventListeners(overlay, entry, callbacks);
        return overlay;
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
     * Render rating as a simple badge with number.
     * @param {number} rating - Rating value (1-10)
     * @returns {string} HTML string
     */
    static renderRatingBadge(rating) {
        if (!rating || rating <= 0) {
            return '<span class="bmh-rating-badge bmh-rating-empty">-</span>';
        }
        return `<span class="bmh-rating-badge">${rating}/10</span>`;
    }

    /**
     * Get color for a reading status.
     */
    static getStatusColor(status) {
        const statusColors = {
            'reading': '#4ade80',
            'completed': '#60a5fa',
            'plan to read': '#fbbf24',
            'planning': '#fbbf24',
            'on-hold': '#f97316',
            'on hold': '#f97316',
            'dropped': '#ef4444',
            're-reading': '#a855f7',
            'rereading': '#a855f7'
        };

        const normalized = (status || '').toLowerCase().trim();
        return statusColors[normalized] || 'rgba(255,255,255,0.3)';
    }

    /**
     * Create a status picker dropdown.
     */
    static createStatusPicker(entry, onSelect, customStatuses = []) {
        const picker = document.createElement('div');
        picker.className = 'bmh-status-picker';

        const defaultStatuses = [
            { name: 'Reading', color: '#4ade80' },
            { name: 'Completed', color: '#60a5fa' },
            { name: 'Plan to Read', color: '#fbbf24' },
            { name: 'On-Hold', color: '#f97316' },
            { name: 'Dropped', color: '#ef4444' },
            { name: 'Re-reading', color: '#a855f7' }
        ];

        const allStatuses = [...defaultStatuses, ...customStatuses];

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
     * Create a 1-10 rating picker (no stars, number buttons).
     * @param {Object} entry - Library entry  
     * @param {Function} onSelect - Callback when rating is selected
     * @returns {HTMLElement}
     */
    static createRatingPicker(entry, onSelect) {
        const picker = document.createElement('div');
        picker.className = 'bmh-rating-picker';

        const currentRating = entry.personalData?.rating || 0;

        picker.innerHTML = `
            <div class="bmh-picker-header">Rate (1-10)</div>
            <div class="bmh-rating-grid">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
                    <button class="bmh-rating-num ${num === currentRating ? 'active' : ''}" 
                            data-rating="${num}">
                        ${num}
                    </button>
                `).join('')}
            </div>
            <button class="bmh-rating-clear" data-rating="0">Clear</button>
        `;

        // Hover effect for preview
        const buttons = picker.querySelectorAll('.bmh-rating-num');
        buttons.forEach((btn, idx) => {
            btn.addEventListener('mouseenter', () => {
                buttons.forEach((b, i) => {
                    b.classList.toggle('hovered', i <= idx);
                });
            });
        });

        picker.querySelector('.bmh-rating-grid').addEventListener('mouseleave', () => {
            buttons.forEach(b => b.classList.remove('hovered'));
        });

        picker.querySelectorAll('[data-rating]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const rating = parseInt(el.dataset.rating);
                onSelect?.(rating, entry);
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
                transform: translateY(-4px);
                transition: all 0.2s ease;
                z-index: 60;
                pointer-events: none;
            }

            [data-bmh-enhanced]:hover .bmh-quick-tooltip {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .bmh-tt-btn {
                width: 28px;
                height: 28px;
                border: none;
                border-radius: 6px;
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
                backdrop-filter: blur(8px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            }

            .bmh-tt-btn:hover {
                transform: scale(1.1);
                background: rgba(30, 30, 30, 0.95);
            }

            .bmh-tt-continue {
                background: linear-gradient(135deg, #4CAF50, #388e3c);
            }

            .bmh-tt-continue:hover {
                background: linear-gradient(135deg, #66BB6A, #43A047);
            }

            .bmh-tt-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }

            .bmh-tt-rating {
                font-weight: 700;
                color: #fbbf24;
            }

            .bmh-tt-info {
                font-size: 14px;
            }

            /* ===== PICKERS (Status & Rating) ===== */
            .bmh-status-picker,
            .bmh-rating-picker {
                position: fixed;
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                z-index: 10000;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(16px);
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

            /* Rating Grid (1-10) */
            .bmh-rating-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                margin-bottom: 10px;
            }

            .bmh-rating-num {
                width: 36px;
                height: 36px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                background: transparent;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .bmh-rating-num:hover,
            .bmh-rating-num.hovered {
                background: rgba(251, 191, 36, 0.3);
                border-color: #fbbf24;
                color: #fbbf24;
            }

            .bmh-rating-num.active {
                background: #fbbf24;
                border-color: #fbbf24;
                color: #000;
            }

            .bmh-rating-clear {
                width: 100%;
                padding: 8px;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .bmh-rating-clear:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
            }

            /* Rating Badge */
            .bmh-rating-badge {
                color: #fbbf24;
                font-weight: 600;
                font-size: 13px;
            }

            .bmh-rating-empty {
                opacity: 0.5;
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
