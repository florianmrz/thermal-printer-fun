<template>
  <div class="camera-form">
    <video ref="video"></video>
    <canvas ref="canvas" hidden></canvas>
    <img v-if="capturedImage" :src="capturedImage" alt="Captured Image" />
    <button type="button" @click="startCamera">start camera</button>
    <button type="button" @click="takePicture">take picture</button>
    <p v-if="cameraError">{{ cameraError }}</p>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { reactive, ref, useTemplateRef } from 'vue';

const $video = useTemplateRef('video');
const $canvas = useTemplateRef('canvas');

const cameraError = ref<string | null>(null);
const isStreaming = ref(false);
const videoSize = reactive({ width: 320, height: 0 });
const capturedImage = ref<string | null>(null);

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

      const blob = await new Promise<Blob | null>((resolve) => {
        $canvas.value!.toBlob((blob) => resolve(blob), 'image/png', 1);
      });
      console.log('Captured image blob:', blob);
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
</script>

<style scoped></style>
