<template>
  <canvas
    ref="canvasRef"
    class="base-dithered-image"
    :width="props.size"
    :height="props.size"
    :style="{
      width: `${props.size}px`,
      height: `${props.size}px`,
    }" />
</template>

<script setup lang="ts">
/**
 * A Vue component that renders a dithered version of an image using the Floyd-Steinberg algorithm.
 *
 * Good prompt for generating images for this component:
 * ```
 * A play-doh style render of a [object], white background.
 * Create a simple, high-contrast image with clear shapes and minimal details, suitable for dithering. The image should have distinct areas of black and white, with minimal grayscale, to ensure that the dithering process produces a visually appealing result. Avoid intricate patterns or fine details, as they may not translate well when dithered.
 * ```
 */

import { floydSteinberg } from '@thermal-printer-fun/shared';
import { onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    src: string;
    size?: number;
  }>(),
  {
    size: 128,
  }
);

const canvasRef = ref<HTMLCanvasElement | null>(null);

function clampByte(value: number): number {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value;
}

let renderToken = 0;

async function render(): Promise<void> {
  console.log('Rendering dithered image with src:', props.src);
  const canvas = canvasRef.value;
  if (!canvas) return;

  const source = props.src;

  const token = ++renderToken;
  const targetSize = Math.max(1, Math.round(props.size));

  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const image = new Image();
  image.decoding = 'async';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image from ${source}`));
    image.src = source;
  }).catch(() => {
    // Keep canvas empty if the image fails to load.
  });

  if (token !== renderToken || image.width === 0 || image.height === 0) {
    return;
  }

  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, targetSize, targetSize);

  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  const grayscale = new Uint8Array(targetSize * targetSize);

  for (let i = 0; i < grayscale.length; i++) {
    const pixelIndex = i * 4;
    const gray = imageData.data[pixelIndex] ?? 0;

    grayscale[i] = clampByte(Math.round(gray));
  }

  const dithered = floydSteinberg({
    data: grayscale,
    width: targetSize,
    height: targetSize,
  });

  for (let i = 0; i < dithered.length; i++) {
    const pixelIndex = i * 4;
    const ditheredGray = dithered[i] ?? 0;
    const alpha = imageData.data[pixelIndex + 3] ?? 0;

    imageData.data[pixelIndex] = ditheredGray;
    imageData.data[pixelIndex + 1] = ditheredGray;
    imageData.data[pixelIndex + 2] = ditheredGray;
    imageData.data[pixelIndex + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);
}

onMounted(() => {
  void render();
});

watch(
  () => [props.size, props.src],
  () => {
    void render();
  },
  { immediate: true }
);
</script>

<style lang="scss" src="./BaseDitheredImage.scss" scoped />
