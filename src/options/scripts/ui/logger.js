/**
 * @fileoverview Shared utility functions for the MangaBook extension options page.
 * Includes logging, storage helpers, and text processing.
 */

/**
 * Standard logging function that appends messages to the options page's terminal-style log container.
 * Automatically handles auto-scrolling to the latest log line.
 * 
 * @param {string} txt - The text message to display in the log.
 * @returns {void}
 */
export function Log(txt) {
    const logContainer = document.getElementById("logContainer");
    if (!logContainer) return;
    const logLine = document.createElement("div");
    logLine.textContent = `> ${txt}`;
    logContainer.appendChild(logLine);
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Promisified wrapper for chrome.storage.local.get.
 * Simplifies data retrieval using async/await syntax.
 * 
 * @param {string|string[]|Object|null} keys - A single key, list of keys, or object with defaults to retrieve.
 * @returns {Promise<Object>} A promise that resolves with the requested storage items.
 */
export function getStorage(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

/**
 * Promisified wrapper for chrome.storage.local.set.
 * Simplifies data saving using async/await syntax.
 * 
 * @param {Object} data - An object containing key-value pairs to save.
 * @returns {Promise<void>} A promise that resolves when the save operation is complete.
 */
export function setStorage(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
    });
}

/**
 * Decodes HTML entities (e.g., &amp;, &quot;) back into their literal characters.
 * Uses a temporary textarea element for reliable browser-native decoding.
 * 
 * @param {string} text - The string containing HTML entities to decode.
 * @returns {string} The decoded plain text string.
 */
export function decodeHTMLEntities(text) {
    if (!text) return "";
    const temp = document.createElement("textarea");
    temp.innerHTML = text;
    return temp.value;
}

