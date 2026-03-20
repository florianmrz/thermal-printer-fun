<template>
  <div class="render-app">
    <RMTest v-if="data._type === 'test'" :data="data" :onReady="setRenderReady" />
  </div>
</template>

<script setup lang="ts">
/**
 * This view is used for rendering content that is to be printed.
 * It is viewed in puppeteer on the server to generate a screenshot that is then printed.
 */
import { renderDataSchema, type RenderData } from '@thermal-printer-fun/shared';
import RMTest from './components/modules/render/RMTest.vue';

const data = parseRenderDataFromWindow();

function parseRenderDataFromWindow(): RenderData {
  let inputData: unknown = window.__RENDER_DATA__;

  if (import.meta.env.DEV) {
    const dataParam = new URLSearchParams(window.location.search).get('data');
    inputData = JSON.parse(atob(dataParam ?? ''));
  }

  if (!inputData) {
    throw new Error(
      'Missing render data on window.__RENDER_DATA__ (production) / "data" query parameter (development)'
    );
  }

  return renderDataSchema.parse(inputData);
}

/**
 * This function sets a global variable that puppeteer waits for before taking a screenshot.
 */
async function setRenderReady() {
  await document.fonts.ready;
  window.__RENDER_READY__ = true;
}
</script>
