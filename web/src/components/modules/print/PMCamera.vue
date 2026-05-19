<template>
  <section class="pm-camera print-module">
    <PMItemHeader moduleId="camera" />

    <form class="form" @submit="handleSubmit">
      <div class="video-container" :class="{ 'is-streaming': isStreaming }">
        <template v-if="!isStreaming">
          <BaseButton type="button" @click="() => startCamera()">Start camera</BaseButton>
        </template>

        <video ref="video" class="video" :class="{ 'is-mirrored': isFrontCamera }" :hidden="!isStreaming"></video>

        <img v-if="previewSrc" class="captured-image" :src="previewSrc" alt="Captured Image" />

        <p class="error" v-if="cameraError">{{ cameraError }}</p>

        <BaseButton
          v-if="isStreaming && canToggleCamera && !file"
          class="toggle-camera-button"
          type="button"
          @click="toggleCamera"
          iconOnly>
          <BaseIcon icon="reload" />
        </BaseButton>

        <BaseButton v-if="isStreaming && !file" class="photo-button" type="button" @click="takePicture" size="large"
          >Take picture</BaseButton
        >
      </div>

      <canvas ref="canvas" hidden></canvas>

      <div class="actions-container" v-if="file">
        <BaseButton variant="outlined" type="button" @click="handleOnCancel">Cancel</BaseButton>
        <span class="error-message" v-if="submitError">{{ submitError }}</span>
        <BaseButton type="submit" :loading="isSubmitting">Print</BaseButton>
      </div>
    </form>

    <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
  </section>
</template>

<script setup lang="ts">
import type { PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { useEventListener } from '@vueuse/core';
import { computed, onBeforeUnmount, reactive, ref, useTemplateRef } from 'vue';
import { getApiErrorMessage, submitImagePrint } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseIcon from '../../base/BaseIcon/BaseIcon.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';

const $video = useTemplateRef('video');
const $canvas = useTemplateRef('canvas');

const cameraError = ref<string | null>(null);
const videoSize = reactive({ width: 320, height: 0 });
const file = ref<File | null>(null);
const isSubmitting = ref(false);
const submitResponse = ref<PrintSubmitResponse | null>(null);
const submitError = ref<string | null>(null);
const currentStream = ref<MediaStream | null>(null);
const availableVideoDevices = ref<MediaDeviceInfo[]>([]);
const canToggleCamera = computed(
  () => availableVideoDevices.value.filter(device => device.kind === 'videoinput').length > 1
);
const isStreaming = computed(() => !!currentStream.value);
const isFrontCamera = computed(() => {
  const videoTrack = currentStream.value?.getVideoTracks()[0];
  return videoTrack?.getSettings().facingMode === 'user';
});
const previewSrc = computed(() => (file.value ? URL.createObjectURL(file.value) : null));

async function startCamera(deviceId?: string) {
  cameraError.value = null;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableVideoDevices.value = devices.filter(device => device.kind === 'videoinput');

    const videoConstraints: MediaTrackConstraints | boolean = deviceId ? { deviceId: { exact: deviceId } } : true;
    currentStream.value = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    if ($video.value) {
      $video.value.srcObject = currentStream.value;
      $video.value.play();
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    cameraError.value = `Camera error: ${(error as Error).message}`;
  }
}

async function toggleCamera() {
  const currentVideoDeviceId = currentStream.value?.getVideoTracks()[0]?.getSettings().deviceId ?? null;
  let nextDeviceId: string | undefined;
  availableVideoDevices.value.forEach((device, index) => {
    if (device.deviceId === currentVideoDeviceId) {
      nextDeviceId = availableVideoDevices.value[index + 1]?.deviceId;
    }
  });
  await startCamera(nextDeviceId);
}

async function takePicture() {
  if ($video.value && $canvas.value) {
    const context = $canvas.value.getContext('2d');
    if (context) {
      context.save();
      if (isFrontCamera.value) {
        context.translate(videoSize.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage($video.value, 0, 0, videoSize.width, videoSize.height);
      context.restore();
      const blob = await new Promise<Blob | null>(resolve => {
        $canvas.value!.toBlob(blob => resolve(blob), 'image/png', 1);
      });
      if (blob) {
        file.value = new File([blob], 'captured-image.png', { type: 'image/png' });
      }
    }
  }
}

async function handleOnCancel() {
  file.value = null;
}

useEventListener($video, 'canplay', () => {
  if ($video.value && $canvas.value) {
    videoSize.height = $video.value.videoHeight / ($video.value.videoWidth / videoSize.width);

    $video.value.setAttribute('width', videoSize.width.toString());
    $video.value.setAttribute('height', videoSize.height.toString());
    $canvas.value.setAttribute('width', videoSize.width.toString());
    $canvas.value.setAttribute('height', videoSize.height.toString());
  }
});

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault();

  if (!file.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  try {
    submitResponse.value = await submitImagePrint(file.value);
    submitError.value = null;
  } catch (error) {
    submitError.value = getApiErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}

onBeforeUnmount(() => {
  if (currentStream.value) {
    currentStream.value.getTracks().forEach(track => track.stop());
  }
});
</script>

<style lang="scss" src="./_print.scss" scoped />
<style lang="scss" src="./PMCamera.scss" scoped />
