<template>
  <PrintView>
    <form class="pm-camera" @submit="handleSubmit">
      <video ref="video"></video>
      <canvas ref="canvas" hidden></canvas>
      <img v-if="capturedImage" :src="capturedImage" alt="Captured Image" />
      <button type="button" @click="startCamera">start camera</button>
      <button type="button" @click="takePicture">take picture</button>
      <p v-if="cameraError">{{ cameraError }}</p>
      <button type="submit">Print</button>
    </form>
  </PrintView>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { reactive, ref, useTemplateRef } from 'vue';
import { submitImagePrint } from '../../../utils/api';
import PrintView from '../../../views/PrintView.vue';

const $video = useTemplateRef('video');
const $canvas = useTemplateRef('canvas');

const cameraError = ref<string | null>(null);
const isStreaming = ref(false);
const videoSize = reactive({ width: 320, height: 0 });
const capturedImage = ref<string | null>(null);
const file = ref<File | null>(null);

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    if ($video.value) {
      $video.value.srcObject = stream;
      $video.value.play();
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    cameraError.value = `Error accessing camera: ${(error as Error).message}`;
  }
}

async function takePicture() {
  if ($video.value && $canvas.value) {
    const context = $canvas.value.getContext('2d');
    if (context) {
      context.drawImage($video.value, 0, 0, videoSize.width, videoSize.height);
      const dataUrl = $canvas.value.toDataURL('image/png');
      capturedImage.value = dataUrl;

      const blob = await new Promise<Blob | null>(resolve => {
        $canvas.value!.toBlob(blob => resolve(blob), 'image/png', 1);
      });
      if (blob) {
        file.value = new File([blob], 'captured-image.png', { type: 'image/png' });
      }
    }
  }
}

useEventListener($video, 'canplay', () => {
  console.log('Video can play', $video.value, $canvas.value);
  if (!isStreaming.value && $video.value && $canvas.value) {
    videoSize.height = $video.value.videoHeight / ($video.value.videoWidth / videoSize.width);

    $video.value.setAttribute('width', videoSize.width.toString());
    $video.value.setAttribute('height', videoSize.height.toString());
    $canvas.value.setAttribute('width', videoSize.width.toString());
    $canvas.value.setAttribute('height', videoSize.height.toString());
    isStreaming.value = true;
  }
});

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault();

  if (!file.value) {
    return;
  }

  await submitImagePrint(file.value);
}
</script>

<style lang="scss" src="./PMCamera.scss" scoped />
