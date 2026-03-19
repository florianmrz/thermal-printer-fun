import './assets/styles/global.scss';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import RenderApp from './RenderApp.vue';

if (window.location.pathname === '/render') {
  createApp(RenderApp).mount('#app');
} else {
  createApp(App).use(router).mount('#app');
}
