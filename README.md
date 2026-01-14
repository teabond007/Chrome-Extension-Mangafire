# MangaFire Bookmark Color Marker

A powerful Chrome Extension for [MangaFire.to](https://mangafire.to/home) that enhances your browsing experience by automatically highlighting manga based on your bookmarks, reading history, and custom lists. Now with a fully customizable Dashboard.

![Extension Preview](images/ExtensioExampleWritten.png)

## 🚀 Why Use This?
Finding new manga to read can be frustrating when you can't instantly see what you've already read or saved. MangaFire's default interface doesn't always make this clear at a glance. 

**Bookmark Color Marker** solves this by visually tagging manga covers with colored borders corresponding to their status (e.g., Reading, Completed, Plan to Read) directly on the browsing pages. It also provides a powerful local **Library Dashboard** to manage your collection.

## ✨ Features

### 🎨 Appearance & Themes
- **Preset Themes**: Instant switching between **Cloudy Dark**, **Absolute Black** (AMOLED), **Clean Light**, and **Cyber Neon**.
- **Custom Theme Creator**: Design your own look with live color pickers for background, sidebar, accents, and text.
- **Instant Load**: Custom themes load instantly without flashes, thanks to optimized storage syncing.
- **Glassmorphism UI**: A modern, sleek interface with glass-like elements.

### 📚 Advanced Library Management
- **Statistics Dashboard**: Visualize your library with a real-time count of your manga by status (Reading, Completed, etc.).
- **Bulk Operations**: Mass-update the status of multiple manga at once. Filter by current status or search term, then apply a new status to all matching items in one click.
- **Smart Filtering**: Advanced filters for format, status, and genre.

### ⚡ Core Functionality
- **Automatic Highlighting**: Instantly spot your saved manga with custom colored borders while browsing.
- **Custom Markers**: Create unique categories (e.g., "Top Tier", "Droppable") with their own colors and styles.
- **History Sync**: Optionally highlight manga from your reading history even if not bookmarked.
- **Auto-Sync**: Automatically updates your local bookmark cache in the background.

## 🔒 Privacy & Security
This extension is built with a **Privacy-First** approach:
- **Local Storage**: All your library data and settings are stored locally on your device.
- **No Tracking**: We do not collect, store, or transmit any usage data.
- **No External Servers**: The extension communicates only with MangaFire.to and AniList (for data fetching) directly from your browser.

## 🛠️ Installation
1. Download or Clone this repository.
2. Go to `chrome://extensions/` in your Chrome browser.
3. Toggle **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the folder containing this extension.

## 📖 Usage
1. **Initial Sync**: 
   - Ensure you are logged into MangaFire.to.
   - Click the extension icon or go to the Options page.
   - Click **Run Sync** or **Sync Bookmarks**. 
   - *Note: This is required for the extension to know your list!*
2. **Browse**: Go to any MangaFire page. Your saved mangas will now have colored borders!
3. **Customize**: Open the Options page to:
   - Create a **Custom Theme** in the Appearance tab.
   - Manage your library with **Bulk Operations** in the Saved Entries tab.
   - Check your collection **Stats**.

## ⚙️ Customization Power
- **Global Borders**: Adjust the border thickness and style (Solid, Dashed, Dotted, Double, Groove, Ridge, Inset, Outset) globally.
- **Theme Variables**: The theme engine uses dynamic CSS variables (`--bg-body`, `--accent-primary`, etc.) allowing for infinite color combinations.

## ⚠️ Disclaimer
- This is an **unofficial** extension and is not affiliated with MangaFire.to.
- Built for MangaFire v2.
- Icons and CSS inspired by [Uiverse.io](https://uiverse.io/) (MIT License).

---
*Version 3.5.1*
