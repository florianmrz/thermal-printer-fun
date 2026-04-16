import { createRouter, createWebHistory } from 'vue-router';
import PMCamera from '../components/modules/print/PMCamera.vue';
import PMLargeText from '../components/modules/print/PMLargeText.vue';
import PMSudoku from '../components/modules/print/PMSudoku.vue';
import PMTodoList from '../components/modules/print/PMTodoList.vue';
import PMUpload from '../components/modules/print/PMUpload.vue';
import PMWebsite from '../components/modules/print/PMWebsite.vue';
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
      component: PMUpload,
    },
    {
      path: '/camera',
      name: 'camera',
      component: PMCamera,
    },
    {
      path: '/large-text',
      name: 'large-text',
      component: PMLargeText,
    },
    {
      path: '/sudoku',
      name: 'sudoku',
      component: PMSudoku,
    },
    {
      path: '/todo-list',
      name: 'todo-list',
      component: PMTodoList,
    },
    {
      path: '/website',
      name: 'website',
      component: PMWebsite,
    },
  ],
});

export default router;
