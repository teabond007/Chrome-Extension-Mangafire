/**
 * Vite Configuration for Chrome Extension with Vue 3
 * 
 * This configuration handles:
 * - Vue 3 SFC compilation
 * - Chrome Extension Manifest V3 via CRXJS plugin
 * - Multiple entry points (popup, options, newtab)
 * - Content script handling
 * - Hot Module Replacement during development
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './src/manifest.json';

export default defineConfig({
    root: resolve(__dirname, 'src'),
    plugins: [
        vue(),
        crx({ manifest })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@core': resolve(__dirname, 'src/core'),
            '@components': resolve(__dirname, 'src/components'),
            '@composables': resolve(__dirname, 'src/composables'),
            '@assets': resolve(__dirname, 'src/assets')
        }
    },
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyDirBeforeWrite: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'src/popup/index.html'),
                options: resolve(__dirname, 'src/options/index.html'),
                newtab: resolve(__dirname, 'src/newtab/index.html')
            }
        }
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173
        }
    }
});
