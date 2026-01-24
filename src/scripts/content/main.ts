/**
 * @fileoverview Unified Content Script Entry Point
 * Detects the current platform and initializes the appropriate adapter.
 */

import { initMangaFire } from './adapters/mangafire';
import { initAsura } from './adapters/asurascans';
import { initMangaDex } from './adapters/mangadex';
import { initManganato } from './adapters/manganato';
import { initMangaPlus } from './adapters/mangaplus';
import { initWebtoons } from './adapters/webtoons';

const ADAPTER_CONFIGS: any = [
    {
        hosts: ['mangafire.to'],
        init: initMangaFire,
        settingsPrefix: 'MangaFire'
    },
    {
        hosts: ['asuracomic.net', 'asurascans.com', 'asuratoon.com'],
        init: initAsura,
        settingsPrefix: 'AsuraScans'
    },
    {
        hosts: ['mangadex.org'],
        init: initMangaDex,
        settingsPrefix: 'MangaDex'
    },
    {
        hosts: ['manganato.com', 'chapmanganato.com'],
        init: initManganato,
        settingsPrefix: 'Manganato'
    },
    {
        hosts: ['mangaplus.shueisha.co.jp'],
        init: initMangaPlus,
        settingsPrefix: 'MangaPlus'
    },
    {
        hosts: ['www.webtoons.com', 'webtoons.com'],
        init: initWebtoons,
        settingsPrefix: 'Webtoons'
    }
];

async function bootstrap() {
    if (!chrome.runtime?.id) return;

    const currentHost = window.location.hostname;
    const config = ADAPTER_CONFIGS.find((c: any) =>
        c.hosts.some((h: string) => currentHost.includes(h))
    );

    if (!config) {
        console.warn(`[BMH] No adapter found for host: ${currentHost}`);
        return;
    }

    // Load ALL settings needed by various adapters
    const settingsKeys = [
        'CustomBorderSize',
        'CustomBorderSizefeatureEnabled',
        'CustomBookmarksfeatureEnabled',
        'customBookmarks',
        `${config.settingsPrefix}HighlightEnabled`,
        `${config.settingsPrefix}QuickActionsEnabled`,
        `${config.settingsPrefix}ShowProgress`
    ];

    try {
        const settings = await new Promise(resolve => {
            chrome.storage.local.get(settingsKeys, resolve);
        });

        // Initialize the platform
        await config.init(settings);

    } catch (e) {
        console.error(`[BMH] Failed to initialize adapter for ${config.settingsPrefix}:`, e);
    }
}

// Robust execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

window.addEventListener('load', () => {
    // Second pass for late-loading elements
    setTimeout(bootstrap, 500);
});
