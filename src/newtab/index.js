import { createApp } from 'vue'
import App from './App.vue'
import '../scripts/lib/anime.min.js'

// anime.min.js is patched to assign window.anime automatically

createApp(App).mount('#app')
