import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './scripts/ui/preloader.js';
import './options.scss';

console.log('[Options] Options script loaded');

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
