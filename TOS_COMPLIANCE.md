# Terms of Service & Compliance Documentation

This document outlines the Terms of Service (ToS) and operational policies of the supported platforms, ensuring that the **Bookmarks Marker/Highlighter** extension operates within ethical and legal boundaries.

## Core Compliance Principle
The extension operates on a **"User-Side Enhancement"** basis.
1.  **No Content Scraping**: It does not download, store, or redistribute copyrighted image content.
2.  **No Access Bypassing**: It does not bypass paywalls, age gates, or account requirements.
3.  **DOM-Only Interaction**: It only reads metadata (titles, chapter numbers) from the page the user is currently viewing to sync reading progress.

---

## 1. MangaPlus by Shueisha (Official)
**URL**: [mangaplus.shueisha.co.jp](https://mangaplus.shueisha.co.jp)
**Type**: Official Publisher Platform

### Key ToS Points:
*   **User Responsibility**: Users are responsible for their use of the service.
*   **Prohibited Acts**: Unauthorized reproduction or distribution of content is strictly prohibited.
*   **Access Control**: Users must not attempt to bypass access controls.

### Extension Compliance:
*   ✅ **Enhancement Only**: The extension only adds visual indicators (read status) to the UI.
*   ✅ **No Reproduction**: No manga pages are saved or copied.
*   ✅ **Respects Access**: Works only on chapters the user has legal access to view.

---

## 2. Asura Scans
**URL**: [asuracomic.net](https://asuracomic.net)
**Type**: Scanlation Group (Fan-Translated)

### Operational Context:
*   **Legal Status**: Hosting unofficial translations.
*   **Security**: History of domain cloning and malware on copycat sites.
*   **Monetization**: Offers paid subscriptions for early access.

### Extension Compliance:
*   ✅ **Security First**: The extension is restricted to run only on the specific, currently known-good domain (`asuracomic.net`) to prevent running on malicious clones.
*   ✅ **Reader Enhancement**: Tracks reading progress solely by observing the URL and page title of the chapter the user is actively reading.
*   ✅ **Ad-Blocker Neutral**: The extension does not interfere with the site's ads or subscription models.

---

## 3. Manganato / MangaKakalot
**URL**: [manganato.com](https://manganato.com), [mangakakalot.com](https://mangakakalot.com)
**Type**: Aggregator

### Operational Context:
*   **Aggregator Model**: Hosts content from various sources.
*   **Stability**: Standard Multi-Page Application (MPA) structure.

### Extension Compliance:
---
1.  **Passive Monitoring**: The extension passively monitors the "currently reading" URL to update the user's local history.
2.  **No Automated Crawling**: It does not crawl the site for content; it only reacts to user navigation.

---

## 4. Webtoons (WEBTOON.com)
**URL**: [webtoons.com](https://www.webtoons.com)
**Type**: Official Webcomic Platform

### Key ToS Points:
*   **Monetization**: Uses "Coins" and "Daily Pass" for premium contents.
*   **Prohibited Acts**: Capturing, scraping, or bypassing access locks is strictly prohibited.

### Extension Compliance:
*   ✅ **Awareness Only**: The "Daily Pass Tracker" only displays information available in the public DOM (e.g., "Available in 5h"). It does **not** bypass the lock or provide unauthorized access to episodes.
*   ✅ **Metadata Extraction**: Only extracts episode numbers and titles from the page the user is viewing.
*   ✅ **No Coin Interaction**: Does not interact with or manipulate the coin system in any way.
