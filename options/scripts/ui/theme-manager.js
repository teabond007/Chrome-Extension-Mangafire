/**
 * @fileoverview Manages the application's visual theme (Dark/Light mode).
 * Handles persistence across browser storage and localStorage for instant head-script application.
 */

/**
 * Initializes the theme system on page load.
 * Retrieves the saved preference from chrome.storage.local, applies it to the root element,
 * and sets up the click listener for the theme toggle button.
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function initTheme() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const html = document.documentElement;

    // Load saved theme from chrome storage (source of truth)
    // Default to 'dark' mode if no preference is found.
    const { theme = 'dark' } = await chrome.storage.local.get("theme");
    
    // Apply theme to the root <html> element for CSS scoping
    if (theme === "dark") {
        html.classList.add("dark-mode");
    } else {
        html.classList.remove("dark-mode");
    }

    // Synchronize current theme to localStorage.
    // This allows the inline <script> in the <head> to read it instantly on the next page load.
    localStorage.setItem("theme", theme);

    // Attach interaction listener to the toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            // Toggle the visibility class
            const isDarkMode = html.classList.toggle("dark-mode");
            const newTheme = isDarkMode ? "dark" : "light";
            
            // Persist the new choice to both storage mechanisms
            chrome.storage.local.set({ theme: newTheme });
            localStorage.setItem("theme", newTheme);
        });
    }
}


