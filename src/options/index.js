import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './scripts/ui/preloader.js';
import './options.scss';

import anime from 'animejs'

// Expose anime globally for backward compatibility
window.anime = anime;
console.log('[Options] anime loaded:', typeof window.anime);

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
