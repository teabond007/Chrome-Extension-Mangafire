import { Log, decodeHTMLEntities } from '../core/utils.js';
import { fetchMDList } from '../core/mangadex-api.js';

/**
 * @fileoverview Manages Data Portability (Import and Export) for the extension.
 * Supports selective exporting, import preview, and multiple import formats.
 */

/**
 * Export data category definitions.
 * Each category has a list of storage keys and a description.
 */
const EXPORT_CATEGORIES = {
    library: {
        keys: ['savedEntriesMerged', 'userBookmarks'],
        label: 'Library Entries'
    },
    history: {
        keys: ['savedReadChapters'],
        label: 'Reading History'
    },
    settings: {
        keys: [
            'CustomBorderSize',
            'MarkHomePagefeatureEnabled',
            'SyncandMarkReadfeatureEnabled',
            'CustomBookmarksfeatureEnabled',
            'AutoSyncfeatureEnabled',
            'CustomBorderSizefeatureEnabled',
            'FamilyFriendlyfeatureEnabled',
            'SmartAutoCompletefeatureEnabled',
            'MangaDexHighlightEnabled',
            'MangaDexShowProgress',
            'WebtoonsHighlightfeatureEnabled',
            'WebtoonsShowProgress',
            'WebtoonsBorderSizefeatureEnabled',
            'WebtoonsBorderSize',
            'MangaFireHighlightEnabled',
            'MangaFireShowProgress',
            'MangaFireQuickActionsEnabled',
            'autoScrollEnabled',
            'keybindsEnabled',
            'progressTrackingEnabled',
            'cardViewSize',
            'theme',
            'LibraryCardBordersEnabled',
            'LibraryCardBorderThickness',
            'LibraryGlowEffect',
            'LibraryAnimatedBorders',
            'LibraryStatusIcons',
            'LibraryProgressBars',
            'SyncLastDate',
            'SyncEverySetDate',
            'customBookmarks'
        ],
        label: 'Settings'
    },
    personalData: {
        keys: ['libraryPersonalData', 'libraryUserTags', 'libraryFilterPresets'],
        label: 'Tags, Notes & Ratings'
    },
    cache: {
        keys: ['anilistCache', 'mangadexCache'],
        label: 'API Cache'
    }
};

/**
 * Initializes the Import/Export module.
 * Attaches listeners to file drop zones, hidden file inputs, and export buttons.
 */
export function initImportExport() {
    const exportBtn = document.getElementById('exportDataBtn');
    const startImportBtn = document.getElementById('startImportBtn');
    const importInput = document.getElementById('importDataInput');
    const dropZone = document.getElementById('dropZone');
    const mergeToggle = document.getElementById('mergeImportToggle');
    const lastBackupDisplay = document.getElementById('lastBackupDisplay');

    // Export checkboxes
    const exportLibrary = document.getElementById('exportLibrary');
    const exportHistory = document.getElementById('exportHistory');
    const exportSettings = document.getElementById('exportSettings');
    const exportPersonalData = document.getElementById('exportPersonalData');
    const exportCache = document.getElementById('exportCache');

    // Count displays
    const libraryCountEl = document.getElementById('exportLibraryCount');
    const historyCountEl = document.getElementById('exportHistoryCount');
    const personalCountEl = document.getElementById('exportPersonalCount');
    const cacheCountEl = document.getElementById('exportCacheCount');

    /**
     * Updates the export counts to show how much data is available.
     */
    const updateExportCounts = () => {
        chrome.storage.local.get(null, (data) => {
            // Library count
            const libraryCount = Array.isArray(data.savedEntriesMerged)
                ? data.savedEntriesMerged.length
                : (Array.isArray(data.userBookmarks) ? data.userBookmarks.length : 0);
            if (libraryCountEl) libraryCountEl.textContent = `(${libraryCount})`;

            // History count
            const historyCount = data.savedReadChapters
                ? Object.keys(data.savedReadChapters).length
                : 0;
            if (historyCountEl) historyCountEl.textContent = `(${historyCount} titles)`;

            // Personal data count
            const personalCount = data.libraryPersonalData
                ? Object.keys(data.libraryPersonalData).length
                : 0;
            if (personalCountEl) personalCountEl.textContent = `(${personalCount})`;

            // Cache size
            const cacheSize = estimateCacheSize(data);
            if (cacheCountEl) cacheCountEl.textContent = `(${formatBytes(cacheSize)})`;
        });
    };

    /**
     * Estimates the size of the cache data.
     */
    const estimateCacheSize = (data) => {
        let size = 0;
        if (data.anilistCache) {
            size += JSON.stringify(data.anilistCache).length;
        }
        if (data.mangadexCache) {
            size += JSON.stringify(data.mangadexCache).length;
        }
        return size;
    };

    /**
     * Formats bytes to human readable string.
     */
    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    /**
     * Updates the last backup display.
     */
    const updateLastBackupDisplay = () => {
        chrome.storage.local.get("LastBackupDate", (data) => {
            if (lastBackupDisplay) {
                if (data.LastBackupDate) {
                    const date = new Date(data.LastBackupDate);
                    lastBackupDisplay.textContent = date.toLocaleString();
                } else {
                    lastBackupDisplay.textContent = "Never";
                }
            }
        });
    };

    // Initialize displays
    updateLastBackupDisplay();
    updateExportCounts();

    /**
     * Performs selective export based on checked options.
     */
    const exportData = () => {
        const keysToExport = ['LastBackupDate']; // Always include

        // Build list of keys based on selections
        if (exportLibrary?.checked) {
            keysToExport.push(...EXPORT_CATEGORIES.library.keys);
        }
        if (exportHistory?.checked) {
            keysToExport.push(...EXPORT_CATEGORIES.history.keys);
        }
        if (exportSettings?.checked) {
            keysToExport.push(...EXPORT_CATEGORIES.settings.keys);
        }
        if (exportPersonalData?.checked) {
            keysToExport.push(...EXPORT_CATEGORIES.personalData.keys);
        }
        if (exportCache?.checked) {
            keysToExport.push(...EXPORT_CATEGORIES.cache.keys);
        }

        if (keysToExport.length === 1) {
            alert('Please select at least one data category to export.');
            return;
        }

        chrome.storage.local.get(keysToExport, (data) => {
            // Add export metadata
            data._exportMeta = {
                version: '3.9.0',
                exportDate: new Date().toISOString(),
                categories: {
                    library: exportLibrary?.checked || false,
                    history: exportHistory?.checked || false,
                    settings: exportSettings?.checked || false,
                    personalData: exportPersonalData?.checked || false,
                    cache: exportCache?.checked || false
                }
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mangafire_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const now = Date.now();
            chrome.storage.local.set({ LastBackupDate: now }, () => {
                updateLastBackupDisplay();
                Log("Data exported successfully.");
            });
        });
    };

    // Export button listener
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    /**
     * Handles the selected file for import.
     * Determines the file type and provides preview before importing.
     */
    const handleFile = (file) => {
        if (!file) return;

        const isJSON = file.type === "application/json" || file.name.endsWith(".json");
        const isXML = file.type === "text/xml" || file.type === "application/xml" || file.name.endsWith(".xml");

        if (!isJSON && !isXML) {
            alert("Please select a valid JSON or XML file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let importedData;
                if (isJSON) {
                    importedData = JSON.parse(e.target.result);
                } else if (isXML) {
                    importedData = parseXMLBookmarks(e.target.result);
                }

                if (!importedData) {
                    throw new Error("Failed to parse data");
                }

                // Show import preview
                showImportPreview(importedData, mergeToggle?.checked);

            } catch (err) {
                console.error("Import error:", err);
                alert("Failed to parse file. Please ensure it is a valid backup or MyAnimeList XML export.");
            }
        };
        reader.readAsText(file);
    };

    /**
     * Shows an import preview before confirming.
     */
    const showImportPreview = (data, isMerge) => {
        // Count items in imported data
        const stats = {
            libraryEntries: Array.isArray(data.savedEntriesMerged)
                ? data.savedEntriesMerged.length
                : (Array.isArray(data.userBookmarks) ? data.userBookmarks.length : 0),
            historyTitles: data.savedReadChapters ? Object.keys(data.savedReadChapters).length : 0,
            personalData: data.libraryPersonalData ? Object.keys(data.libraryPersonalData).length : 0,
            hasSettings: Object.keys(data).some(k => EXPORT_CATEGORIES.settings.keys.includes(k)),
            hasCache: !!data.anilistCache || !!data.mangadexCache
        };

        // Build summary message
        let summary = `📁 Import Preview\n\n`;
        summary += `📚 Library: ${stats.libraryEntries} entries\n`;
        summary += `📖 History: ${stats.historyTitles} titles\n`;
        summary += `🏷️ Personal Data: ${stats.personalData} entries\n`;
        summary += `⚙️ Settings: ${stats.hasSettings ? 'Included' : 'Not included'}\n`;
        summary += `💾 Cache: ${stats.hasCache ? 'Included' : 'Not included'}\n\n`;
        summary += `Mode: ${isMerge ? 'MERGE (keeps existing data)' : 'OVERWRITE (replaces all data)'}`;

        if (!isMerge) {
            summary += '\n\n⚠️ WARNING: This will delete all your current data!';
        }

        if (confirm(summary + '\n\nProceed with import?')) {
            if (isMerge) {
                processMergeImport(data);
            } else {
                processOverwriteImport(data);
            }
        }
    };

    /**
     * Parses manga bookmarks from an XML string (MyAnimeList format).
     */
    const parseXMLBookmarks = (xmlString) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const mangaNodes = xmlDoc.querySelectorAll("manga");
        
        if (mangaNodes.length === 0) {
            throw new Error("No manga entries found in XML.");
        }

        const userBookmarks = Array.from(mangaNodes).map(node => {
            const titleNode = node.querySelector("manga_title");
            const statusNode = node.querySelector("my_status");
            const readChaptersNode = node.querySelector("my_read_chapters");
            
            let title = titleNode ? decodeHTMLEntities(titleNode.textContent.trim()) : "Unknown Title";
            let status = statusNode ? statusNode.textContent.trim() : "Reading";
            let readChapters = readChaptersNode ? parseInt(readChaptersNode.textContent.trim()) || 0 : 0;

            if (status === "On-Hold") status = "On Hold";
            
            return { title, status, readChapters };
        });

        return { userBookmarks };
    };

    /**
     * Processes an import by overwriting all existing data.
     */
    const processOverwriteImport = (data) => {
        // Remove metadata before storing
        delete data._exportMeta;
        
        chrome.storage.local.clear(() => {
            chrome.storage.local.set(data, () => {
                Log("Data imported (Overwrite) successfully.");
                alert("✅ Import successful! The page will now reload.");
                location.reload();
            });
        });
    };

    /**
     * Processes an import by merging with existing data.
     */
    const processMergeImport = (data) => {
        // Remove metadata before storing
        delete data._exportMeta;

        chrome.storage.local.get(null, (currentData) => {
            const mergedData = { ...currentData, ...data };

            // Special handling for bookmarks to avoid duplicates
            if (data.userBookmarks && currentData.userBookmarks) {
                const bookmarkMap = new Map();
                currentData.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
                data.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
                mergedData.userBookmarks = Array.from(bookmarkMap.values());
            }

            // Merge savedEntriesMerged
            if (data.savedEntriesMerged && currentData.savedEntriesMerged) {
                const entryMap = new Map();
                currentData.savedEntriesMerged.forEach(e => entryMap.set(e.title.toLowerCase(), e));
                data.savedEntriesMerged.forEach(e => entryMap.set(e.title.toLowerCase(), e));
                mergedData.savedEntriesMerged = Array.from(entryMap.values());
            }

            // Merge custom markers
            if (data.customBookmarks && currentData.customBookmarks) {
                const markerMap = new Map();
                currentData.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
                data.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
                mergedData.customBookmarks = Array.from(markerMap.values());
            }

            // Merge reading history
            if (data.savedReadChapters && currentData.savedReadChapters) {
                const mergedHistory = { ...currentData.savedReadChapters };
                Object.entries(data.savedReadChapters).forEach(([key, chapters]) => {
                    if (mergedHistory[key]) {
                        // Combine unique chapters
                        mergedHistory[key] = [...new Set([...mergedHistory[key], ...chapters])];
                    } else {
                        mergedHistory[key] = chapters;
                    }
                });
                mergedData.savedReadChapters = mergedHistory;
            }

            // Merge caches
            if (data.anilistCache && currentData.anilistCache) {
               mergedData.anilistCache = { ...currentData.anilistCache, ...data.anilistCache };
            }

            // Merge personal data
            if (data.libraryPersonalData && currentData.libraryPersonalData) {
                mergedData.libraryPersonalData = { ...currentData.libraryPersonalData, ...data.libraryPersonalData };
            }

            chrome.storage.local.set(mergedData, () => {
                Log("Data imported (Merge) successfully.");
                alert("✅ Import successful! New data has been merged.");
                location.reload();
            });
        });
    };

    // Drag and Drop Logic
    if (dropZone) {
        dropZone.addEventListener('click', () => importInput?.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (startImportBtn) {
        startImportBtn.addEventListener('click', () => importInput?.click());
    }

    if (importInput) {
        importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }
    
    // MDList Import
    const mdlistImportBtn = document.getElementById('mdlistImportBtn');
    const mdlistInput = document.getElementById('mdlistInput');
    
    if (mdlistImportBtn && mdlistInput) {
        mdlistImportBtn.addEventListener('click', async () => {
            const inputValue = mdlistInput.value.trim();
            
            if (!inputValue) {
                alert('Please enter a MangaDex list URL or ID.');
                return;
            }
            
            mdlistImportBtn.disabled = true;
            mdlistImportBtn.textContent = 'Importing...';
            
            try {
                const result = await fetchMDList(inputValue);
                
                if (!result.success) {
                    alert(`Import failed: ${result.error}`);
                    return;
                }
                
                if (result.manga.length === 0) {
                    alert('No manga found in this list.');
                    return;
                }
                
                // Add manga to library
                chrome.storage.local.get(['savedEntriesMerged'], (data) => {
                    let savedEntries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
                    
                    const existingTitles = new Set(savedEntries.map(e => e.title.toLowerCase()));
                    const existingMdIds = new Set(savedEntries.filter(e => e.anilistData?.mangadexId).map(e => e.anilistData.mangadexId));
                    
                    let added = 0;
                    let skipped = 0;
                    
                    result.manga.forEach(manga => {
                        const title = manga.title?.english || manga.title?.romaji || 'Unknown';
                        const mdId = manga.mangadexId;
                        
                        if (existingTitles.has(title.toLowerCase()) || existingMdIds.has(mdId)) {
                            skipped++;
                            return;
                        }
                        
                        savedEntries.push({
                            title: title,
                            status: 'Plan to Read',
                            readChapters: 0,
                            anilistData: manga,
                            customMarker: null,
                            lastUpdated: Date.now(),
                            importedFrom: 'MDList'
                        });
                        added++;
                    });
                    
                    chrome.storage.local.set({ savedEntriesMerged: savedEntries }, () => {
                        alert(`✅ Imported ${added} manga from "${result.listName}". ${skipped} duplicates skipped.`);
                        mdlistInput.value = '';
                        location.reload();
                    });
                });
                
            } catch (error) {
                console.error('MDList import error:', error);
                alert(`Import error: ${error.message}`);
            } finally {
                mdlistImportBtn.disabled = false;
                mdlistImportBtn.textContent = 'Import';
            }
        });
    }
}
