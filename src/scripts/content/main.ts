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

// Selector tool - auto-initializes when ?bmh-selector-mode=true is in URL
import './selector-tool';

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

    // Load ALL settings needed by various adapters
    const settingsKeys = [
        'CustomBorderSize',
        'CustomBorderSizefeatureEnabled',
        'CustomBookmarksfeatureEnabled',
        'customBookmarks',
        'customSites',
        'CustomSiteQuickActionsEnabled',
        'CustomSiteHighlightEnabled'
    ];

    try {
        const settings: any = await new Promise(resolve => {
            chrome.storage.local.get(settingsKeys, resolve);
        });

        if (config) {
            // Built-in adapter found
            console.log(`[BMH] Built-in adapter found for ${currentHost}`);
            const platformSettingsKeys = [
                `${config.settingsPrefix}HighlightEnabled`,
                `${config.settingsPrefix}QuickActionsEnabled`,
                `${config.settingsPrefix}ShowProgress`
            ];
            const platformSettings: Record<string, any> = await new Promise(resolve => {
                chrome.storage.local.get(platformSettingsKeys, resolve);
            });
            await config.init({ ...settings, ...platformSettings });
        } else {
            // Try to find a matching custom site configuration
            console.log(`[BMH] No built-in adapter for ${currentHost}, checking custom sites...`);
            const customSites = settings.customSites || [];
            console.log('[BMH] Available custom sites:', customSites.map((s: any) => ({
                hostname: s.hostname,
                enabled: s.enabled,
                selectors: s.selectors
            })));

            const customConfig = customSites.find((s: any) =>
                s.enabled && currentHost.includes(s.hostname)
            );

            if (customConfig) {
                console.log('[BMH] Matched custom config:', customConfig);
                // Use generic adapter for custom site
                const { initCustomSite } = await import('../core/generic-adapter');
                await initCustomSite(customConfig, settings);
            } else {
                console.warn(`[BMH] No adapter found for host: ${currentHost}`);
            }
        }
    } catch (e) {
        console.error(`[BMH] Failed to initialize adapter:`, e);
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
