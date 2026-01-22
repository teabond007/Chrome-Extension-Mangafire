/**
 * @fileoverview Manganato/MangaKakalot Platform Adapter
 * Implements the PlatformAdapter interface for the Manganato network.
 * 
 * @module platforms/manganato/adapter
 */

import { PlatformAdapter, PlatformRegistry } from '../../core/platform-registry.js';

/**
 * Manganato adapter (covers Manganato, MangaKakalot, Manganelo).
 * @extends PlatformAdapter
 */
export class ManganatoAdapter extends PlatformAdapter {
    static id = 'manganato';
    static name = 'Manganato';
    static icon = '🐯'; // Their logo is generic, but often associated with 'raw' sites
    static color = '#FF5722'; // Orange theme
    static urlPatterns = [
        /manganato\.com/i,
        /mangakakalot\.com/i,
        /manganelo\.com/i,
        /chapmanganato\.to/i,
        /chapmanganato\.com/i
    ];
    static unitName = 'chapter';
    static PREFIX = 'manganato:';

    static selectors = {
        // Listings
        cardContainer: '.panel-content-genres, .daily-update, .truyen-list',
        card: '.content-genres-item, .list-truyen-item-wrap, .sh',
        cardTitle: 'h3 a, a.genres-item-name',
        cardLink: 'h3 a, a.genres-item-name',
        cardCover: 'img',
        
        // Reader
        readerContainer: '.container-chapter-reader',
        readerImage: 'img'
    };

    /**
     * Extract data from card.
     */
    static extractCardData(cardElement) {
        const linkEl = cardElement.querySelector('h3 a, a.genres-item-name, a[title]');
        const imgEl = cardElement.querySelector('img');

        let title = linkEl ? (linkEl.getAttribute('title') || linkEl.textContent.trim()) : '';
        let url = linkEl ? linkEl.href : '';
        let coverUrl = imgEl ? imgEl.src : '';
        
        // Manganato URLs: https://manganato.com/manga-ab123456
        const slug = this.extractSlug(url);

        return {
            id: slug,
            title,
            slug,
            url,
            coverUrl
        };
    }

    static extractSlug(url) {
        try {
            const path = new URL(url).pathname;
            // Remove leading slash
            return path.replace(/^\//, '');
        } catch (e) {
            return '';
        }
    }

    /**
     * Parse URL.
     */
    static parseUrl(url) {
        const urlObj = new URL(url);
        const path = urlObj.pathname.substring(1); // remove leading /

        // Reader: /chapter-123 (often subdomain chapmanganato)
        // Format: /manga-id/chapter-id
        if (path.includes('chapter-')) {
            const parts = path.split('/');
            // detection logic for chapter vs manga page
            // usually /manga-id/chapter-id
            if (parts.length >= 2) {
                return {
                    type: 'reader',
                    id: parts[0],
                    slug: parts[0],
                    chapterNo: parts[1].replace('chapter-', '')
                };
            }
        }

        // Manga Info: /manga-ab123456
        if (path.startsWith('manga-')) {
            return {
                type: 'manga',
                id: path,
                slug: path,
                chapterNo: null
            };
        }

        return {
            type: 'listing',
            id: '',
            slug: '',
            chapterNo: null
        };
    }

    static applyBorder(element, color, size, style) {
        const target = element; // The card container itself is usually good
        target.style.setProperty('border', `${size}px ${style} ${color}`, 'important');
        target.style.setProperty('border-radius', '5px', 'important');
    }
}

PlatformRegistry.register(ManganatoAdapter);
export default ManganatoAdapter;
