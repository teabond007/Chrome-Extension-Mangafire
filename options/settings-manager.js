/**
 * General Settings management (Sync Interval, Border Size)
 */

export function initSettings() {
    initSyncInterval();
    initBorderSize();
}

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

function initBorderSize() {
    const saveBtn = document.getElementById("CustomBorderSizeButton");
    const resetBtn = document.getElementById("CustomBorderSizeButtonReset");
    const slider = document.getElementById("BorderSetSize");
    const display = document.getElementById("rangeValueDisplay");
    const status = document.getElementById("logContainerCustomBorderSize");

    // Load initial
    chrome.storage.local.get("CustomBorderSize", (data) => {
        const val = data.CustomBorderSize || 4;
        if (slider) slider.value = val;
        if (display) display.textContent = `${val}px`;
    });

    if (slider) {
        slider.addEventListener("input", (e) => {
            if (display) display.textContent = `${e.target.value}px`;
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const val = slider.value;
            chrome.storage.local.set({ CustomBorderSize: val }, () => {
                if (status) {
                    status.textContent = `Saved: Border size ${val}px.`;
                    setTimeout(() => status.textContent = "", 3000);
                }
            });
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            chrome.storage.local.set({ CustomBorderSize: 4 }, () => {
                if (slider) slider.value = 4;
                if (display) display.textContent = "4px";
                if (status) {
                    status.textContent = "Reset to default (4px).";
                    setTimeout(() => status.textContent = "", 3000);
                }
            });
        });
    }
}
