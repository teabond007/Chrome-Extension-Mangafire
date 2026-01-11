import { Log, decodeHTMLEntities } from './utils.js';

// --- Import & Export Logic ---
export function initImportExport() {
    const exportBtn = document.getElementById('exportDataBtn');
    const startImportBtn = document.getElementById('startImportBtn'); // Changed ID to be unique
    const importInput = document.getElementById('importDataInput');
    const dropZone = document.getElementById('dropZone');
    const mergeToggle = document.getElementById('mergeImportToggle');
    const lastBackupDisplay = document.getElementById('lastBackupDisplay');

    // Update Last Backup Display
    const updateLastBackupDisplay = () => {
        chrome.storage.local.get("LastBackupDate", (data) => {
            if (data.LastBackupDate) {
                const date = new Date(data.LastBackupDate);
                lastBackupDisplay.textContent = date.toLocaleString();
            } else {
                lastBackupDisplay.textContent = "Never";
            }
        });
    };
    updateLastBackupDisplay();

    // Export Logic
    exportBtn.addEventListener('click', () => {
        const keysToExport = [
            "userBookmarks",
            "customBookmarks",
            "SyncLastDate",
            "SyncEverySetDate",
            "CustomBorderSize",
            "MarkHomePagefeatureEnabled",
            "SyncandMarkReadfeatureEnabled",
            "CustomBookmarksfeatureEnabled",
            "AutoSyncfeatureEnabled",
            "CustomBorderSizefeatureEnabled",
            "FamilyFriendlyfeatureEnabled",
            "anilistCache",
            "savedEntriesMerged",
            "cardViewSize",
            "theme",
            "LastBackupDate"
        ];

        chrome.storage.local.get(keysToExport, (data) => {
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
                if (typeof Log === 'function') Log("Data exported successfully.");
            });
        });
    });

    // Import Logic
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

                const isMerge = mergeToggle.checked;
                if (isMerge) {
                    processMergeImport(importedData);
                } else {
                    processOverwriteImport(importedData);
                }
            } catch (err) {
                console.error("Import error:", err);
                alert("Failed to parse file. Please ensure it is a valid backup or MyAnimeList XML export.");
            }
        };
        reader.readAsText(file);
    };

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

            // Normalize status if needed (MangaFire common statuses)
            if (status === "On-Hold") status = "On Hold";
            
            return { title, status, readChapters };
        });

        // Wrap in the format expected by the import logic
        return { userBookmarks };
    };

    const processOverwriteImport = (data) => {
        if (confirm("This will overwrite all your current data. Are you sure?")) {
            chrome.storage.local.clear(() => {
                chrome.storage.local.set(data, () => {
                    if (typeof Log === 'function') Log("Data imported (Overwrite) successfully.");
                    alert("Import successful! The page will now reload.");
                    location.reload();
                });
            });
        }
    };

    const processMergeImport = (data) => {
        chrome.storage.local.get(null, (currentData) => {
            const mergedData = { ...currentData, ...data };

            // Special handling for bookmarks and custom markers
            if (data.userBookmarks && currentData.userBookmarks) {
                const bookmarkMap = new Map();
                currentData.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
                data.userBookmarks.forEach(b => bookmarkMap.set(b.title.toLowerCase(), b));
                mergedData.userBookmarks = Array.from(bookmarkMap.values());
            }

            if (data.customBookmarks && currentData.customBookmarks) {
                const markerMap = new Map();
                currentData.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
                data.customBookmarks.forEach(m => markerMap.set(m.name.toLowerCase(), m));
                mergedData.customBookmarks = Array.from(markerMap.values());
            }

            // Merge anilistCache
            if (data.anilistCache && currentData.anilistCache) {
               mergedData.anilistCache = { ...currentData.anilistCache, ...data.anilistCache };
            }

            chrome.storage.local.set(mergedData, () => {
                if (typeof Log === 'function') Log("Data imported (Merge) successfully.");
                alert("Import successful! New data has been merged.");
                location.reload();
            });
        });
    };

    // Drag and Drop
    dropZone.addEventListener('click', () => importInput.click());
    if (startImportBtn) {
        startImportBtn.addEventListener('click', () => importInput.click());
    }
    importInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

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
