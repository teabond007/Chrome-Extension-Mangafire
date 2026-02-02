import { createApp } from 'vue'
import App from './App.vue'
import '../scripts/lib/anime.min.js'
import { setupDashboardPinia } from './scripts/pinia-setup.js';

// anime.min.js is patched to assign window.anime automatically

const app = createApp(App);
setupDashboardPinia(app);
app.mount('#app');
