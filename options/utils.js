/**
 * Shared utilities for the options page
 */

/**
 * Standard logging function for the options page terminal
 * @param {string} txt - The message to log
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
 * Helper to get data from chrome.storage.local (promisified)
 * @param {string|string[]} keys 
 * @returns {Promise<any>}
 */
export function getStorage(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

/**
 * Helper to set data in chrome.storage.local (promisified)
 * @param {Object} data 
 * @returns {Promise<void>}
 */
export function setStorage(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
    });
}
