import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader(), vueDevTools()],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
});
