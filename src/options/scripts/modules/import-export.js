import { Log, decodeHTMLEntities } from '../ui/logger.js';
import { fetchMDList } from '../../../scripts/core/api/mangadex-api.js';
import { EXPORT_CATEGORIES, gatherStorageData, applyStorageData } from './storage-io.js';
import { STORAGE_KEYS } from '../../../config.js';

export { EXPORT_CATEGORIES };

/**
 * @fileoverview Manages Data Portability (Import and Export) for the extension.
 * Supports selective exporting, import preview, and multiple import formats.
 */

/**
 * Initializes the Import/Export module.
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

    /**
     * Performs selective export based on checked options.
     */
    const exportData = async () => {
        const categories = {
            library: exportLibrary?.checked || false,
            history: exportHistory?.checked || false,
            settings: exportSettings?.checked || false,
            personalData: exportPersonalData?.checked || false,
            cache: exportCache?.checked || false,
            customSites: true // Always include configs in export for completeness
        };

        if (!Object.values(categories).some(Boolean)) {
            alert('Please select at least one data category to export.');
            return;
        }

        const data = await gatherStorageData(categories);
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
        chrome.storage.local.set({ [STORAGE_KEYS.LAST_BACKUP]: now }, () => {
            updateLastBackupDisplay();
            Log("Data exported successfully.");
        });
    };

    // Export button listener
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    /**
     * Handles the selected file for import.
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
        const stats = {
            libraryEntries: Array.isArray(data[STORAGE_KEYS.LIBRARY_ENTRIES])
                ? data[STORAGE_KEYS.LIBRARY_ENTRIES].length
                : 0,
            historyTitles: data.savedReadChapters ? Object.keys(data.savedReadChapters).length : 0,
            personalData: data[STORAGE_KEYS.PERSONAL_DATA] ? Object.keys(data[STORAGE_KEYS.PERSONAL_DATA]).length : 0,
            hasSettings: Object.keys(data).some(k => EXPORT_CATEGORIES.settings.keys.includes(k)),
            hasCache: !!data.anilistCache || !!data.mangadexCache
        };

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
            applyStorageData(data, isMerge).then(() => {
                Log(`Data imported successfully (${isMerge ? 'Merge' : 'Overwrite'}).`);
                alert("✅ Import successful! The page will now reload.");
                location.reload();
            });
        }
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
                chrome.storage.local.get([STORAGE_KEYS.LIBRARY_ENTRIES], (data) => {
                    let savedEntries = Array.isArray(data[STORAGE_KEYS.LIBRARY_ENTRIES]) ? data[STORAGE_KEYS.LIBRARY_ENTRIES] : [];
                    
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
                            customStatus: null,
                            lastUpdated: Date.now(),
                            importedFrom: 'MDList'
                        });
                        added++;
                    });
                    
                    chrome.storage.local.set({ [STORAGE_KEYS.LIBRARY_ENTRIES]: savedEntries }, () => {
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
