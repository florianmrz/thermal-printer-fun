import { createRouter, createWebHistory } from 'vue-router';
import LMLargeText from '../components/modules/large-text/LMLargeText.vue';
import CameraForm from '../components/modules/print/PMCamera.vue';
import UploadForm from '../components/modules/print/PMUpload.vue';
import TMTest from '../components/modules/test/TMTest.vue';
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
      path: '/upload',
      name: 'upload',
      component: UploadForm,
    },
    {
      path: '/camera',
      name: 'camera',
      component: CameraForm,
    },
    {
      path: '/test',
      name: 'test',
      component: TMTest,
    },
    {
      path: '/large-text',
      name: 'large-text',
      component: LMLargeText,
    },
  ],
});

export default router;
