/**
 * @fileoverview MangaPlus Platform Adapter
 * Implements the PlatformAdapter interface for MangaPlus by Shueisha.
 * 
 * @module platforms/mangaplus/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * MangaPlus adapter.
 * Handles the Official Shueisha SPA.
 * @extends PlatformAdapter
 */
export class MangaPlusAdapter extends PlatformAdapter {
    static id = 'mangaplus';
    static name = 'MangaPlus';
    static icon = '🔴'; // Shueisha Red
    static color = '#E60012'; // Official Brand Red
    static urlPatterns = [
        /mangaplus\.shueisha\.co\.jp/i
    ];
    static unitName = 'chapter';
    static PREFIX = 'mp:';

    /**
     * DOM selectors for MangaPlus.
     * Note: MangaPlus uses obfuscated/dynamic classes (styled-components),
     * so we rely on structural and attribute selectors.
     */
    static selectors = {
        // Find links to titles
        cardContainer: 'div[class*="TitleList"]',
        card: 'a[href*="/titles/"]', 
        cardTitle: 'h3, div[class*="TitleName"]', // Usually a header inside the link
        cardLink: 'a[href*="/titles/"]',
        cardCover: 'img',
        
        // Reader is complex/canvas, typically usually handled by URL observer
        readerContainer: 'body', 
        readerImage: 'canvas' // Often canvas based
    };

    /**
     * Extract data from a MangaPlus card.
     * @param {HTMLElement} cardElement - The anchor element itself usually.
     * @returns {{id: string, title: string, slug: string, url: string, coverUrl: string}}
     */
    static extractCardData(cardElement) {
        // cardElement is usually the <a> tag itself in our selector strategy
        const url = cardElement.href;
        const id = this.extractId(url);
        
        // Title is often inside an H3 or div inside the A tag
        const titleEl = cardElement.querySelector('h3, div[class*="TitleName"], p');
        const title = titleEl ? titleEl.textContent.trim() : '';

        const imgEl = cardElement.querySelector('img');
        const coverUrl = imgEl ? imgEl.src : '';

        // MangaPlus doesn't use slugs in URL, just IDs. 
        // We'll use the ID as the slug for consistency in our system.
        const slug = id; 

        return {
            id,
            title,
            slug,
            url,
            coverUrl
        };
    }

    /**
     * Extract ID from URL (e.g., /titles/100020 -> 100020)
     */
    static extractId(url) {
        const match = url.match(/\/titles\/(\d+)/);
        return match ? match[1] : '';
    }

    /**
     * Parse MangaPlus URL.
     * @param {string} url 
     */
    static parseUrl(url) {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        // Series Page: /titles/100020
        const titleMatch = path.match(/\/titles\/(\d+)/);
        if (titleMatch) {
            return {
                type: 'manga',
                id: titleMatch[1],
                slug: titleMatch[1],
                chapterNo: null
            };
        }

        // Reader Page: /viewer/100020
        // NOTE: The ID here is the CHAPTER ID, not the Manga ID.
        // We cannot easily get the Manga ID from the URL alone on the viewer page.
        // We often have to scrape the "Title Link" from the header if available,
        // or rely on a "Back to series" button.
        const viewerMatch = path.match(/\/viewer\/(\d+)/);
        if (viewerMatch) {
            return {
                type: 'reader',
                id: '', // Unknown from URL alone
                slug: '', // Unknown from URL alone
                chapterNo: viewerMatch[1] // Use ChapterID as number for now, though it's internal
                // TODO: In content script, we must look at DOM to find real Chapter Number and Series Title
            };
        }

        return {
            type: 'listing',
            id: '',
            slug: '',
            chapterNo: null
        };
    }

    /**
     * Custom Border for MangaPlus.
     * The card is an <a> tag, usually holding an image and text.
     * Bordering the <a> tag usually works well.
     */
    static applyBorder(element, color, size, style) {
        // Check if it's the "Featured" large banner or a regular card
        // Often simpler to border the image container if possible
        const imgContainer = element.querySelector('div[class*="Cover"]');
        const target = imgContainer || element;

        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('border-radius', '4px', 'important');
    }
}

PlatformRegistry.register(MangaPlusAdapter);
export default MangaPlusAdapter;
