/**
 * @fileoverview Component factory for generating Manga Card DOM elements.
 * Handles layout, dynamic status coloring, and AniList metadata display.
 */

/**
 * Creates a complete manga card element ready to be appended to the library grid.
 * Combines cover, status, and metadata sections into a single interactive card.
 * 
 * @param {Object} entry - The merged manga entry data from storage.
 * @param {Array<Object>} customMarkers - User-defined markers for dynamic styling.
 * @param {Function} onMarkerClick - Callback executed when the marker management button is clicked.
 * @returns {HTMLElement} The fully constructed manga card container.
 */
export function createMangaCard(entry, customMarkers, onMarkerClick) {
    const card = document.createElement("div");
    card.className = "manga-card";
    card.dataset.title = entry.title;

    const aniData = entry.anilistData;
    const statusInfo = getStatusInfo(entry.status, entry.customMarker, customMarkers);

    // Apply styles for dynamic coloring based on status or active marker
    card.style.border = `2px solid ${statusInfo.borderColor}`;
    if (statusInfo.borderStyle) {
        card.style.borderStyle = statusInfo.borderStyle;
    }
    
    if (entry.customMarker) {
        card.classList.add("has-custom-marker");
    }

    // Create cover section (includes image and hover actions)
    const cover = createCardCover(entry, aniData, statusInfo.borderColor, onMarkerClick);
    card.appendChild(cover);

    // Create body section (includes title and badges)
    const body = createCardBody(entry, aniData, statusInfo);
    card.appendChild(body);
    
    return card;
}

/**
 * Constructs the cover image section of the manga card.
 * Handles fallback images and the hover action overlay.
 * 
 * @param {Object} entry - The manga entry data.
 * @param {Object|null} aniData - Optional AniList metadata object.
 * @param {string} statusColor - The resolved color for status indicators.
 * @param {Function} onMarkerClick - Callback for marker interaction.
 * @returns {HTMLElement} The constructed cover element.
 */
function createCardCover(entry, aniData, statusColor, onMarkerClick) {
    const coverUrl = aniData?.coverImage?.large ?? 
                     aniData?.coverImage?.medium ?? 
                     "../images/no-image-svgrepo-com.svg";
    
    const cover = document.createElement("div");
    cover.className = "manga-card-cover";
    cover.style.backgroundImage = `url('${coverUrl}')`;

    // Status dot indicator (top-right small dot)
    const statusDot = document.createElement("div");
    statusDot.className = "card-status-dot";
    statusDot.style.backgroundColor = statusColor;
    cover.appendChild(statusDot);

    // Hover actions overlay
    const actions = document.createElement("div");
    actions.className = "manga-card-actions";

    // "View" button - redirects to the AniList page
    if (aniData?.siteUrl) {
        const viewBtn = document.createElement("a");
        viewBtn.className = "card-action-btn";
        viewBtn.textContent = "View";
        viewBtn.href = aniData.siteUrl;
        viewBtn.target = "_blank";
        viewBtn.onclick = (e) => e.stopPropagation();
        actions.appendChild(viewBtn);
    }

    // "Marker" button - opens marker assignment dialog
    const markerBtn = document.createElement("button");
    markerBtn.className = "card-action-btn";
    markerBtn.textContent = entry.customMarker ? `✓ ${entry.customMarker}` : "+ Marker";
    markerBtn.onclick = (e) => {
        e.stopPropagation();
        onMarkerClick(entry);
    };
    actions.appendChild(markerBtn);

    cover.appendChild(actions);
    return cover;
}

/**
 * Constructs the text body of the manga card.
 * Displays title, format (Manhwa/Manga), and reading progress progress badges.
 * 
 * @param {Object} entry - The manga entry data.
 * @param {Object|null} aniData - Optional AniList metadata object.
 * @param {Object} statusInfo - The resolved status styling object.
 * @returns {HTMLElement} The constructed body element.
 */
function createCardBody(entry, aniData, statusInfo) {
    const body = document.createElement("div");
    body.className = "manga-card-body";

    // Primary Title display
    const title = document.createElement("h3");
    title.className = "manga-card-title";
    title.textContent = aniData?.title?.english || aniData?.title?.romaji || entry.title;
    title.title = title.textContent;
    body.appendChild(title);

    // Metadata section (badges and info)
    const meta = document.createElement("div");
    meta.className = "manga-card-meta";

    // Saved status badge (e.g., "Reading", "Completed")
    const savedStatus = document.createElement("span");
    savedStatus.className = "manga-card-status";
    savedStatus.textContent = entry.status;
    savedStatus.style.backgroundColor = statusInfo.badgeBg;
    savedStatus.style.color = statusInfo.badgeText;
    meta.appendChild(savedStatus);

    // Detailed AniList info (Format, Chapter Count)
    if (aniData) {
        const info = document.createElement("div");
        info.className = "manga-card-info";

        // Display normalized format name (Manga, Manhwa, etc.)
        const formatName = getFormatName(aniData.format, aniData.countryOfOrigin);
        if (formatName && formatName !== "Unknown") {
            const formatItem = document.createElement("div");
            formatItem.className = "info-item format-badge";
            formatItem.textContent = formatName;
            info.appendChild(formatItem);
        }

        // Display progress (Read Chapters / Total Chapters)
        const readChapters = entry.readChapters || 0;
        const totalChapters = aniData.chapters || "?";
        
        const chaptersItem = document.createElement("div");
        chaptersItem.className = "info-item";
        chaptersItem.innerHTML = `<span class="info-label">Read:</span>${readChapters} / <span class="info-label">Total:</span>${totalChapters}`;
        info.appendChild(chaptersItem);
        
        meta.appendChild(info);
    } else {
        // Fallback message while AniList data is being fetched
        const loading = document.createElement("div");
        loading.className = "info-item";
        loading.textContent = "Loading info...";
        loading.style.opacity = "0.6";
        meta.appendChild(loading);
    }

    body.appendChild(meta);
    return body;
}

/**
 * Resolves the visual styling (colors, borders) for a manga entry.
 * Prioritizes custom markers over default status colors.
 * 
 * @param {string} status - The current reading status string.
 * @param {string|null} customMarkerName - The name of any manually assigned custom marker.
 * @param {Array<Object>} customMarkers - The list of all defined custom markers.
 * @returns {Object} An object containing borderColor, borderStyle, badgeBg, and badgeText keys.
 */
export function getStatusInfo(status, customMarkerName, customMarkers) {
    const statusLower = status.toLowerCase();
    
    // Check if the status matches a marker name directly (legacy/auto mapping)
    let marker = customMarkers.find(m => m.name.toLowerCase() === statusLower);
    
    // Check if an explicit marker is assigned
    if (!marker && customMarkerName) {
        marker = customMarkers.find(m => m.name === customMarkerName);
    }

    if (marker) {
        return {
            borderColor: marker.color,
            borderStyle: marker.style || "solid",
            badgeBg: `${marker.color}26`,
            badgeText: marker.color
        };
    }

    /** @type {Object} Map of default reading status colors and styles */
    const DEFAULT_STATUS_COLORS = {
        reading: { color: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" },
        read: { color: "#9f9f9f", bg: "rgba(159, 159, 159, 0.15)" },
        completed: { color: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" },
        dropped: { color: "#F44336", bg: "rgba(244, 67, 54, 0.15)" },
        onhold: { color: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" },
        planning: { color: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" },
        default: { color: "#8B95A5", bg: "rgba(139, 149, 165, 0.15)" }
    };

    // Keyword matching for status categorization
    let type = "default";
    if (statusLower.includes("reading")) type = "reading";
    else if (statusLower === "read") type = "read";
    else if (statusLower.includes("completed")) type = "completed";
    else if (statusLower.includes("dropped")) type = "dropped";
    else if (statusLower.includes("hold")) type = "onhold";
    else if (statusLower.includes("plan")) type = "planning";
    
    const config = DEFAULT_STATUS_COLORS[type];
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

