/**
 * @fileoverview Webpack Configuration for Content Scripts
 * Bundles content scripts with ES6 imports for Chrome Extension.
 * 
 * Usage:
 *   npm run build       - Production build (minified)
 *   npm run build:dev   - Development build (readable)
 *   npm run watch       - Watch mode for development
 */

const path = require('path');

module.exports = {
    // Multiple entry points for each platform's content script
    entry: {
        'content-asurascans': './scripts/asurascans/content-asurascans.src.js',
        'content-mangafire': './scripts/mangafire/content-mangafire.src.js',
        'content-mangadex': './scripts/mangadex/content-mangadex.src.js',
        'content-webtoons': './scripts/webtoons/content-webtoons.src.js',
        'content-mangaplus': './scripts/mangaplus/content-mangaplus.src.js',
        'content-manganato': './scripts/manganato/content-manganato.src.js'
    },

    output: {
        // Output bundled files to the same directory as source
        filename: (pathData) => {
            const name = pathData.chunk.name;
            // Map output names to their platform directories
            const platformMap = {
                'content-asurascans': 'asurascans',
                'content-mangafire': 'mangafire',
                'content-mangadex': 'mangadex',
                'content-webtoons': 'webtoons',
                'content-mangaplus': 'mangaplus',
                'content-manganato': 'manganato'
            };
            const platform = platformMap[name] || name;
            return `scripts/${platform}/${name}.js`;
        },
        path: path.resolve(__dirname),
        clean: false // Don't clean - we have other files in these directories
    },

    // Optimization settings
    optimization: {
        // Don't create separate runtime chunk for content scripts
        runtimeChunk: false,
        // Don't split chunks - each content script should be self-contained
        splitChunks: false
    },

    // Module resolution
    resolve: {
        extensions: ['.js'],
        alias: {
            '@core': path.resolve(__dirname, 'scripts/core'),
            '@platforms': path.resolve(__dirname, 'scripts/platforms')
        }
    },

    // Development settings
    devtool: 'source-map',

    // Performance hints
    performance: {
        hints: false // Content scripts can be larger than default limits
    },

    // Target web for Chrome extension content scripts
    target: 'web'
};
