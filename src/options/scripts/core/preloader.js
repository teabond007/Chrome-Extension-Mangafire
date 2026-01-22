/**
 * Preloader Script
 * Handles initial theme application to prevent Flash of Unstyled Content (FOUC).
 * This script runs immediately in the head.
 */
(function () {
    try {
        const localTheme = localStorage.getItem("theme");
        const html = document.documentElement;
        
        // Remove existing theme classes
        html.classList.remove("dark-mode", "black-mode", "neon-mode", "light-mode");

        if (localTheme === "light") {
            html.classList.add("light-mode");
        } else if (localTheme === "black") {
            html.classList.add("black-mode");
        } else if (localTheme === "neon") {
            html.classList.add("neon-mode");
        } else if (localTheme === "custom") {
            // Appearance manager will handle custom theme via style injection
            // but we can default to dark-mode for base colors if custom isn't loaded yet
            html.classList.add("dark-mode");
        } else {
            // Default to dark
            html.classList.add("dark-mode");
        }
    } catch (e) {
        console.error("Preloader error:", e);
    }
})();
