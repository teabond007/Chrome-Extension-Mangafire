/**
 * @fileoverview Selector Tool - Panel UI
 * A floating control panel for the DOM selector tool.
 * Renders in Shadow DOM to prevent style leakage from host page.
 * @module selector-tool/panel
 */

import * as highlighter from './highlighter';

/** Panel element reference */
let panelContainer: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;

/** Current field being assigned (card, title) */
let activeField: 'card' | 'title' = 'card';

/** Active group index */
let activeGroupIndex: number = 0;

/** Site config ID from URL params */
let siteId: string = '';

/** Collected selector groups */
interface SelectorGroup {
    card: string;
    title: string;
}

let selectorGroups: SelectorGroup[] = [{
    card: '',
    title: ''
}];

/**
 * Creates and mounts the selector panel UI.
 * @param configId - The custom site config ID
 */
export function createPanel(configId: string): void {
    siteId = configId;

    // Create container with Shadow DOM
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

    // Load existing selectors if editing
    loadExistingSelectors().then(() => {
        if (shadowRoot) {
            shadowRoot.innerHTML = getPanelHTML();
            attachEventListeners();
            startPicking();
        }
    });

    document.body.appendChild(panelContainer);
}

async function loadExistingSelectors() {
    try {
        const data = await chrome.storage.local.get(['customSites']);
        const site = data.customSites?.find((s: any) => s.id === siteId);
        if (site && site.selectors) {
            if (Array.isArray(site.selectors)) {
                selectorGroups = site.selectors;
            } else {
                // Migrate old format
                selectorGroups = [{
                    card: site.selectors.card || '',
                    title: site.selectors.title || ''
                }];
            }
        }
    } catch (e) {
        console.error('Failed to load existing selectors', e);
    }
}

/**
 * Returns the HTML for the panel UI.
 */
function getPanelHTML(): string {
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
                width: 320px;
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
            .group-controls {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                background: rgba(0, 0, 0, 0.2);
                padding: 6px;
                border-radius: 8px;
            }
            .group-label {
                font-size: 12px;
                color: #ccc;
                font-weight: 600;
            }
            .group-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #fff;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }
            .group-btn:hover {
                background: rgba(117, 81, 255, 0.4);
            }
            .group-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
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
                font-size: 16px;
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
                text-align: center;
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
            .field-tab.complete::after {
                content: ' ✓';
                color: #10b981;
            }
            .selector-display {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 10px 12px;
                margin-bottom: 16px;
                font-family: 'Fira Code', monospace;
                font-size: 12px;
                color: #6AD2FF;
                word-break: break-all;
                min-height: 40px;
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
                <span class="panel-title">🎯 Element Selector</span>
                <button class="close-btn" id="closeBtn">✕</button>
            </div>
            
            <div class="group-controls">
                <button class="group-btn" id="prevGroupBtn" title="Previous Variant">◀</button>
                <span class="group-label" id="groupLabel">Variant 1</span>
                <div>
                    <button class="group-btn" id="addGroupBtn" title="Add New Variant" style="display: inline-flex; margin-right: 4px;">+</button>
                    <button class="group-btn" id="delGroupBtn" title="Delete Variant" style="display: inline-flex; background: rgba(239, 68, 68, 0.2);">✕</button>
                </div>
            </div>
            
            <div class="field-tabs">
                <button class="field-tab active" data-field="card">📦 Card</button>
                <button class="field-tab" data-field="title">📝 Title</button>
            </div>
            
            <div class="selector-display" id="selectorDisplay">
                Hover over elements to select...
            </div>
            
            <div class="nav-buttons">
                <button class="nav-btn" id="parentBtn" title="Select Parent">⬆️</button>
                <button class="nav-btn" id="childBtn" title="Select Child">⬇️</button>
                <button class="nav-btn" id="prevBtn" title="Previous Sibling">⬅️</button>
                <button class="nav-btn" id="nextBtn" title="Next Sibling">➡️</button>
            </div>
            
            <div class="action-buttons">
                <button class="action-btn confirm-btn" id="confirmBtn">✓ Confirm</button>
                <button class="action-btn save-btn" id="saveBtn">💾 Save Site</button>
            </div>
            
            <div class="instructions">
                Click element to freeze • Navigate with arrows • Confirm to assign
            </div>
        </div>
    `;
}

/**
 * Attaches event listeners to panel buttons.
 */
function attachEventListeners(): void {
    if (!shadowRoot) return;

    // Field tabs
    shadowRoot.querySelectorAll('.field-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const field = (e.target as HTMLElement).dataset.field as 'card' | 'title';
            setActiveField(field);
        });
    });

    // Group Controls
    const updateGroupUI = () => {
        if (!shadowRoot) return;
        const label = shadowRoot.getElementById('groupLabel');
        if (label) label.textContent = `Variant ${activeGroupIndex + 1}`;

        (shadowRoot.getElementById('prevGroupBtn') as HTMLButtonElement).disabled = activeGroupIndex === 0;
        (shadowRoot.getElementById('delGroupBtn') as HTMLButtonElement).disabled = selectorGroups.length === 1;

        // Reset active field for the new group view
        // setActiveField(activeField); // This is called by callers usually, but we need to refresh UI

        // Update tabs validation state for this group
        updateTabsState();

        // Update display
        const display = shadowRoot.getElementById('selectorDisplay');
        if (display) {
            display.textContent = selectorGroups[activeGroupIndex][activeField] || 'Hover over elements to select...';
        }
    };

    shadowRoot.getElementById('prevGroupBtn')?.addEventListener('click', () => {
        if (activeGroupIndex > 0) {
            activeGroupIndex--;
            updateGroupUI();
        }
    });

    shadowRoot.getElementById('addGroupBtn')?.addEventListener('click', () => {
        selectorGroups.push({ card: '', title: '' });
        activeGroupIndex = selectorGroups.length - 1;
        setActiveField('card');
        updateGroupUI();
    });

    shadowRoot.getElementById('delGroupBtn')?.addEventListener('click', () => {
        if (selectorGroups.length > 1) {
            selectorGroups.splice(activeGroupIndex, 1);
            if (activeGroupIndex >= selectorGroups.length) {
                activeGroupIndex = selectorGroups.length - 1;
            }
            updateGroupUI();
        }
    });

    // Navigation buttons
    shadowRoot.getElementById('parentBtn')?.addEventListener('click', () => {
        const el = highlighter.selectParent();
        if (el) updateSelectorDisplay();
    });

    shadowRoot.getElementById('childBtn')?.addEventListener('click', () => {
        const el = highlighter.selectChild();
        if (el) updateSelectorDisplay();
    });

    shadowRoot.getElementById('prevBtn')?.addEventListener('click', () => {
        const el = highlighter.selectPrevSibling();
        if (el) updateSelectorDisplay();
    });

    shadowRoot.getElementById('nextBtn')?.addEventListener('click', () => {
        const el = highlighter.selectNextSibling();
        if (el) updateSelectorDisplay();
    });

    // Confirm button - assigns current selector to active field
    shadowRoot.getElementById('confirmBtn')?.addEventListener('click', () => {
        const el = highlighter.getCurrentElement();
        if (!el) return;

        const selector = highlighter.generateSelector(el);
        selectorGroups[activeGroupIndex][activeField] = selector;

        // Update UI
        updateTabsState();

        // Auto-advance
        if (activeField === 'card') {
            setActiveField('title');
        } else {
            // Completed this group
            const btn = shadowRoot?.getElementById('confirmBtn');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Saved!';
                setTimeout(() => { if (btn) btn.textContent = originalText; }, 1000);
            }
        }

        highlighter.unfreezeSelection();
    });

    // Save button - saves all selectors to storage
    shadowRoot.getElementById('saveBtn')?.addEventListener('click', async () => {
        // Validate all groups
        const invalidGroup = selectorGroups.findIndex(g => !g.card);
        if (invalidGroup !== -1) {
            alert(`Variant ${invalidGroup + 1} is missing a Card selector. Please fix or remove it.`);
            activeGroupIndex = invalidGroup;
            // Force update UI
            const fieldTab = shadowRoot?.querySelector(`[data-field="card"]`) as HTMLElement;
            if (fieldTab) fieldTab.click();
            return;
        }

        await saveConfiguration();
    });

    // Close button
    shadowRoot.getElementById('closeBtn')?.addEventListener('click', () => {
        cleanup();
    });
}

/**
 * Sets the active field being assigned.
 */
function setActiveField(field: 'card' | 'title'): void {
    activeField = field;

    if (!shadowRoot) return;

    shadowRoot.querySelectorAll('.field-tab').forEach(tab => {
        tab.classList.toggle('active', (tab as HTMLElement).dataset.field === field);
    });

    // Show existing selector if any
    const display = shadowRoot.getElementById('selectorDisplay');
    if (display) {
        display.textContent = selectorGroups[activeGroupIndex][field] || 'Hover over elements to select...';
    }
}

/**
 * Updates the selector display with the current element's selector.
 */
function updateSelectorDisplay(): void {
    const el = highlighter.getCurrentElement();
    if (!el || !shadowRoot) return;

    const selector = highlighter.generateSelector(el);
    const display = shadowRoot.getElementById('selectorDisplay');
    if (display) {
        display.textContent = selector;
    }
}

/**
 * Starts the element picking mode.
 */
function startPicking(): void {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);
}

/**
 * Stops element picking mode.
 */
function stopPicking(): void {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('click', handleClick, true);
}

/**
 * Handles mouseover events for element highlighting.
 */
function handleMouseOver(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Ignore panel elements
    if (panelContainer?.contains(target)) return;

    highlighter.highlightElement(target);
    updateSelectorDisplay();
}

/**
 * Handles click events to freeze selection.
 */
function handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Ignore panel clicks
    if (panelContainer?.contains(target)) return;

    e.preventDefault();
    e.stopPropagation();

    // If already frozen on this element, unfreeze
    if (highlighter.getFrozenElement() === target) {
        highlighter.unfreezeSelection();
    } else {
        highlighter.freezeSelection(target);
    }
}

/**
 * Saves the configuration to storage.
 */
async function saveConfiguration(): Promise<void> {
    try {
        // Get current custom sites
        const data: { customSites?: any[] } = await chrome.storage.local.get(['customSites']);
        const sites: any[] = data.customSites || [];

        // Find and update this site
        const idx = sites.findIndex((s: any) => s.id === siteId);
        if (idx === -1) {
            alert('Site configuration not found. Please try again.');
            return;
        }

        sites[idx].selectors = selectorGroups; // Expecting backend to handle array
        sites[idx].updatedAt = Date.now();

        await chrome.storage.local.set({ customSites: sites });

        // Notify background to re-register scripts
        chrome.runtime.sendMessage({ type: 'custom-sites-updated' });

        alert('Site configuration saved successfully!\n\nReload the page to see highlighting in action.');
        cleanup();

    } catch (err) {
        console.error('[SelectorPanel] Failed to save:', err);
        alert('Failed to save configuration. Check console for details.');
    }
}

/**
 * Cleans up and removes the panel.
 */
export function cleanup(): void {
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
    url.searchParams.delete('bmh-site-id');
    window.history.replaceState({}, '', url.toString());
}

function updateTabsState() {
    if (!shadowRoot) return;
    ['card', 'title'].forEach(field => {
        const tab = shadowRoot?.querySelector(`[data-field="${field}"]`);
        if (tab) {
            const isComplete = !!selectorGroups[activeGroupIndex][field as 'card' | 'title'];
            tab.classList.toggle('complete', isComplete);
        }
    });
}
