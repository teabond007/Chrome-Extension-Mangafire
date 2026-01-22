/**
 * Popup Main Entry Point
 * 
 * Initializes the Vue 3 popup application with Pinia store.
 * This is the quick-access panel for the extension.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '@/assets/styles/main.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
