/**
 * Appearance Manager
 * Handles preset themes, custom theme creator, and global border settings.
 */

import { Log } from '../core/utils.js';

let currentTheme = 'dark';
let customTheme = {
    bg: '#0b1437',
    sidebar: '#111c44',
    accent: '#7551FF',
    text: '#ffffff'
};

export function initAppearanceManager() {
    initPresetThemes();
    initCustomThemeCreator();
    initGlobalBorders();
    loadAppearanceSettings();
}

function initPresetThemes() {
    const cards = document.querySelectorAll('.theme-preview-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            console.log("button clicked")
            const theme = card.getAttribute('data-tab') || card.getAttribute('data-theme');
            applyPresetTheme(theme);
            
            // UI state
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
}

function applyPresetTheme(theme) {
    currentTheme = theme;
    const html = document.documentElement;
    html.classList.remove('dark-mode', 'black-mode', 'neon-mode', 'light-mode');
    
    if (theme === 'light') {
        html.classList.add('light-mode');
    } else {
        html.classList.add(`${theme}-mode`);
    }
    
    // Clear any custom theme overrides when switching to preset
    clearCustomThemeStyles();
    
    // Sync both storage types to ensure inline script on next load can pick it up
    localStorage.setItem("theme", theme);
    chrome.storage.local.set({ theme: theme, isCustomTheme: false });
    Log(`Theme switched to ${theme}`);
}

function initCustomThemeCreator() {
    const applyBtn = document.getElementById('ApplyCustomThemeBtn');
    const resetBtn = document.getElementById('ResetThemeBtn');
    
    const bgInput = document.getElementById('themeColorBg');
    const sidebarInput = document.getElementById('themeColorSidebar');
    const accentInput = document.getElementById('themeColorAccent');
    const textInput = document.getElementById('themeColorText');

    applyBtn?.addEventListener('click', () => {
        customTheme = {
            bg: bgInput.value,
            sidebar: sidebarInput.value,
            accent: accentInput.value,
            text: textInput.value
        };
        
        applyCustomTheme(customTheme);
        
        // Remove active state from presets
        document.querySelectorAll('.theme-preview-card').forEach(c => c.classList.remove('active'));
        
        // Sync both storage types
        localStorage.setItem("theme", "custom");
        chrome.storage.local.set({ 
            isCustomTheme: true, 
            customThemeData: customTheme 
        });
        Log("Custom theme applied and saved.");
    });

    resetBtn?.addEventListener('click', () => {
        if (confirm("Reset to default Cloudy Dark theme?")) {
            applyPresetTheme('dark');
            // Reset inputs to default dark colors
            bgInput.value = '#0b1437';
            sidebarInput.value = '#111c44';
            accentInput.value = '#7551FF';
            textInput.value = '#ffffff';
            
            document.querySelectorAll('.theme-preview-card').forEach(c => {
                if (c.getAttribute('data-theme') === 'dark') c.classList.add('active');
            });
        }
    });
}

function applyCustomTheme(data) {
    if (!data) return;
    const root = document.documentElement;
    
    // Dynamic CSS Variable Injection - Adjusted to match _base.css
    root.style.setProperty('--bg-body', data.bg);
    root.style.setProperty('--bg-card', data.bg);
    root.style.setProperty('--bg-sidebar', data.sidebar);
    root.style.setProperty('--accent-primary', data.accent);
    root.style.setProperty('--primary', data.accent);
    root.style.setProperty('--text-primary', data.text);
    root.style.setProperty('--text-white', data.text);
    
    // Derivative variables for glassmorphism and borders
    const rgbBg = hexToRgb(data.bg);
    const rgbText = hexToRgb(data.text);
    
    root.style.setProperty('--glass-bg', `rgba(${rgbBg}, 0.4)`);
    root.style.setProperty('--glass-border', `rgba(${rgbText}, 0.1)`);
    root.style.setProperty('--border-color', `rgba(${rgbText}, 0.1)`);
    root.style.setProperty('--input-bg', `rgba(${rgbBg}, 0.2)`);
    root.style.setProperty('--input-border', `rgba(${rgbText}, 0.1)`);
    
    // Update body bg for immediate effect
    document.body.style.backgroundColor = data.bg;
    Log(`Custom theme applied: BG=${data.bg}, Sidebar=${data.sidebar}`);
}

function clearCustomThemeStyles() {
    const root = document.documentElement;
    const vars = [
        '--bg-body', '--bg-card', '--bg-sidebar', 
        '--accent-primary', '--primary', 
        '--text-primary', '--text-white', 
        '--glass-bg', '--glass-border',
        '--border-color', '--input-bg', '--input-border'
    ];
    vars.forEach(v => root.style.removeProperty(v));
    document.body.style.backgroundColor = '';
}

function initGlobalBorders() {
    const slider = document.getElementById("GlobalBorderSize");
    const display = document.getElementById("globalRangeValue");
    const styleSelect = document.getElementById("GlobalBorderStyle");

    slider?.addEventListener("input", (e) => {
        const val = e.target.value;
        if (display) display.textContent = `${val}px`;
        chrome.storage.local.set({ CustomBorderSize: val });
    });

    styleSelect?.addEventListener("change", (e) => {
        chrome.storage.local.set({ GlobalBorderStyle: e.target.value });
    });
}

function loadAppearanceSettings() {
    chrome.storage.local.get(["theme", "isCustomTheme", "customThemeData", "CustomBorderSize", "GlobalBorderStyle"], (data) => {
        // 1. Theme
        if (data.isCustomTheme && data.customThemeData) {
            applyCustomTheme(data.customThemeData);
            // Update inputs
            if (document.getElementById('themeColorBg')) {
                document.getElementById('themeColorBg').value = data.customThemeData.bg;
                document.getElementById('themeColorSidebar').value = data.customThemeData.sidebar;
                document.getElementById('themeColorAccent').value = data.customThemeData.accent;
                document.getElementById('themeColorText').value = data.customThemeData.text;
            }
            document.querySelectorAll('.theme-preview-card').forEach(c => c.classList.remove('active'));
        } else {
            const theme = data.theme || 'dark';
            applyPresetTheme(theme);
            document.querySelectorAll('.theme-preview-card').forEach(c => {
                if (c.getAttribute('data-theme') === theme) c.classList.add('active');
                else c.classList.remove('active');
            });
        }

        // 2. Borders
        const borderSize = data.CustomBorderSize || 4;
        const borderStyle = data.GlobalBorderStyle || 'solid';
        
        const slider = document.getElementById("GlobalBorderSize");
        const display = document.getElementById("globalRangeValue");
        const styleSelect = document.getElementById("GlobalBorderStyle");
        
        if (slider) slider.value = borderSize;
        if (display) display.textContent = `${borderSize}px`;
        if (styleSelect) styleSelect.value = borderStyle;
    });
}

/**
 * Helper to convert HEX to RGB for rgba() usage
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '11, 20, 55';
}
