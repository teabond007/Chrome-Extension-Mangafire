import { createApp } from 'vue'
import App from './App.vue'
import { setupPopupPinia } from './scripts/pinia-setup.js';

const app = createApp(App);
setupPopupPinia(app);
app.mount('#app');
