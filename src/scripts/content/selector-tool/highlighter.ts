/**
 * @fileoverview Selector Tool - Highlighter Module
 * Handles visual highlighting of DOM elements with a "rainbow border" effect.
 * @module selector-tool/highlighter
 */

import { finder } from '@medv/finder';

/** Rainbow gradient colors for the highlight effect */
const RAINBOW_GRADIENT = 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';

/** Current highlighted element */
let currentElement: HTMLElement | null = null;

/** Frozen element (user clicked to lock selection) */
let frozenElement: HTMLElement | null = null;

/** Overlay element for highlighting */
let highlightOverlay: HTMLDivElement | null = null;

/**
 * Creates the highlight overlay element if it doesn't exist.
 */
function ensureOverlay(): HTMLDivElement {
    if (!highlightOverlay) {
        highlightOverlay = document.createElement('div');
        highlightOverlay.id = 'bmh-selector-highlight';
        highlightOverlay.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 2147483646;
            border: 3px solid transparent;
            border-image: ${RAINBOW_GRADIENT} 1;
            box-shadow: 0 0 10px rgba(117, 81, 255, 0.5);
            transition: all 0.1s ease-out;
            opacity: 0;
        `;
        document.body.appendChild(highlightOverlay);
    }
    return highlightOverlay;
}

/**
 * Updates the highlight overlay position to match an element's bounding box.
 * @param element - The DOM element to highlight
 */
export function highlightElement(element: HTMLElement): void {
    if (frozenElement) return; // Don't update if frozen

    const overlay = ensureOverlay();
    const rect = element.getBoundingClientRect();

    overlay.style.left = `${rect.left - 3}px`;
    overlay.style.top = `${rect.top - 3}px`;
    overlay.style.width = `${rect.width + 6}px`;
    overlay.style.height = `${rect.height + 6}px`;
    overlay.style.opacity = '1';

    currentElement = element;
}

/**
 * Freezes the current highlight on an element (after click).
 * @param element - The element to freeze selection on
 */
export function freezeSelection(element: HTMLElement): void {
    frozenElement = element;
    currentElement = element;

    const overlay = ensureOverlay();
    overlay.style.borderWidth = '4px';
    overlay.style.boxShadow = '0 0 20px rgba(117, 81, 255, 0.8), inset 0 0 10px rgba(117, 81, 255, 0.2)';
}

/**
 * Unfreezes the selection to allow hovering again.
 */
export function unfreezeSelection(): void {
    frozenElement = null;

    const overlay = ensureOverlay();
    overlay.style.borderWidth = '3px';
    overlay.style.boxShadow = '0 0 10px rgba(117, 81, 255, 0.5)';
}

/**
 * Hides the highlight overlay.
 */
export function hideHighlight(): void {
    if (highlightOverlay) {
        highlightOverlay.style.opacity = '0';
    }
    currentElement = null;
}

/**
 * Gets the currently selected/highlighted element.
 * @returns The current element or null
 */
export function getCurrentElement(): HTMLElement | null {
    return frozenElement || currentElement;
}

/**
 * Gets the frozen element.
 * @returns The frozen element or null
 */
export function getFrozenElement(): HTMLElement | null {
    return frozenElement;
}

/**
 * Generates a reusable CSS selector for elements of the same type.
 * Prioritizes class-based selectors over unique identifiers.
 * @param element - The DOM element
 * @returns A CSS selector that matches similar elements
 */
export function generateSelector(element: HTMLElement): string {
    try {
        // First attempt: use finder with strict settings to avoid nth-child
        const specificSelector = finder(element, {
            root: document.body,
            idName: () => false, // Disable IDs - they're too specific
            className: (name) => {
                // Skip dynamic/generated class names
                if (!name || name.length < 2) return false;
                if (name.startsWith('_') || name.startsWith('css-')) return false;
                if (name.includes('--') || name.includes('__')) return false;
                if (/^[a-z]+[0-9]+$/i.test(name)) return false; // e.g., "item1"
                if (/[0-9]{3,}/.test(name)) return false; // Contains long numbers
                return true;
            },
            tagName: () => true,
            attr: () => false, // Disable attributes
            seedMinLength: 1,
            optimizedMinLength: 1
        });

        // Check how many elements match this selector
        const matchCount = document.querySelectorAll(specificSelector).length;

        // If it matches only 1 element, try to generalize it
        if (matchCount === 1) {
            const generalSelector = buildGeneralSelector(element);
            const generalMatchCount = document.querySelectorAll(generalSelector).length;

            // If our general selector matches more elements, use it
            if (generalMatchCount > 1) {
                return generalSelector;
            }
        }

        return specificSelector;
    } catch (err) {
        console.error('[Highlighter] Failed to generate selector:', err);
        return buildGeneralSelector(element);
    }
}

/**
 * Builds a general selector based on tag and class names.
 * Designed to match multiple similar elements.
 */
function buildGeneralSelector(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList)
        .filter(cls => {
            // Filter out dynamic/generated classes
            if (!cls || cls.length < 2) return false;
            if (cls.startsWith('_') || cls.startsWith('css-')) return false;
            if (cls.includes('--') || cls.includes('__')) return false;
            if (/^[a-z]+[0-9]+$/i.test(cls)) return false;
            if (/[0-9]{3,}/.test(cls)) return false;
            return true;
        });

    if (classes.length > 0) {
        // Use first 2-3 classes that seem meaningful
        const selectedClasses = classes.slice(0, 3);
        return `${tag}.${selectedClasses.join('.')}`;
    }

    // Fallback: try parent + tag combination
    const parent = element.parentElement;
    if (parent && parent !== document.body) {
        const parentClasses = Array.from(parent.classList)
            .filter(cls => cls && cls.length >= 2 && !cls.startsWith('_'))
            .slice(0, 2);

        if (parentClasses.length > 0) {
            return `.${parentClasses.join('.')} > ${tag}`;
        }
    }

    // Ultimate fallback
    return tag;
}

/**
 * Navigates to the parent element of the current selection.
 * @returns The new parent element or null
 */
export function selectParent(): HTMLElement | null {
    const current = getCurrentElement();
    if (!current || !current.parentElement || current.parentElement === document.body) {
        return null;
    }

    const parent = current.parentElement;
    unfreezeSelection();
    highlightElement(parent);
    freezeSelection(parent);
    return parent;
}

/**
 * Navigates to the first child element of the current selection.
 * @returns The child element or null
 */
export function selectChild(): HTMLElement | null {
    const current = getCurrentElement();
    if (!current) return null;

    const child = current.firstElementChild as HTMLElement;
    if (!child) return null;

    unfreezeSelection();
    highlightElement(child);
    freezeSelection(child);
    return child;
}

/**
 * Navigates to the next sibling element.
 * @returns The sibling element or null
 */
export function selectNextSibling(): HTMLElement | null {
    const current = getCurrentElement();
    if (!current) return null;

    const sibling = current.nextElementSibling as HTMLElement;
    if (!sibling) return null;

    unfreezeSelection();
    highlightElement(sibling);
    freezeSelection(sibling);
    return sibling;
}

/**
 * Navigates to the previous sibling element.
 * @returns The sibling element or null
 */
export function selectPrevSibling(): HTMLElement | null {
    const current = getCurrentElement();
    if (!current) return null;

    const sibling = current.previousElementSibling as HTMLElement;
    if (!sibling) return null;

    unfreezeSelection();
    highlightElement(sibling);
    freezeSelection(sibling);
    return sibling;
}

/**
 * Cleans up the highlighter, removing overlay from DOM.
 */
export function cleanup(): void {
    if (highlightOverlay) {
        highlightOverlay.remove();
        highlightOverlay = null;
    }
    currentElement = null;
    frozenElement = null;
}
