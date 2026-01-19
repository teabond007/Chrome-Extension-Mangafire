# Webtoons.com Support Implementation Plan

## Overview
Add support for webtoons.com to the Bookmarks Marker/Highlighter Chrome Extension. This includes border highlighting for saved webtoons and chapter reading history tracking.

---

## ✅ Confirmed Decisions

| Decision | Choice |
|----------|--------|
| **Separate Settings** | Yes - dedicated on/off toggle + border thickness for webtoons |
| **Episode Namespace** | Yes - use `webtoon:` prefix (e.g., `webtoon:solo-leveling`) |
| **Cross-Platform Matching** | Yes - goal is to link webtoons with manga equivalents |
| **Auto-Sync/Scraping** | **NO** - prohibited by Webtoons ToS Section 6.b.iii |

### ToS Compliance Note
Webtoons ToS Section 6.b.iii explicitly prohibits:
> "engage in unauthorized 'crawling,' 'scraping,' or harvesting of content or personal information"

**What we CAN do (personal use enhancement):**
- Read DOM elements on pages the user actively views
- Track reading history locally on user's device
- Apply visual styling (borders) to current page
- Cross-reference with user's own saved bookmarks

**What we CANNOT do:**
- Automated scraping of bookmark/subscription lists
- Background crawling of Webtoons pages
- Harvesting content or building databases

---

## Research Summary

### Webtoons.com Structure Analysis

#### URL Patterns
- **Homepage**: `https://www.webtoons.com` or `https://www.webtoons.com/en/`
- **Originals Page**: `https://www.webtoons.com/en/originals`
- **Canvas Page**: `https://www.webtoons.com/en/canvas`
- **Series List Page**: `https://www.webtoons.com/en/{genre}/{slug}/list?title_no={id}`
  - Example: `https://www.webtoons.com/en/action/all-class-awakening-god-slayer/list?title_no=9467`
- **Viewer/Reader Page**: `https://www.webtoons.com/en/{genre}/{slug}/{episode-name}/viewer?title_no={id}&episode_no={num}`
  - Example: `https://www.webtoons.com/en/action/all-class-awakening-god-slayer/episode-4/viewer?title_no=9467&episode_no=4`

#### Key DOM Selectors

| Section | Container Selector | Card Selector | Title Selector |
|---------|-------------------|---------------|----------------|
| Homepage Trending | `.trending_area` | `a.link._trending_title_a` | `strong` inside card |
| Originals Daily | `.daily_section` | `a.link._originals_title_a` | `strong` inside card |
| Canvas Page | `.daily_section` | `a.link._canvas_title_a` | `strong` inside card |
| Series List Page | `ul#_listUl` | `li` elements | `h1.subj` (page title) |
| Viewer Page | `div#_container` | N/A | `div.viewer_header a.subj` |

#### Chapter/Episode Extraction
- **From URL**: `episode_no` query parameter is the most reliable source
- **From DOM**: `span.tx` for episode title text, `span.tx_num` for episode number

---

## Implementation Tasks

### Phase 1: Core Content Script (Priority: HIGH)

#### 1.1 Create `content-webtoons.js`
**File**: `scripts/webtoons/content-webtoons.js`

```javascript
// Core functionality:
// - Extract webtoon cards from all page types
// - Cross-reference with saved bookmarks
// - Apply border highlighting
// - Track reading history on viewer pages
```

**Key Functions**:
| Function | Purpose |
|----------|---------|
| `findWebtoonCards()` | Detect cards across homepage, daily grids, and canvas |
| `extractWebtoonInfo(card)` | Get title, slug, and title_no from card |
| `crossReferenceBookmarks()` | Match page webtoons with saved entries |
| `applyBorders()` | Apply colored borders based on status |
| `getReadEpisodes()` | Track current episode on viewer pages |
| `cleanUrlToWebtoonInfo()` | Parse viewer URL for title/episode info |

#### 1.2 Update `manifest.json`
**Changes Required**:
- Add `*://www.webtoons.com/*` to `content_scripts.matches`
- Add new content script entry for webtoons
- Add host permissions if needed for API access

### Phase 2: History Tracking (Priority: HIGH)

#### 2.1 Episode Reading History
**Storage Structure**:
```javascript
// savedReadChapters will store webtoon episodes:
{
  "solo-leveling": ["1", "2", "3", "10"],
  "webtoon:all-class-awakening-god-slayer": ["1", "2", "3", "4"]
}
```

**Note**: Using `webtoon:` prefix to namespace webtoons separately from manga if needed.

#### 2.2 Auto-Sync Entry Updates
- Send `autoSyncEntry` message to background script on episode read
- Include: title, episode number, slug, read count

### Phase 3: Settings & Toggle (Priority: MEDIUM)

#### 3.1 Add Webtoons Toggle to Options
**File**: `options/options.html` - Add toggle in Features section

```html
<div class="toggle-row">
  <span class="toggle-label">Webtoons Highlighting</span>
  <label class="switch">
    <input type="checkbox" id="WebtoonsHighlight">
    <span class="slider"></span>
  </label>
</div>
```

#### 3.2 Update Feature Toggles Module
**File**: `options/scripts/modules/feature-toggles.js`
- Add `{ id: "WebtoonsHighlight", storageKey: "WebtoonsHighlightfeatureEnabled" }`

#### 3.3 Update Popup
**File**: `popup/popup.js`
- Add Webtoons toggle to quick settings

---

## Bonus Features & Ideas

### Feature 1: Series Follow Integration (Future)
**Description**: Detect if user is logged into Webtoons and sync their "Subscribed" series
- Could show which series they're subscribed to
- Mark as "Following" status in library

### Feature 2: New Episode Indicators
**Description**: Show a badge when a webtoon has new episodes since last read
- Compare `episode_no` with stored `lastReadEpisode`
- Display "NEW" badge on cards with unread episodes

### Feature 3: Progress Badge on Cards
**Description**: Similar to MangaDex, show "Ep. X/Y" on webtoon cards
- Extract total episodes from series page if possible
- Show current progress relative to total

### Feature 4: Daily Updates Section
**Description**: On the extension's new tab dashboard, show "Today's Updates" from Webtoons
- Parse the daily originals page for the current day
- Display inline with manga updates

### Feature 5: Cross-Platform Title Matching
**Description**: Match webtoons with their manga equivalents
- Many webtoons are adaptations of novels/manga on MangaFire/MangaDex
- Link entries across platforms for unified tracking

### Feature 6: Custom Webtoons Border Colors
**Description**: Allow different default colors for webtoons vs manga
- Users might want to visually distinguish manga from webtoons
- Add optional "Webtoons Accent Color" setting

---

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `scripts/webtoons/content-webtoons.js` | Main content script for webtoons.com |

### Modified Files
| File | Changes |
|------|---------|
| `manifest.json` | Add webtoons content script and host permissions |
| `options/options.html` | Add Webtoons toggle switch |
| `options/scripts/modules/feature-toggles.js` | Add Webtoons toggle handler |
| `popup/popup.js` | Add Webtoons quick toggle |
| `options/scripts/modules/import-export.js` | Include Webtoons settings in export |

---

## Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `WebtoonsHighlightfeatureEnabled` | boolean | Master toggle for webtoons support |
| `WebtoonsShowProgress` | boolean | Show episode badges on cards |
| `WebtoonsBorderSizefeatureEnabled` | boolean | Enable custom border size |
| `WebtoonsBorderSize` | number | Border thickness in px (1-10) |
| `savedReadChapters` | object | Extended to include `webtoon:` namespaced entries |

---

## Implementation Order

1. ✅ **Phase 1.1** - Create basic `content-webtoons.js` with card detection
2. ✅ **Phase 1.2** - Update `manifest.json` to inject script
3. ✅ **Phase 2.1** - Add episode tracking on viewer pages
4. ✅ **Phase 2.2** - Integrate with auto-sync messaging
5. ✅ **Phase 3.1** - Add UI toggles to options.html
6. ✅ **Phase 3.2** - Update feature-toggles.js
7. ✅ **Phase 3.3** - Update popup.js
8. ✅ **Phase 3.4** - Add appearance-manager.js slider handler
9. ✅ **Phase 3.5** - Update import-export.js
10. 🔲 **Testing** - Verify on all webtoons page types

---

## Technical Notes

### SPA Navigation Handling
Webtoons uses React and client-side routing. The content script must:
- Use `MutationObserver` to detect DOM changes
- Watch for URL changes for SPA navigation
- Re-apply borders when new cards are loaded

### Rate Limiting Considerations
- Webtoons doesn't have a public API for series data
- All data must be scraped from DOM
- No external API calls needed (unlike AniList/MangaDex for metadata)

### Title Normalization
Webtoons titles may differ from MangaFire/MangaDex versions:
- Remove special characters for matching
- Handle case-insensitive comparison
- Consider using fuzzy matching for cross-platform linking

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Content Script | 2-3 hours |
| Manifest Updates | 15 min |
| History Tracking | 1 hour |
| Settings UI | 30 min |
| Testing & Polish | 1-2 hours |
| **Total** | **~5-7 hours** |

---

## Questions/Decisions Needed

1. **Namespace episodes?** Should webtoon episodes use a prefix like `webtoon:title` to avoid collision with manga chapters?
2. **Cross-platform matching?** Want to link webtoons to their MangaFire equivalents automatically?
3. **Different border styling?** Distinct visual treatment for webtoons vs manga?
4. **Priority of bonus features?** Which bonus features to implement in v1?
