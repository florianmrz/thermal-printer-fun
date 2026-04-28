import './assets/styles/global.scss';

import { createApp } from 'vue';
import i18n from './i18n';
import RenderApp from './RenderApp.vue';

createApp(RenderApp).use(i18n).mount('#app');
