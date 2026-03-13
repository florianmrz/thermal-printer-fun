import { createRouter, createWebHistory } from 'vue-router';
import CameraForm from '../components/modules/print/PMCamera.vue';
import UploadForm from '../components/modules/print/PMUpload.vue';
import HomeView from '../views/HomeView.vue';

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
          component: UploadForm,
        },
        {
          path: 'camera',
          name: 'print-camera',
          component: CameraForm,
        },
      ],
    },
  ],
});

export default router;
