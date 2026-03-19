<template>
  <div class="render-app">
    <RMTest v-if="data?._type === 'test'" :data="data" />
    <template v-else>
      <p>Invalid data</p>
      <pre><code>{{ JSON.stringify(data, null, 2)  }}</code></pre>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * This view is used for rendering content that is to be printed.
 * It is viewed in puppeteer on the server to generate a screenshot that is then printed.
 */
import type { RenderData } from '../../shared/types';
import RMTest from './components/modules/render/RMTest.vue';

const data = parseDataFromUrl();

function parseDataFromUrl(): RenderData | null {
  try {
    const dataParam = new URLSearchParams(window.location.search).get('data');
    if (!dataParam) {
      console.warn('No data parameter found in URL');
      return null;
    }
    return JSON.parse(window.atob(dataParam)) as RenderData;
  } catch (error) {
    console.error('Error parsing data from URL:', error);
    return null;
  }
}
</script>
