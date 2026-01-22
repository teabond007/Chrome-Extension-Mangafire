/**
 * Options Main Entry Point
 * 
 * Initializes the Vue 3 options/settings application.
 * This is the full settings panel accessible via extension menu.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
// import '@/assets/styles/main.scss'; // Disabled for Legacy UI Restoration

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
