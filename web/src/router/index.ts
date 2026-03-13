import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import PrintView from '../views/PrintView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/print',
      children: [
        {
          path: '',
          name: 'print',
          redirect: (_to, _from) => {
            // Redirect to camera view on mobile
            const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
            return isMobile ? { name: 'print-camera' } : { name: 'print-upload' };
          },
        },
        {
          path: 'upload',
          name: 'print-upload',
          component: PrintView,
        },
        {
          path: 'camera',
          name: 'print-camera',
          component: PrintView,
        },
      ],
    },
  ],
});

export default router;
