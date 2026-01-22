/**
 * New Tab Main Entry Point
 * 
 * Initializes the Vue 3 dashboard application that replaces
 * the browser's new tab page with a manga reading dashboard.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '@/assets/styles/main.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
