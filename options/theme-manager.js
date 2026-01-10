/**
 * Dark/Light theme management
 */

export function initTheme() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const body = document.body;

    // Load saved theme
    chrome.storage.local.get("theme", (data) => {
        if (data.theme === "dark") {
            body.classList.add("dark-mode");
        }
    });

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isDarkMode = body.classList.toggle("dark-mode");
            chrome.storage.local.set({ theme: isDarkMode ? "dark" : "light" });
        });
    }
}
