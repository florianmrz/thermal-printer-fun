<template>
  <div class="render-app">
    <RMLargeText v-if="data._type === 'large-text'" :data="data" :onReady="setRenderReady" />
  </div>
</template>

<script setup lang="ts">
/**
 * This view is used for rendering content that is to be printed.
 * It is viewed in puppeteer on the server to generate a screenshot that is then printed.
 */
import { type RenderData } from '@thermal-printer-fun/shared';
import RMLargeText from './components/modules/render/RMLargeText.vue';
import { parseRenderData } from './utils/render';

const data = parseRenderDataFromWindow();

function parseRenderDataFromWindow(): RenderData {
  let inputData: unknown = window.__RENDER_DATA__;

  const devDataParam = new URLSearchParams(window.location.search).get('data');
  if (import.meta.env.DEV && devDataParam) {
    inputData = parseRenderData(decodeURIComponent(devDataParam));
  }

  if (!inputData) {
    throw new Error(
      'Missing render data on window.__RENDER_DATA__ (production) / "data" query parameter (development)'
    );
  }

  return inputData as RenderData;
}

/**
 * This function sets a global variable that puppeteer waits for before taking a screenshot.
 */
async function setRenderReady() {
  await document.fonts.ready;
  window.__RENDER_READY__ = true;
}
</script>
