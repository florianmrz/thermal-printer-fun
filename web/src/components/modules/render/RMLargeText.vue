<template>
  <div class="rm-large-text">
    <div class="canvas">
      <p ref="textRef" class="text">{{ props.data.input }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataLargeText } from '@thermal-printer-fun/shared';
import { nextTick, onMounted, ref } from 'vue';
import type { RenderModuleProps } from './types';

const CANVAS_SIZE = 576;
const MIN_FONT_SIZE = 12;

const props = defineProps<RenderModuleProps<RenderDataLargeText>>();
const textRef = ref<HTMLElement | null>(null);

function fitTextToCanvas() {
  const textElement = textRef.value;

  if (!textElement) {
    return;
  }

  let fontSize = CANVAS_SIZE;
  textElement.style.fontSize = `${fontSize}px`;

  while (fontSize > MIN_FONT_SIZE && textElement.scrollWidth > CANVAS_SIZE) {
    fontSize -= 2;
    textElement.style.fontSize = `${fontSize}px`;
  }
}

onMounted(async () => {
  await nextTick();
  fitTextToCanvas();
  props.onReady();
});
</script>

<style lang="scss" src="./RMLargeText.scss" scoped />
