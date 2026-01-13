/**
 * General Settings management (Sync Interval, Border Size)
 */

/**
 * Initializes the settings management module.
 * Attaches listeners for preference changes and management actions.
 * @returns {void}
 */
export function initSettings() {
    initSyncInterval();
}

/**
 * Initializes the synchronization interval settings.
 * Loads the saved interval, handles saving new intervals, and resetting to default.
 * @returns {void}
 */
function initSyncInterval() {
    const saveBtn = document.getElementById("AutoSyncSetDaysButton");
    const resetBtn = document.getElementById("AutoSyncSetDaysButtonReset");
    const input = document.getElementById("AutoSyncSetDays");
    const status = document.getElementById("logContainerSetDays");

    // Load initial
    chrome.storage.local.get("SyncEverySetDate", (data) => {
        if (input) input.value = data.SyncEverySetDate || 30;
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const val = input.value;
            chrome.storage.local.set({ SyncEverySetDate: val }, () => {
                if (status) {
                    status.textContent = `Saved: Sync every ${val} days.`;
                    setTimeout(() => status.textContent = "", 3000);
                }
            });
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            chrome.storage.local.set({ SyncEverySetDate: 30 }, () => {
                if (input) input.value = 30;
                if (status) {
                    status.textContent = "Reset to default (30 days).";
                    setTimeout(() => status.textContent = "", 3000);
                }
            });
        });
    }
}


