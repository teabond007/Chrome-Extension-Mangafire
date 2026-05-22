/**
 * @fileoverview Selector Tool - Panel UI
 * A floating control panel for the DOM selector tool.
 * Renders in Shadow DOM to prevent style leakage from host page.
 * Uses DOM absolute path selectors instead of class-based CSS selectors.
 * Supports two modes: listing mode (card/title) and reader mode (detect/title/chapter).
 * @module selector-tool/panel
 */

import * as highlighter from './highlighter';
import { DATA } from '../../../config.js';

/**
 * High-fidelity vector SVG icons sourced from Feather Icons / Lucide (MIT License).
 * Sourced under the MIT License from Cole Bemis & Lucide community.
 * Used inline within the Shadow DOM to avoid cross-origin resource blockings or shifts.
 * @type {Object<string, string>}
 */
const ICONS = {
    TARGET: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    CLOSE: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    SEARCH: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    BOOK_OPEN: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
    HASH: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`,
    PACKAGE: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    FILE: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    ARROW_UP: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
    ARROW_DOWN: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
    ARROW_LEFT: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
    ARROW_RIGHT: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    CHECK: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    SAVE: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px; display: inline-block;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`
};

/** Panel element reference */
let panelContainer = null;
let shadowRoot = null;

/** Current field being assigned (card, title OR readerDetect, readerTitle, readerChapter) */
let activeField = '';

/** Active group index (listing mode only) */
let activeGroupIndex = 0;

/** Site config ID from URL params */
let siteId = '';

/** Whether operating in reader-selector mode */
let isReaderMode = false;

/** Collected selector groups (listing mode) */
let selectorGroups = [{
    card: '',
    title: ''
}];

/** Reader selectors (reader mode) */
let readerSelectors = {
    readerDetect: '',
    readerTitle: '',
    readerChapter: ''
};

/** Current generalized selector from the DOM path generator */
let currentGeneralizedSelector = '';

/** Current generalization index in the segments array */
let currentGenIndex = -1;

/** Current raw path segments for re-rendering on depth change */
let currentSegments = [];

/**
 * Creates and mounts the selector panel UI.
 * @param {string} configId - The custom site config ID
 * @param {boolean} readerMode - Whether to use reader-selector mode
 */
export function createPanel(configId, readerMode = false) {
    siteId = configId;
    isReaderMode = readerMode;

    panelContainer = document.createElement('div');
    panelContainer.id = 'bmh-selector-panel-container';
    panelContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    shadowRoot = panelContainer.attachShadow({ mode: 'closed' });

    loadExistingSelectors().then(() => {
        if (shadowRoot) {
            shadowRoot.innerHTML = getPanelHTML();
            attachEventListeners();
            setActiveField(isReaderMode ? 'readerDetect' : 'card');
            startPicking();
        }
    });

    document.body.appendChild(panelContainer);
}

/**
 * Loads existing selectors from Chrome storage for editing.
 */
async function loadExistingSelectors() {
    try {
        const data = await chrome.storage.local.get([DATA.CUSTOM_SITES]);
        const site = data[DATA.CUSTOM_SITES]?.find(s => s.id === siteId);
        if (!site) return;

        if (isReaderMode) {
            if (site.readerSelectors) {
                readerSelectors = {
                    readerDetect: site.readerSelectors.readerDetect || '',
                    readerTitle: site.readerSelectors.readerTitle || '',
                    readerChapter: site.readerSelectors.readerChapter || ''
                };
            }
        } else {
            if (site.selectors) {
                if (Array.isArray(site.selectors)) {
                    selectorGroups = site.selectors;
                } else {
                    selectorGroups = [{
                        card: site.selectors.card || '',
                        title: site.selectors.title || ''
                    }];
                }
            }
        }
    } catch (e) {
        console.error('Failed to load existing selectors', e);
    }
}

/**
 * Returns the HTML for the panel UI.
 * @returns {string}
 */
function getPanelHTML() {
    return `
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            .panel {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(117, 81, 255, 0.3);
                border-radius: 16px;
                padding: 20px;
                width: 340px;
                color: #fff;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(117, 81, 255, 0.2);
            }
            .panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .group-tabs {
                display: flex;
                gap: 4px;
                align-items: center;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }
            .group-tab {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: rgba(255, 255, 255, 0.6);
                min-width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.15s;
                padding: 0 8px;
            }
            .group-tab:hover {
                background: rgba(117, 81, 255, 0.25);
                border-color: rgba(117, 81, 255, 0.4);
            }
            .group-tab.active {
                background: rgba(117, 81, 255, 0.35);
                border-color: rgba(117, 81, 255, 0.6);
                color: #fff;
            }
            .group-tab.complete {
                border-color: rgba(16, 185, 129, 0.4);
            }
            .group-tab .group-check-icon {
                display: inline-block;
                width: 8px;
                height: 8px;
                margin-left: 3px;
                vertical-align: middle;
            }
            .group-tab.complete .group-check-icon {
                mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
                -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
                mask-repeat: no-repeat;
                -webkit-mask-repeat: no-repeat;
                mask-size: contain;
                -webkit-mask-size: contain;
                background-color: #10b981;
            }
            .group-add-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px dashed rgba(255, 255, 255, 0.2);
                color: rgba(255, 255, 255, 0.4);
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.15s;
            }
            .group-add-btn:hover {
                background: rgba(117, 81, 255, 0.2);
                border-color: rgba(117, 81, 255, 0.4);
                color: #fff;
            }
            .panel-title {
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .close-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #fff;
                width: 28px;
                height: 28px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: background 0.2s;
            }
            .close-btn:hover {
                background: rgba(239, 68, 68, 0.3);
            }
            .field-tabs {
                display: flex;
                gap: 6px;
                margin-bottom: 16px;
            }
            .field-tab {
                flex: 1;
                padding: 8px 4px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            .field-tab:hover {
                background: rgba(117, 81, 255, 0.2);
            }
            .field-tab.active {
                background: rgba(117, 81, 255, 0.3);
                border-color: rgba(117, 81, 255, 0.5);
                color: #fff;
            }
            .field-tab.complete {
                border-color: rgba(16, 185, 129, 0.5);
            }
            .field-tab .tab-check-icon {
                display: inline-block;
                width: 10px;
                height: 10px;
                vertical-align: middle;
            }
            .field-tab.complete .tab-check-icon {
                mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
                -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
                mask-repeat: no-repeat;
                -webkit-mask-repeat: no-repeat;
                mask-size: contain;
                -webkit-mask-size: contain;
                background-color: #10b981;
            }
            .path-display {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 10px 12px;
                margin-bottom: 16px;
                min-height: 48px;
            }
            .path-display.assigned {
                border-color: rgba(16, 185, 129, 0.4);
            }
            .path-segments {
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 11px;
                color: #6AD2FF;
                word-break: break-all;
                line-height: 1.6;
            }
            .path-segment {
                color: #6AD2FF;
            }
            .path-segment.gen-target {
                color: #10b981;
                font-weight: 700;
                background: rgba(16, 185, 129, 0.15);
                padding: 1px 3px;
                border-radius: 3px;
            }
            .path-segment.dimmed {
                color: rgba(255, 255, 255, 0.25);
            }
            .path-separator {
                color: rgba(255, 255, 255, 0.3);
                margin: 0 2px;
            }
            .path-separator.dimmed {
                color: rgba(255, 255, 255, 0.15);
            }
            .path-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 6px;
            }
            .path-badge {
                font-size: 10px;
                padding: 1px 6px;
                border-radius: 4px;
                font-weight: 600;
            }
            .match-badge {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
            }
            .assigned-badge {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
            }
            .depth-controls {
                display: flex;
                gap: 4px;
            }
            .depth-btn {
                background: rgba(16, 185, 129, 0.15);
                border: 1px solid rgba(16, 185, 129, 0.3);
                color: #10b981;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                transition: all 0.15s;
            }
            .depth-btn:hover {
                background: rgba(16, 185, 129, 0.3);
            }
            .depth-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .path-selector {
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 11px;
                color: #6AD2FF;
                word-break: break-all;
                line-height: 1.4;
            }
            .path-empty {
                text-align: center;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.4);
                padding: 8px 0;
            }
            .nav-buttons {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 16px;
            }
            .nav-btn {
                padding: 10px 8px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #fff;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .nav-btn:hover {
                background: rgba(117, 81, 255, 0.3);
                transform: translateY(-1px);
            }
            .nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .action-buttons {
                display: flex;
                gap: 10px;
            }
            .action-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .confirm-btn {
                background: linear-gradient(135deg, #7551ff, #6AD2FF);
                color: #fff;
            }
            .confirm-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(117, 81, 255, 0.4);
            }
            .save-btn {
                background: linear-gradient(135deg, #10b981, #059669);
                color: #fff;
            }
            .save-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
            }
            .instructions {
                margin-top: 12px;
                padding: 10px;
                background: rgba(117, 81, 255, 0.1);
                border-radius: 8px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
                text-align: center;
            }
        </style>
        <div class="panel">
            <div class="panel-header">
                <span class="panel-title">${ICONS.TARGET} ${isReaderMode ? 'Reader Page Selector' : 'Element Selector'}</span>
                <button class="close-btn" id="closeBtn">${ICONS.CLOSE}</button>
            </div>
            
            <div id="groupTabs" class="group-tabs" ${isReaderMode ? 'style="display:none"' : ''}></div>
            
            <div class="field-tabs">
                ${isReaderMode ? `
                    <button class="field-tab active" data-field="readerDetect">${ICONS.SEARCH} Detect Page<span class="tab-check-icon"></span></button>
                    <button class="field-tab" data-field="readerTitle">${ICONS.BOOK_OPEN} Reader Title<span class="tab-check-icon"></span></button>
                    <button class="field-tab" data-field="readerChapter">${ICONS.HASH} Chapter<span class="tab-check-icon"></span></button>
                ` : `
                    <button class="field-tab active" data-field="card">${ICONS.PACKAGE} Card<span class="tab-check-icon"></span></button>
                    <button class="field-tab" data-field="title">${ICONS.FILE} Title<span class="tab-check-icon"></span></button>
                `}
            </div>
            
            <div id="pathDisplay">
                <div class="path-display">
                    <div class="path-empty">Hover over elements to select...</div>
                </div>
            </div>
            
            <div class="nav-buttons">
                <button class="nav-btn" id="parentBtn" title="Select Parent">${ICONS.ARROW_UP}</button>
                <button class="nav-btn" id="childBtn" title="Select Child">${ICONS.ARROW_DOWN}</button>
                <button class="nav-btn" id="prevBtn" title="Previous Sibling">${ICONS.ARROW_LEFT}</button>
                <button class="nav-btn" id="nextBtn" title="Next Sibling">${ICONS.ARROW_RIGHT}</button>
            </div>
            
            <div class="action-buttons">
                <button class="action-btn confirm-btn" id="confirmBtn">${ICONS.CHECK} Confirm</button>
                <button class="action-btn save-btn" id="saveBtn">${ICONS.SAVE} Save Site</button>
            </div>
            
            <div class="instructions">
                Click to freeze • ▲▼ shift match depth (green) • Confirm to assign
            </div>
        </div>
    `;
}

/**
 * Attaches event listeners to panel buttons.
 */
function attachEventListeners() {
    if (!shadowRoot) return;

    // Field tabs
    shadowRoot.querySelectorAll('.field-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            setActiveField(e.target.dataset.field);
        });
    });

    // Render variant group tabs (initial)
    renderGroupTabs();

    // Navigation buttons
    shadowRoot.getElementById('parentBtn')?.addEventListener('click', () => {
        const el = highlighter.selectParent();
        if (el) updatePathDisplay();
    });

    shadowRoot.getElementById('childBtn')?.addEventListener('click', () => {
        const el = highlighter.selectChild();
        if (el) updatePathDisplay();
    });

    shadowRoot.getElementById('prevBtn')?.addEventListener('click', () => {
        const el = highlighter.selectPrevSibling();
        if (el) updatePathDisplay();
    });

    shadowRoot.getElementById('nextBtn')?.addEventListener('click', () => {
        const el = highlighter.selectNextSibling();
        if (el) updatePathDisplay();
    });

    // Confirm — assigns current generalized selector to active field
    shadowRoot.getElementById('confirmBtn')?.addEventListener('click', () => {
        if (!currentGeneralizedSelector) return;

        if (isReaderMode) {
            readerSelectors[activeField] = currentGeneralizedSelector;
        } else {
            selectorGroups[activeGroupIndex][activeField] = currentGeneralizedSelector;
        }
        currentGeneralizedSelector = '';

        updateTabsState();

        // Auto-advance to next field
        if (isReaderMode) {
            const readerFields = ['readerDetect', 'readerTitle', 'readerChapter'];
            const currentIdx = readerFields.indexOf(activeField);
            if (currentIdx < readerFields.length - 1) {
                setActiveField(readerFields[currentIdx + 1]);
            } else {
                showSavedFeedback();
            }
        } else if (activeField === 'card') {
            setActiveField('title');
        } else {
            showSavedFeedback();
        }

        highlighter.unfreezeSelection();
    });

    // Save — persist all selectors to Chrome storage
    shadowRoot.getElementById('saveBtn')?.addEventListener('click', async () => {
        if (isReaderMode) {
            if (!readerSelectors.readerDetect) {
                alert('Please set a "Detect Page" selector so the extension knows when it\'s on a reader page.');
                setActiveField('readerDetect');
                return;
            }
        } else {
            const invalidGroup = selectorGroups.findIndex(g => !g.card);
            if (invalidGroup !== -1) {
                alert(`Variant ${invalidGroup + 1} is missing a Card selector. Please fix or remove it.`);
                activeGroupIndex = invalidGroup;
                const fieldTab = shadowRoot?.querySelector(`[data-field="card"]`);
                if (fieldTab) fieldTab.click();
                return;
            }
        }

        await saveConfiguration();
    });

    // Close
    shadowRoot.getElementById('closeBtn')?.addEventListener('click', () => {
        cleanup();
    });
}

/**
 * Shows brief "Saved!" feedback on the confirm button.
 */
function showSavedFeedback() {
    const btn = shadowRoot?.getElementById('confirmBtn');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        setTimeout(() => { if (btn) btn.textContent = originalText; }, 1000);
    }
}

/**
 * Sets the active field being assigned.
 * @param {string} field - Field key from either listing or reader mode
 */
function setActiveField(field) {
    activeField = field;
    currentGeneralizedSelector = '';
    currentGenIndex = -1;
    currentSegments = [];

    if (!shadowRoot) return;

    shadowRoot.querySelectorAll('.field-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.field === field);
    });

    showAssignedSelector();
}

/**
 * Shows the already-assigned selector for the current field, or the empty state.
 */
function showAssignedSelector() {
    if (!shadowRoot) return;
    const container = shadowRoot.getElementById('pathDisplay');
    if (!container) return;

    const existing = isReaderMode
        ? readerSelectors[activeField]
        : selectorGroups[activeGroupIndex]?.[activeField];
    if (existing) {
        container.innerHTML = `
            <div class="path-display assigned">
                <div class="path-selector">${escapeHtml(existing)}</div>
                <div class="path-meta">
                    <span class="path-badge assigned-badge">assigned</span>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="path-display">
                <div class="path-empty">Hover over elements to select...</div>
            </div>
        `;
    }
}

/**
 * Updates the path display with the DOM path of the current element.
 * Optionally accepts a genIndex to preserve the current generalization depth.
 * @param {number} [forceGenIndex] - If provided, use this generalization index
 */
function updatePathDisplay(forceGenIndex) {
    const el = highlighter.getCurrentElement();
    if (!el || !shadowRoot) return;

    const passedIndex = (forceGenIndex !== undefined) ? forceGenIndex : undefined;
    const { segments, generalizedSelector, matchCount, genIndex } = highlighter.getDomPathSelector(el, passedIndex);
    const container = shadowRoot.getElementById('pathDisplay');
    if (!container) return;

    currentGeneralizedSelector = generalizedSelector;
    currentGenIndex = genIndex;
    currentSegments = segments;

    container.innerHTML = renderPathWithHighlight(segments, genIndex, matchCount);

    // Wire up depth buttons inside the rendered display
    shadowRoot.getElementById('depthUpBtn')?.addEventListener('click', () => {
        if (currentGenIndex > 1) updatePathDisplay(currentGenIndex - 1);
    });
    shadowRoot.getElementById('depthDownBtn')?.addEventListener('click', () => {
        if (currentGenIndex < currentSegments.length - 1) updatePathDisplay(currentGenIndex + 1);
    });
}

/**
 * Renders the path segments with the generalization target highlighted in green.
 * Segments after the target are dimmed since they're excluded from the final selector.
 * @param {string[]} segments
 * @param {number} genIndex - Which segment is the generalization target
 * @param {number} matchCount
 * @returns {string} HTML string
 */
function renderPathWithHighlight(segments, genIndex, matchCount) {
    const parts = segments.map((seg, i) => {
        let cls = 'path-segment';
        if (i === genIndex) cls += ' gen-target';
        else if (i > genIndex) cls += ' dimmed';

        const sepCls = (i > genIndex) ? 'path-separator dimmed' : 'path-separator';
        const separator = (i < segments.length - 1) ? `<span class="${sepCls}"> &gt; </span>` : '';

        return `<span class="${cls}">${escapeHtml(seg)}</span>${separator}`;
    }).join('');

    return `
        <div class="path-display">
            <div class="path-segments">${parts}</div>
            <div class="path-meta">
                <span class="path-badge match-badge">${matchCount} match${matchCount !== 1 ? 'es' : ''}</span>
                <div class="depth-controls">
                    <button class="depth-btn" id="depthUpBtn" title="Generalize higher (broader match)" ${genIndex <= 1 ? 'disabled' : ''}>▲</button>
                    <button class="depth-btn" id="depthDownBtn" title="Generalize lower (narrower match)" ${genIndex >= segments.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Escapes HTML special characters for safe rendering.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Starts the element picking mode by attaching DOM event listeners.
 */
function startPicking() {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
}

/**
 * Stops element picking mode by removing DOM event listeners.
 */
function stopPicking() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('click', handleClick, true);
}

/**
 * Handles mouseover events for element highlighting.
 * @param {MouseEvent} e
 */
function handleMouseOver(e) {
    const target = e.target;
    if (panelContainer?.contains(target)) return;

    highlighter.highlightElement(target);
    // Reset generalization index when hovering a new element
    currentGenIndex = -1;
    updatePathDisplay();
}

/**
 * Handles click events to freeze/unfreeze selection.
 * @param {MouseEvent} e
 */
function handleClick(e) {
    const target = e.target;
    if (panelContainer?.contains(target)) return;

    e.preventDefault();
    e.stopPropagation();

    if (highlighter.getFrozenElement() === target) {
        highlighter.unfreezeSelection();
    } else {
        highlighter.freezeSelection(target);
    }
}

/**
 * Saves the configuration to Chrome storage.
 */
async function saveConfiguration() {
    try {
        const data = await chrome.storage.local.get([DATA.CUSTOM_SITES]);
        const sites = data[DATA.CUSTOM_SITES] || [];

        const idx = sites.findIndex(s => s.id === siteId);
        if (idx === -1) {
            alert('Site configuration not found. Please try again.');
            return;
        }

        if (isReaderMode) {
            sites[idx].readerSelectors = { ...readerSelectors };
        } else {
            sites[idx].selectors = selectorGroups;
        }
        sites[idx].updatedAt = Date.now();

        await chrome.storage.local.set({ [DATA.CUSTOM_SITES]: sites });

        chrome.runtime.sendMessage({ type: 'custom-sites-updated' });

        const modeLabel = isReaderMode ? 'Reader page' : 'Site';
        alert(`${modeLabel} configuration saved successfully!\n\nReload the page to see it in action.`);
        cleanup();

    } catch (err) {
        console.error('[SelectorPanel] Failed to save:', err);
        alert('Failed to save configuration. Check console for details.');
    }
}

/**
 * Cleans up and removes the panel from the DOM.
 */
export function cleanup() {
    stopPicking();
    highlighter.cleanup();

    if (panelContainer) {
        panelContainer.remove();
        panelContainer = null;
        shadowRoot = null;
    }

    // Remove selector mode from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('bmh-selector-mode');
    url.searchParams.delete('bmh-reader-selector-mode');
    url.searchParams.delete('bmh-site-id');
    window.history.replaceState({}, '', url.toString());

    // Clear session storage so it doesn't persist across other tabs/reloads
    sessionStorage.removeItem('bmh-selector-mode');
    sessionStorage.removeItem('bmh-reader-selector-mode');
    sessionStorage.removeItem('bmh-site-id');
}

/**
 * Renders variant group tabs as inline buttons.
 * Each variant is a numbered button; the active one is highlighted.
 * Click to switch, right-click to delete (if more than one group exists).
 */
function renderGroupTabs() {
    if (!shadowRoot) return;
    const container = shadowRoot.getElementById('groupTabs');
    if (!container) return;

    const buttons = selectorGroups.map((group, i) => {
        const isActive = i === activeGroupIndex;
        const isComplete = !!group.card && !!group.title;
        let cls = 'group-tab';
        if (isActive) cls += ' active';
        if (isComplete) cls += ' complete';
        return `<button class="${cls}" data-group-index="${i}" title="Variant ${i + 1}${isComplete ? ' (complete)' : ''}\nRight-click to delete">${i + 1}<span class="group-check-icon"></span></button>`;
    }).join('');

    container.innerHTML = `${buttons}<button class="group-add-btn" id="addGroupBtn" title="Add Variant">+</button>`;

    // Wire up group tab clicks
    container.querySelectorAll('.group-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            activeGroupIndex = parseInt(btn.dataset.groupIndex);
            setActiveField('card');
            renderGroupTabs();
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (selectorGroups.length <= 1) return;
            const idx = parseInt(btn.dataset.groupIndex);
            selectorGroups.splice(idx, 1);
            if (activeGroupIndex >= selectorGroups.length) {
                activeGroupIndex = selectorGroups.length - 1;
            }
            setActiveField('card');
            renderGroupTabs();
        });
    });

    // Wire up add button
    container.querySelector('#addGroupBtn')?.addEventListener('click', () => {
        selectorGroups.push({ card: '', title: '' });
        activeGroupIndex = selectorGroups.length - 1;
        setActiveField('card');
        renderGroupTabs();
    });
}

/**
 * Updates field tab completion indicators for the current group.
 */
function updateTabsState() {
    if (!shadowRoot) return;

    const fields = isReaderMode
        ? ['readerDetect', 'readerTitle', 'readerChapter']
        : ['card', 'title'];

    fields.forEach(field => {
        const tab = shadowRoot?.querySelector(`[data-field="${field}"]`);
        if (!tab) return;

        const hasValue = isReaderMode
            ? !!readerSelectors[field]
            : !!selectorGroups[activeGroupIndex]?.[field];

        tab.classList.toggle('complete', hasValue);
    });

    // Also refresh group tabs in listing mode
    if (!isReaderMode) renderGroupTabs();
}
