# Copilot instructions for Mangafire Chrome extension

This file orients AI coding agents to the repository layout, conventions, and quick developer workflows so they can be productive immediately.

Key architecture
- **Chrome extension MV3**: See [manifest.json](manifest.json). Main pieces:
  - background service worker: [background.js](background.js)
  - content script: [content.js](content.js) (runs on *://mangafire.to/*)
  - popup UI: [popup/popup.js](popup/popup.js) and [popup/popup.html](popup/popup.html)
  - options UI: `options/` (HTML/JS/CSS, modular structure)

Important directories and patterns
- `options/scripts/core/` contains platform/integration code (e.g. `anilist-api.js`, `anilist-query.graphql`). The GraphQL query is loaded at runtime with `chrome.runtime.getURL('options/scripts/core/anilist-query.graphql')`.
- `options/scripts/modules/` holds feature modules (e.g. `settings-manager.js`, `library-manager.js`, `marker-manager.js`) that export functions and attach DOM listeners in `options/options.html`.
- `options/scripts/ui/` contains UI factory components (e.g. `manga-card-factory.js`) used to render lists/cards in the options page.
- Styling lives in `options/styles/` and is broken into named CSS files (base, components, layout, etc.).

Runtime & integration specifics agents must know
- Storage: the code uses `chrome.storage.local` for configuration and data. Common keys include `userBookmarks`, `SyncEverySetDate`, `SyncLastDate`, and feature toggles like `AutoSyncfeatureEnabled`.
- Messaging: background ↔ popup/options/content use `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`. See `background.js` scrape flow and message handlers.
- Content injection: `background.js` uses `chrome.scripting.executeScript` to run scraping code in Mangafire pages and then stores results in `chrome.storage.local`.
- External API: AniList GraphQL (`https://graphql.anilist.co`) is called from `options/scripts/core/anilist-api.js` which implements rate-limiting, retry/backoff, and title-cleaning strategies. Preserve its retry constants (`MIN_REQUEST_INTERVAL`, `MAX_RETRIES`, `RETRY_DELAY_BASE`) when making changes.

Developer workflows (how to run / test changes)
- No build step: this is plain JS/CSS/HTML. To test locally, load the extension in Chrome/Chromium Developer Mode → "Load unpacked" pointing at the repository root.
- Quick checks:
  - Open `chrome://extensions`, enable Developer Mode, update the extension and inspect the background service worker console for logs (background.js uses `chrome.runtime.sendMessage` to surface logs).
  - Use the popup (`popup/popup.html`) to trigger manual sync (`SyncBtn`) which sends `{type: 'scrapeBookmarks', value: 1}`.
  - Open `options/options.html` to exercise settings and UI components (modules export named init functions like `initSettings()` in `options/scripts/modules/settings-manager.js`).

Coding conventions and patterns to follow
- Modules under `options/scripts/*` generally export functions (ES module style) and mutate DOM only inside options page lifecycle (DOMContentLoaded). Follow existing naming and `init*` patterns.
- Prefer using existing storage keys and message shapes (do not rename keys without coordinating changes in background/popup/content).
- When calling external APIs, reuse `anilist-api.js` patterns: load the `.graphql` query via `chrome.runtime.getURL`, use the same retry/backoff strategy, and preserve the cleaning strategies (`cleanTitle`) for search consistency.
- Keep UI rendering logic in `options/scripts/ui/*` and avoid mixing scraping logic into UI modules.

Files to inspect when making changes
- Entry points: [manifest.json](manifest.json), [background.js](background.js), [content.js](content.js)
- Options UI: [options/options.html](options/options.html), [options/scripts/modules/settings-manager.js](options/scripts/modules/settings-manager.js)
- AniList integration: [options/scripts/core/anilist-api.js](options/scripts/core/anilist-api.js), [options/scripts/core/anilist-query.graphql](options/scripts/core/anilist-query.graphql)
- Popup interactions: [popup/popup.js](popup/popup.js)

When to ask the maintainer
- Any change that renames a `chrome.storage` key, message `type`, or content-script match pattern requires confirmation.
- Add tests or CI: currently none exist—ask before introducing new tooling or complex build steps.

If anything above is unclear or you want more examples (e.g., common storage keys or message payload shapes), say which area and I will add short, concrete examples from the codebase.
