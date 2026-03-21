/**
 * @fileoverview Utility functions for Manga Card formatting and metadata processing.
 * Extracted from the legacy manga-card-factory DOM manipulation script.
 */
import { STATUS_COLORS } from '../../../config.js';

/**
 * Resolves the visual styling (colors, borders) for a manga entry.
 * Prioritizes custom statuses over default status colors.
 * 
 * @param {string} status - The current reading status string.
 * @param {string|null} customStatusName - The name of any manually assigned custom status.
 * @param {Array<Object>} customStatuses - The list of all defined custom statuses.
 * @returns {Object} An object containing borderColor, borderStyle, badgeBg, and badgeText keys.
 */
export function getStatusInfo(status, customStatusName, customStatuses) {
    const statusLower = status.toLowerCase();
    
    // Check if the status matches a custom status name directly
    let matched = customStatuses.find(m => m.name.toLowerCase() === statusLower);
    
    // Check if an explicit custom status is assigned
    if (!matched && customStatusName) {
        matched = customStatuses.find(m => m.name === customStatusName);
    }

    if (matched) {
        return {
            borderColor: matched.color,
            borderStyle: matched.style || "solid",
            badgeBg: `${matched.color}26`,
            badgeText: matched.color
        };
    }

    // Keyword matching for status categorization
    let type = "default";
    if (statusLower.includes("reading")) type = "reading";
    else if (statusLower === "read") type = "read";
    else if (statusLower.includes("completed")) type = "completed";
    else if (statusLower.includes("dropped")) type = "dropped";
    else if (statusLower.includes("hold")) type = "onhold";
    else if (statusLower.includes("plan")) type = "planning";

    const config = {
        color: STATUS_COLORS[type] || STATUS_COLORS.default,
        bg: `${STATUS_COLORS[type] || STATUS_COLORS.default}26`
    };

    return {
        borderColor: config.color,
        borderStyle: "solid",
        badgeBg: config.bg,
        badgeText: config.color
    };
}

/**
 * Normalizes AniList format data into human-readable strings.
 * Specially identifies Manhwa (Korean) and Manhua (Chinese) as distinct formats.
 * 
 * @param {string} format - Raw AniList format code.
 * @param {string} country - Two-letter country code of origin.
 * @returns {string} Normalized format name (e.g., 'Manhwa', 'Light Novel').
 */
export function getFormatName(format, country) {
    if (country === 'KR' && format === 'MANGA') return 'Manhwa';
    if (country === 'CN' && format === 'MANGA') return 'Manhua';
    
    const formats = {
        'MANGA': 'Manga',
        'ONE_SHOT': 'One Shot',
        'NOVEL': 'Light Novel'
    };
    return formats[format] || 'Manga';
}

/**
 * Extracts demographic information from AniList tags.
 * Prioritizes: Seinen > Josei > Shounen > Shoujo (Detailed specs can follow user preference, but this addresses overlap)
 * 
 * @param {Array<Object>} tags - Array of tag objects from AniList.
 * @returns {string|null} The extracted demographic or null if not found.
 */
export function getDemographic(tags) {
    if (!tags || !Array.isArray(tags)) return null;
    
    // Normalize tag names to lower case for comparison
    const tagNames = tags.map(t => t.name.toLowerCase());
    
    // Check for explicit demographic tags
    if (tagNames.includes('seinen')) return 'Seinen';
    if (tagNames.includes('josei')) return 'Josei';
    if (tagNames.includes('shounen')) return 'Shonen';
    if (tagNames.includes('shoujo')) return 'Shoujo';
    
    return null;
}

