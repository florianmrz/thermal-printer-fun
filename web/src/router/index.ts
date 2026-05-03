import { createRouter, createWebHistory } from 'vue-router';
import { printModules } from '../utils/print-modules';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    ...printModules.map(module => ({
      path: `/${module.id}`,
      name: module.id,
      component: module.component,
    })),
  ],
});

export default router;
