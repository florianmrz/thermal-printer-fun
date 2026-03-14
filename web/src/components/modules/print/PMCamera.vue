<template>
  <PrintView>
    <form class="pm-camera" @submit="handleSubmit">
      <div class="video-container">
        <BaseIcon v-if="!isStreaming" icon="account-box" size="large" />
        <BaseButton v-if="!isStreaming" type="button" @click="startCamera">Start camera</BaseButton>
        <video ref="video" class="video" :hidden="!isStreaming"></video>
        <img v-if="imageSrc" class="captured-image" :src="imageSrc" alt="Captured Image" />
      </div>
      <canvas ref="canvas" hidden></canvas>
      <BaseButton v-if="isStreaming && !file" type="button" @click="takePicture">Take picture</BaseButton>
      <p v-if="cameraError">{{ cameraError }}</p>

      <div class="actions-container">
        <BaseButton v-if="file" variant="outlined" type="button" @click="file = null">Cancel</BaseButton>
        <BaseButton v-if="file" type="submit">Print</BaseButton>
      </div>
    </form>
  </PrintView>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { computed, reactive, ref, useTemplateRef } from 'vue';
import { submitImagePrint } from '../../../utils/api';
import PrintView from '../../../views/PrintView.vue';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseIcon from '../../base/BaseIcon/BaseIcon.vue';

const $video = useTemplateRef('video');
const $canvas = useTemplateRef('canvas');

const cameraError = ref<string | null>(null);
const isStreaming = ref(false);
const videoSize = reactive({ width: 320, height: 0 });
const file = ref<File | null>(null);

const imageSrc = computed(() => (file.value ? URL.createObjectURL(file.value) : null));

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
