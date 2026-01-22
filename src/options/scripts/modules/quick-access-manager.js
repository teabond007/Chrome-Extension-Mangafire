/**
 * Quick Access Shortcuts management
 */

const DEFAULT_SHORTCUTS = [
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'ChatGPT', url: 'https://chat.openai.com' },
    { name: 'Spotify', url: 'https://open.spotify.com' },
    { name: 'Gmail', url: 'https://mail.google.com' },
    { name: 'Discord', url: 'https://discord.com' }
];

/**
 * Initializes the quick access management module.
 */
export function initQuickAccessManager() {
    const container = document.getElementById("QuickAccessContainer");
    const saveBtn = document.getElementById("SaveQuickAccessButton");
    const resetBtn = document.getElementById("ResetQuickAccessButton");
    const status = document.getElementById("logContainerQuickAccess");

    if (!container) return;

    // Load initial
    chrome.storage.local.get("QuickAccessShortcuts", (data) => {
        const shortcuts = data.QuickAccessShortcuts || DEFAULT_SHORTCUTS;
        renderInputs(container, shortcuts);
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const shortcuts = [];
            const rows = container.querySelectorAll(".shortcut-input-row");
            rows.forEach(row => {
                const nameInput = row.querySelector(".shortcut-name-input");
                const urlInput = row.querySelector(".shortcut-url-input");
                if (nameInput && urlInput && urlInput.value.trim()) {
                    shortcuts.push({
                        name: nameInput.value.trim() || "Link",
                        url: urlInput.value.trim()
                    });
                }
            });

            chrome.storage.local.set({ QuickAccessShortcuts: shortcuts }, () => {
                if (status) {
                    status.textContent = "Saved: Quick Access shortcuts updated.";
                    setTimeout(() => status.textContent = "", 3000);
                }
            });
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            chrome.storage.local.set({ QuickAccessShortcuts: DEFAULT_SHORTCUTS }, () => {
                renderInputs(container, DEFAULT_SHORTCUTS);
                if (status) {
                    status.textContent = "Reset to default shortcuts.";
                    setTimeout(() => status.textContent = "", 3000);
                }
            });
        });
    }
}

function renderInputs(container, shortcuts) {
    container.innerHTML = "";
    // Always provide 5 slots
    for (let i = 0; i < 5; i++) {
        const site = shortcuts[i] || { name: "", url: "" };
        const row = document.createElement("div");
        row.className = "input-group-row shortcut-input-row";
        row.style.marginBottom = "10px";
        row.innerHTML = `
            <div class="input-wrapper flex-grow">
                <input type="text" placeholder="Name (e.g. YouTube)" class="input-field shortcut-name-input" value="${site.name}">
            </div>
            <div class="input-wrapper flex-grow-large">
                <input type="text" placeholder="URL (https://...)" class="input-field shortcut-url-input" value="${site.url}">
            </div>
        `;
        container.appendChild(row);
    }
}
