/**
 * @fileoverview MangaFire Scraper for Background Operations
 * Handles off-screen scraping of bookmarks and reading history.
 */

import { fetchMangaFromAnilist } from '../../../core/anilist-api';
import { fetchMangaFromMangadex } from '../../../core/mangadex-api';

/**
 * Logs messages via the extension's messaging system.
 */
function Log(txt: string | object) {
    const text = typeof txt === 'object' ? JSON.stringify(txt) : txt;
    if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: 'log', text: `[Scraper] ${text}` });
    }
}

/**
 * Scrapes bookmarks from an unopened tab.
 */
export function scrapeBookmarksFromUnopenedTab(page: number) {
    Log("scrapeBookmarksFromUnopenedTab() called");
    const url = `https://mangafire.to/user/bookmark?page=${page}`;
    Log(`Page URL: ${url}`);

    chrome.tabs.create({ url: url, active: false }, tab => {
        if (!tab.id) return;
        Log(`New tab created with ID: ${tab.id}`);

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [page],
            func: (pageNum: number) => {
                const r = (i: any) => {
                    try {
                        chrome.runtime.sendMessage(i, () => chrome.runtime.lastError);
                    } catch (e) { }
                };

                r({ type: "log", text: "executing script" });
                const bookmarks: any[] = [];
                const container = document.querySelector(".original.card-xs");

                if (!container) {
                    return r({ type: "log", text: "!!!Container not found. Are you logged In Mangafire?" });
                }

                const items = container.querySelectorAll(":scope > div");
                if (items.length === 0) {
                    r({ type: "bookmarksExtracted" });
                    r({ type: "scrapeBookmarks", value: 0 });
                    return;
                }

                items.forEach(item => {
                    const inner = item.querySelector(".inner");
                    if (inner) {
                        const link = inner.querySelector(".info a") as HTMLAnchorElement;
                        const statusBtn = inner.querySelector(".info .dropdown.width-limit.favourite button") as HTMLElement;

                        if (link && statusBtn) {
                            bookmarks.push({
                                title: link.textContent?.trim() || "",
                                status: statusBtn.textContent?.trim() || ""
                            });
                        }
                    }
                });

                r({ type: "log", text: `Scraped ${bookmarks.length} bookmarks` });

                chrome.storage.local.get("userBookmarks", data => {
                    const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
                    const updated = existing.concat(bookmarks);

                    chrome.storage.local.set({ userBookmarks: updated }, () => {
                        r({ type: "bookmarksExtracted" });
                        r({ type: "scrapeBookmarks", value: pageNum + 1 });
                    });
                });
            }
        });
    });
}

/**
 * Scrapes read mangas from an unopened tab.
 */
export function scrapeReadMangasFromUnopenedTab(page: number) {
    Log("scrapeReadMangasFromUnopenedTab() called");
    const url = `https://mangafire.to/user/reading?page=${page}`;
    Log(`Page URL: ${url}`);

    chrome.tabs.create({ url: url, active: false }, tab => {
        if (!tab.id) return;
        Log(`New tab created with ID: ${tab.id}`);

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [page],
            func: (pageNum: number) => {
                const r = (i: any) => {
                    try {
                        chrome.runtime.sendMessage(i, () => chrome.runtime.lastError);
                    } catch (e) { }
                };

                const readMangas: any[] = [];
                const items = document.querySelectorAll(".inner .info");

                if (items.length === 0) {
                    r({ type: "bookmarksExtracted" });
                    r({ type: "scrapeReadMangas", value: 0 });
                    return;
                }

                items.forEach(item => {
                    const link = item.querySelector("a");
                    if (link) {
                        const title = link.textContent?.trim();
                        if (title) {
                            readMangas.push({ title, status: "Read" });
                        }
                    }
                });

                chrome.storage.local.get("userBookmarks", data => {
                    const existing = Array.isArray(data.userBookmarks) ? data.userBookmarks : [];
                    const merged = new Map(readMangas.map(m => [m.title.toLowerCase(), m]));
                    existing.forEach(m => merged.set((m as any).title.toLowerCase(), m));

                    chrome.storage.local.set({ userBookmarks: Array.from(merged.values()) }, () => {
                        r({ type: "bookmarksExtracted" });
                        r({ type: "scrapeReadMangas", value: pageNum + 1 });
                    });
                });
            }
        });
    });
}

/**
 * Handles auto-syncing of a single manga entry.
 */
export async function handleAutoSyncEntry(title: string, chapter: string | number, slugWithId: string, readChapters?: number) {
    Log(`handleAutoSyncEntry called for: ${title} (Ch. ${chapter})`);

    chrome.storage.local.get(["savedEntriesMerged", "savedReadChapters", "SmartAutoCompletefeatureEnabled"], async data => {
        let entries = Array.isArray(data.savedEntriesMerged) ? data.savedEntriesMerged : [];
        const history: Record<string, (string | number)[]> = data.savedReadChapters || {};
        const smartAuto = data.SmartAutoCompletefeatureEnabled || false;

        const slugify = (t: string) => t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const targetSlug = slugWithId ? slugWithId.split(".")[0] : slugify(title);

        // Helper to get read chapter count
        const getReadCount = (entryTitle: string, entrySlug?: string) => {
            if (readChapters) return readChapters;
            const normTitle = entryTitle.toLowerCase();
            const normSlug = entrySlug ? entrySlug.split(".")[0] : null;

            const match = Object.keys(history).find(key => {
                const kLower = key.toLowerCase();
                const kSlug = slugify(key);
                return kLower === normTitle || kSlug === slugify(normTitle) || (normSlug && (kSlug === normSlug || kLower === normSlug));
            });
            return match ? (history[match] as any[]).length : 0;
        };

        const existingIndex = entries.findIndex((e: any) => {
            const eTitle = e.title.toLowerCase();
            const eSlug = e.mangaSlug ? e.mangaSlug.split(".")[0] : slugify(e.title);
            return eTitle === title.toLowerCase() || eSlug === targetSlug;
        });

        if (existingIndex !== -1) {
            let entry = entries[existingIndex];
            entry.lastRead = Date.now();
            entry.lastChapterRead = chapter;
            entry.readChapters = getReadCount(entry.title, entry.mangaSlug);
            if (slugWithId) entry.mangaSlug = slugWithId;
            entry.lastUpdated = Date.now();

            if (slugWithId && chapter) {
                entry.lastMangafireUrl = `https://mangafire.to/read/${slugWithId}/en/chapter-${chapter}`;
            }

            // Smart Auto-Complete logic
            if (smartAuto && entry.anilistData?.chapters) {
                const chNum = parseFloat(String(chapter).replace(/[^\d.]/g, "")) || 0;
                if (entry.anilistData.status === "FINISHED" && chNum >= entry.anilistData.chapters && entry.status !== "Completed") {
                    entry.status = "Completed";
                    Log(`Smart Auto-Complete: Marked ${entry.title} as Completed`);
                }
            }

            chrome.storage.local.set({ savedEntriesMerged: entries });
            return;
        }

        // New entry - fetch metadata
        Log(`No match for ${title}, fetching metadata...`);
        try {
            let meta: any = await fetchMangaFromAnilist(title);
            if (!meta) meta = await fetchMangaFromMangadex(title);

            const newEntry = {
                title: title,
                status: "Reading",
                readChapters: getReadCount(title, slugWithId) || 1,
                lastChapterRead: chapter,
                mangaSlug: slugWithId,
                anilistData: meta || { status: "NOT_FOUND", lastChecked: Date.now(), title: { english: title } },
                lastRead: Date.now(),
                lastUpdated: Date.now(),
                lastMangafireUrl: slugWithId && chapter ? `https://mangafire.to/read/${slugWithId}/en/chapter-${chapter}` : null
            };

            entries.push(newEntry);
            chrome.storage.local.set({ savedEntriesMerged: entries }, () => {
                Log(`Auto-synced new entry: ${title}`);
            });
        } catch (e) {
            Log(`Error auto-syncing ${title}: ${(e as Error).message}`);
        }
    });
}
