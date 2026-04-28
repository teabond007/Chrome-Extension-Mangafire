/**
 * @fileoverview Selector Tool - Highlighter Module
 * Handles visual highlighting of DOM elements with a "rainbow border" effect
 * and generates DOM absolute path selectors for element identification.
 * @module selector-tool/highlighter
 */

/** Rainbow gradient colors for the highlight effect */
const RAINBOW_GRADIENT = 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';

/** Current highlighted element */
let currentElement = null;

/** Frozen element (user clicked to lock selection) */
let frozenElement = null;

/** Overlay element for highlighting */
let highlightOverlay = null;

/**
 * Creates the highlight overlay element if it doesn't exist.
 * @returns {HTMLDivElement}
 */
function ensureOverlay() {
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
 * @param {HTMLElement} element - The DOM element to highlight
 */
export function highlightElement(element) {
    if (frozenElement) return;

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
 * @param {HTMLElement} element - The element to freeze selection on
 */
export function freezeSelection(element) {
    frozenElement = element;
    currentElement = element;

    const overlay = ensureOverlay();
    overlay.style.borderWidth = '4px';
    overlay.style.boxShadow = '0 0 20px rgba(117, 81, 255, 0.8), inset 0 0 10px rgba(117, 81, 255, 0.2)';
}

/**
 * Unfreezes the selection to allow hovering again.
 */
export function unfreezeSelection() {
    frozenElement = null;

    const overlay = ensureOverlay();
    overlay.style.borderWidth = '3px';
    overlay.style.boxShadow = '0 0 10px rgba(117, 81, 255, 0.5)';
}

/**
 * Hides the highlight overlay.
 */
export function hideHighlight() {
    if (highlightOverlay) {
        highlightOverlay.style.opacity = '0';
    }
    currentElement = null;
}

/**
 * Gets the currently selected/highlighted element.
 * @returns {HTMLElement|null}
 */
export function getCurrentElement() {
    return frozenElement || currentElement;
}

/**
 * Gets the frozen element.
 * @returns {HTMLElement|null}
 */
export function getFrozenElement() {
    return frozenElement;
}

// ─── DOM Path Generation ────────────────────────────────────────────

/**
 * Filters out dynamic/generated class names that aren't stable selectors.
 * @param {string} cls - Class name to validate
 * @returns {boolean} True if the class is likely stable and meaningful
 */
function isStableClass(cls) {
    if (!cls || cls.length < 2) return false;
    if (cls.startsWith('_') || cls.startsWith('css-')) return false;
    if (/^[a-z]+[0-9]+$/i.test(cls)) return false;
    if (/[0-9]{3,}/.test(cls)) return false;
    return true;
}

function buildSegment(node) {
    const tag = node.tagName.toLowerCase();
    const stableClasses = Array.from(node.classList)
        .filter(isStableClass)
        .map(cls => CSS.escape(cls));

    if (stableClasses.length > 0) {
        return `${tag}.${stableClasses.join('.')}`;
    }
    return tag;
}

/**
 * Builds the full DOM absolute path from an element up to <body>.
 * Each segment uses the element's tag name and stable CSS classes.
 * @param {HTMLElement} element
 * @returns {string[]} Path segments from root to element, e.g. ["body", "div.wrapper", "main", "div.container", ...]
 */
function buildDomPath(element) {
    const segments = [];
    let node = element;

    while (node && node !== document.documentElement) {
        if (node === document.body) {
            segments.unshift('body');
            break;
        }

        segments.unshift(buildSegment(node));
        node = node.parentElement;
    }

    return segments;
}

/**
 * Converts a path segments array into a CSS selector string using child combinators.
 * @param {string[]} segments
 * @returns {string}
 */
function pathToSelector(segments) {
    return segments.join(' > ');
}

/**
 * Generalizes a DOM path at a specific segment index.
 * Strips classes from the target segment (keeping only the tag name)
 * and discards all segments after it, producing a selector that
 * matches all siblings at that structural depth.
 * @param {string[]} fullPathSegments - The full path from buildDomPath()
 * @param {number} targetIndex - Index of the segment to generalize (0-based)
 * @returns {string} Generalized CSS selector
 */
function generalizePath(fullPathSegments, targetIndex) {
    if (fullPathSegments.length === 0) return '';
    if (targetIndex >= fullPathSegments.length) {
        return pathToSelector(fullPathSegments); // Exact match
    }

    const clamped = Math.max(0, Math.min(targetIndex, fullPathSegments.length - 1));
    // Take segments up to and including the target
    const trimmed = fullPathSegments.slice(0, clamped + 1);
    // Strip classes from target segment
    const targetSegment = trimmed[trimmed.length - 1];
    trimmed[trimmed.length - 1] = targetSegment.split('.')[0];

    return pathToSelector(trimmed);
}

/**
 * Safely counts how many elements match a selector.
 * @param {string} selector
 * @returns {number}
 */
function countMatches(selector) {
    try {
        return document.querySelectorAll(selector).length;
    } catch {
        return 0;
    }
}

/**
 * Generates a DOM path-based selector for an element.
 * Returns the raw segments, the generalized selector at the given depth,
 * and the match count.
 * @param {HTMLElement} element
 * @param {number} [genIndex] - Segment index to generalize at. Defaults to last segment.
 * @returns {{ segments: string[], generalizedSelector: string, matchCount: number, genIndex: number }}
 */
export function getDomPathSelector(element, genIndex, isReaderMode = false) {
    const segments = buildDomPath(element);
    
    let idx = genIndex;
    if (idx === undefined) {
        idx = isReaderMode ? segments.length : segments.length - 1;
    }
    
    const clampedIdx = Math.max(0, Math.min(idx, segments.length));
    const generalizedSelector = generalizePath(segments, clampedIdx);
    const matchCount = countMatches(generalizedSelector);

    return { segments, generalizedSelector, matchCount, genIndex: clampedIdx };
}

// ─── Navigation ─────────────────────────────────────────────────────

/**
 * Navigates to the parent element of the current selection.
 * @returns {HTMLElement|null}
 */
export function selectParent() {
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
 * @returns {HTMLElement|null}
 */
export function selectChild() {
    const current = getCurrentElement();
    if (!current) return null;

    const child = current.firstElementChild;
    if (!child) return null;

    unfreezeSelection();
    highlightElement(child);
    freezeSelection(child);
    return child;
}

/**
 * Navigates to the next sibling element.
 * @returns {HTMLElement|null}
 */
export function selectNextSibling() {
    const current = getCurrentElement();
    if (!current) return null;

    const sibling = current.nextElementSibling;
    if (!sibling) return null;

    unfreezeSelection();
    highlightElement(sibling);
    freezeSelection(sibling);
    return sibling;
}

/**
 * Navigates to the previous sibling element.
 * @returns {HTMLElement|null}
 */
export function selectPrevSibling() {
    const current = getCurrentElement();
    if (!current) return null;

    const sibling = current.previousElementSibling;
    if (!sibling) return null;

    unfreezeSelection();
    highlightElement(sibling);
    freezeSelection(sibling);
    return sibling;
}

/**
 * Cleans up the highlighter, removing overlay from DOM.
 */
export function cleanup() {
    if (highlightOverlay) {
        highlightOverlay.remove();
        highlightOverlay = null;
    }
    currentElement = null;
    frozenElement = null;
}
