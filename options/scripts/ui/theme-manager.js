/**
 * @fileoverview Manages the application's visual theme (Dark/Light mode).
 * Handles persistence across browser storage and localStorage for instant head-script application.
 */
/**
 * @fileoverview Manages theme (Dark/Light/Black) toggling and persistence.
 * Synchronizes state between chrome.storage.local and localStorage for FOUC prevention.
 */

/**
 * Initializes the theme module.
 * Loads the saved theme and attaches listeners to the toggle button.
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function initTheme() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const html = document.documentElement;

    /**
     * Applies the specified theme by updating the root element classes.
     * @param {string} theme - One of 'light', 'dark', 'black', or 'neon'.
     */
    const applyTheme = (theme) => {
        // Remove all theme-specific classes first
        html.classList.remove("dark-mode", "black-mode", "neon-mode");
        
        if (theme === "dark") {
            html.classList.add("dark-mode");
        } else if (theme === "black") {
            html.classList.add("black-mode");
        } else if (theme === "neon") {
            html.classList.add("neon-mode");
        }
        
        // Sync localStorage for head script on next load
        localStorage.setItem("theme", theme);
    };

    // Load saved theme (default to 'dark')
    const { theme = 'dark' } = await chrome.storage.local.get("theme");
    applyTheme(theme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            // Cycle: Light -> Dark -> Black -> Neon -> Light
            let currentTheme = 'light';
            if (html.classList.contains("neon-mode")) {
                currentTheme = 'neon';
            } else if (html.classList.contains("black-mode")) {
                currentTheme = 'black';
            } else if (html.classList.contains("dark-mode")) {
                currentTheme = 'dark';
            }

            let newTheme;
            switch (currentTheme) {
                case 'light': newTheme = 'dark'; break;
                case 'dark':  newTheme = 'black'; break;
                case 'black': newTheme = 'neon'; break;
                case 'neon':  newTheme = 'light'; break;
                default:      newTheme = 'dark';
            }
            
            applyTheme(newTheme);
            chrome.storage.local.set({ theme: newTheme });
        });
    }

}
