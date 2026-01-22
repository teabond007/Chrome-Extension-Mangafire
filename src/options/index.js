import { createApp } from 'vue'
import App from './App.vue'
import './scripts/core/preloader.js'
import anime from 'animejs'

// Expose anime globally for backward compatibility
window.anime = anime;
console.log('[Options] anime loaded:', typeof window.anime);

createApp(App).mount('#app')
