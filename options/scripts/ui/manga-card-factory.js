/**
 * @fileoverview Component factory for generating Manga Card DOM elements.
 * Handles layout, dynamic status coloring, and AniList metadata display.
 */

/**
 * Creates a complete manga card element ready to be appended to the library grid.
 * Combines cover, status, and metadata sections into a single interactive card.
 * 
 * @param {Object} [librarySettings] - Optional settings for library view (borders, display modes).
 * @returns {HTMLElement} The fully constructed manga card container.
 */
export function createMangaCard(entry, customMarkers, onMarkerClick, librarySettings = null) {
    const card = document.createElement("div");
    card.className = "manga-card";
    card.dataset.title = entry.title;

    const aniData = entry.anilistData;
    const statusInfo = getStatusInfo(entry.status, entry.customMarker, customMarkers);
    
    // Border Styling Logic
    let showBorder = true;
    let thickness = '2px';
    let useGlow = false;
    let useAnimatedBorder = false;
    let showStatusIcon = false;
    let showProgressBar = false;
    
    if (librarySettings) {
        showBorder = librarySettings.bordersEnabled;
        if (librarySettings.borderThickness) {
            thickness = `${librarySettings.borderThickness}px`;
        }
        useGlow = librarySettings.useGlowEffect === true;
        useAnimatedBorder = librarySettings.animatedBorders === true;
        showStatusIcon = librarySettings.showStatusIcon === true;
        showProgressBar = librarySettings.showProgressBar === true;
    }

    // Apply border or glow effect
    if (showBorder) {
        if (useGlow) {
            // Use glow effect instead of solid border
            card.classList.add('glow-effect');
            card.style.setProperty('--glow-color', `${statusInfo.borderColor}80`);
            card.style.border = 'none';
        } else {
            card.style.border = `${thickness} solid ${statusInfo.borderColor}`;
            if (statusInfo.borderStyle) {
                card.style.borderStyle = statusInfo.borderStyle;
            }
        }
    } else {
        card.style.border = 'none';
    }
    
    // Animated border for "Reading" status
    if (useAnimatedBorder && entry.status === "Reading") {
        card.classList.add('reading-pulse');
        card.style.setProperty('--pulse-color', statusInfo.borderColor);
    }
    
    if (entry.customMarker) {
        card.classList.add("has-custom-marker");
    }

    // Smart Inactivity Check
    if (librarySettings?.smartInactivity && entry.status === "Reading" && entry.lastRead) {
        const diff = Date.now() - entry.lastRead;
        const days = diff / (1000 * 60 * 60 * 24);
        if (days > 30) {
            card.classList.add("stale-entry");
            card.title = `Inactive for ${Math.floor(days)} days`;
        }
    }

    // Create cover section (includes image and hover actions)
    const cover = createCardCover(entry, aniData, statusInfo, onMarkerClick, { showStatusIcon, showProgressBar });
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
 * @param {Object} statusInfo - The resolved status styling object.
 * @param {Function} onMarkerClick - Callback for marker interaction.
 * @param {Object} visualOptions - Visual enhancement options (showStatusIcon, showProgressBar).
 * @returns {HTMLElement} The constructed cover element.
 */
function createCardCover(entry, aniData, statusInfo, onMarkerClick, visualOptions = {}) {
    const statusColor = statusInfo.borderColor;
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

    // Status Icon Overlay (Phase 1 visual enhancement)
    if (visualOptions.showStatusIcon) {
        const statusIcon = document.createElement("div");
        statusIcon.className = "manga-card-status-icon";
        statusIcon.textContent = getStatusEmoji(entry.status);
        statusIcon.title = entry.status;
        cover.appendChild(statusIcon);
    }

    // Progress Bar Overlay (Phase 1 visual enhancement)
    if (visualOptions.showProgressBar && aniData?.chapters && entry.readChapters) {
        const totalChapters = aniData.chapters;
        const readChapters = parseInt(entry.readChapters) || 0;
        const percentage = Math.min(100, Math.round((readChapters / totalChapters) * 100));
        
        if (percentage > 0) {
            const progressBar = document.createElement("div");
            progressBar.className = "manga-card-progress-bar";
            
            const progressFill = document.createElement("div");
            progressFill.className = "manga-card-progress-fill";
            progressFill.style.width = `${percentage}%`;
            
            progressBar.appendChild(progressFill);
            cover.appendChild(progressBar);
        }
    }

    // Hover actions overlay
    const actions = document.createElement("div");
    actions.className = "manga-card-actions";

    // "Continue" button - resumes reading at last chapter (only if history exists)
    if (entry.lastMangafireUrl) {
        const continueBtn = document.createElement("a");
        continueBtn.className = "card-action-btn card-action-continue";
        continueBtn.textContent = `▶ Ch.${entry.lastChapterRead || '?'}`;
        continueBtn.title = "Continue reading";
        continueBtn.href = entry.lastMangafireUrl;
        continueBtn.target = "_blank";
        continueBtn.onclick = (e) => e.stopPropagation();
        actions.appendChild(continueBtn);
    }

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
 * Maps reading status to a display emoji.
 * @param {string} status - The reading status string.
 * @returns {string} Emoji representing the status.
 */
function getStatusEmoji(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('reading')) return '📖';
    if (statusLower === 'read' || statusLower.includes('completed')) return '✅';
    if (statusLower.includes('dropped')) return '❌';
    if (statusLower.includes('hold')) return '⏸️';
    if (statusLower.includes('plan')) return '📋';
    return '📚';
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

        // Display Demographic Badge
        const demographic = getDemographic(aniData.tags);
        if (demographic) {
            const demoItem = document.createElement("div");
            demoItem.className = `info-item format-badge demo-${demographic.toLowerCase()}`;
            // Simple styling for now, can be enhanced in CSS
            demoItem.style.marginLeft = "4px";
            demoItem.textContent = demographic;
            info.appendChild(demoItem);
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

/**
 * Extracts demographic information from AniList tags.
 * Prioritizes: Seinen > Josei > Shounen > Shoujo (Detailed specs can follow user preference, but this addresses overlap)
 * 
 * @param {Array<Object>} tags - Array of tag objects from AniList.
 * @returns {string|null} The extracted demographic or null if not found.
 */
function getDemographic(tags) {
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

