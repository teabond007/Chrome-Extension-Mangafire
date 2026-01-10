/**
 * Component factory for Manga Cards in the library
 */

/**
 * Create a manga card element
 * @param {Object} entry - Merged entry data
 * @param {Array} customMarkers - List of custom markers for color resolution
 * @param {Function} onMarkerClick - Callback when marker button is clicked
 * @returns {HTMLElement}
 */
export function createMangaCard(entry, customMarkers, onMarkerClick) {
    const card = document.createElement("div");
    card.className = "manga-card";
    card.dataset.title = entry.title;

    const aniData = entry.anilistData;
    const statusInfo = getStatusInfo(entry.status, entry.customMarker, customMarkers);

    // Apply styles for dynamic coloring
    card.style.border = `2px solid ${statusInfo.borderColor}`;
    if (statusInfo.borderStyle) {
        card.style.borderStyle = statusInfo.borderStyle;
    }
    
    if (entry.customMarker) {
        card.classList.add("has-custom-marker");
    }

    // Create cover section
    const cover = createCardCover(entry, aniData, statusInfo.borderColor, onMarkerClick);
    card.appendChild(cover);

    // Create body section
    const body = createCardBody(entry, aniData, statusInfo);
    card.appendChild(body);
    
    return card;
}

function createCardCover(entry, aniData, statusColor, onMarkerClick) {
    const coverUrl = aniData?.coverImage?.large ?? 
                     aniData?.coverImage?.medium ?? 
                     "../images/no-image-svgrepo-com.svg";
    
    const cover = document.createElement("div");
    cover.className = "manga-card-cover";
    cover.style.backgroundImage = `url('${coverUrl}')`;

    // Status dot indicator
    const statusDot = document.createElement("div");
    statusDot.className = "card-status-dot";
    statusDot.style.backgroundColor = statusColor;
    cover.appendChild(statusDot);

    // Hover actions
    const actions = document.createElement("div");
    actions.className = "manga-card-actions";

    // View on AniList button
    if (aniData?.siteUrl) {
        const viewBtn = document.createElement("a");
        viewBtn.className = "card-action-btn";
        viewBtn.textContent = "View";
        viewBtn.href = aniData.siteUrl;
        viewBtn.target = "_blank";
        viewBtn.onclick = (e) => e.stopPropagation();
        actions.appendChild(viewBtn);
    }

    // Add/Change marker button
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

function createCardBody(entry, aniData, statusInfo) {
    const body = document.createElement("div");
    body.className = "manga-card-body";

    // Title
    const title = document.createElement("h3");
    title.className = "manga-card-title";
    title.textContent = aniData?.title?.english || aniData?.title?.romaji || entry.title;
    title.title = title.textContent;
    body.appendChild(title);

    // Metadata section
    const meta = document.createElement("div");
    meta.className = "manga-card-meta";

    // Saved status badge
    const savedStatus = document.createElement("span");
    savedStatus.className = "manga-card-status";
    savedStatus.textContent = entry.status;
    savedStatus.style.backgroundColor = statusInfo.badgeBg;
    savedStatus.style.color = statusInfo.badgeText;
    meta.appendChild(savedStatus);

    // AniList details
    if (aniData) {
        const info = document.createElement("div");
        info.className = "manga-card-info";

        const formatName = getFormatName(aniData.format, aniData.countryOfOrigin);
        if (formatName && formatName !== "Unknown") {
            const formatItem = document.createElement("div");
            formatItem.className = "info-item format-badge";
            formatItem.textContent = formatName;
            info.appendChild(formatItem);
        }

        if (aniData.chapters) {
            const chaptersItem = document.createElement("div");
            chaptersItem.className = "info-item";
            chaptersItem.innerHTML = `<span class="info-label">CH:</span>${aniData.chapters}`;
            info.appendChild(chaptersItem);
        }
        meta.appendChild(info);
    } else {
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
 * Resolved status appearance info
 */
export function getStatusInfo(status, customMarkerName, customMarkers) {
    const statusLower = status.toLowerCase();
    let marker = customMarkers.find(m => m.name.toLowerCase() === statusLower);
    
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

    const DEFAULT_STATUS_COLORS = {
        reading: { color: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" },
        read: { color: "#9f9f9f", bg: "rgba(159, 159, 159, 0.15)" },
        completed: { color: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" },
        dropped: { color: "#F44336", bg: "rgba(244, 67, 54, 0.15)" },
        onhold: { color: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" },
        planning: { color: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" },
        default: { color: "#8B95A5", bg: "rgba(139, 149, 165, 0.15)" }
    };

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
 * Normalize format name from AniList
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
