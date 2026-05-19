<template>
  <section class="pm-upload print-module">
    <PMItemHeader moduleId="upload" />

    <form class="form" @submit="handleSubmit">
      <template v-if="!file">
        <label ref="dropzone" class="dropzone" :class="{ 'is-over': isOverDropZone }" for="photo">
          <span class="label">Upload a file</span>
        </label>

        <input ref="fileInput" id="photo" type="file" @change="handleFileSelect" :accept="accept" />
        <p class="error-message" v-if="fileError">{{ fileError }}</p>
      </template>

      <div v-else-if="previewSrc">
        <img class="file-preview" :src="previewSrc" alt="Uploaded image" />
      </div>

      <BaseButton variant="outlined" type="button" @click="file = null">Cancel</BaseButton>

      <span class="error-message" v-if="submitError">{{ submitError }}</span>

      <BaseButton type="submit" :loading="isSubmitting">Print</BaseButton>
    </form>

    <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
  </section>
</template>

<script setup lang="ts">
import { FILE_UPLOAD_OPTIONS, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { useDropZone } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import { submitImagePrint, getApiErrorMessage } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';
const $dropzone = useTemplateRef('dropzone');
const $input = useTemplateRef('fileInput');

const fileError = ref<string | null>(null);
const submitError = ref<string | null>(null);
const file = ref<File | null>(null);
const isSubmitting = ref(false);
const submitResponse = ref<PrintSubmitResponse | null>(null);

const { isOverDropZone } = useDropZone($dropzone, {
  onDrop: files => {
    const droppedFile = files?.[0];
    if (droppedFile) {
      if (droppedFile.size > FILE_UPLOAD_OPTIONS.MAX_FILE_SIZE) {
        fileError.value = `File is too large. Maximum size is ${FILE_UPLOAD_OPTIONS.MAX_FILE_SIZE / (1024 * 1024)} MB.`;
        return;
      }

      file.value = droppedFile;
    }
  },
  dataTypes: FILE_UPLOAD_OPTIONS.ALLOWED_FILE_TYPES,
  multiple: false,
});

const accept = computed(() => FILE_UPLOAD_OPTIONS.ALLOWED_FILE_TYPES.join(','));
const previewSrc = computed(() => (file.value ? URL.createObjectURL(file.value) : null));

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0];
  if (selectedFile) {
    if (selectedFile.size > FILE_UPLOAD_OPTIONS.MAX_FILE_SIZE) {
      fileError.value = `File is too large. Maximum size is ${FILE_UPLOAD_OPTIONS.MAX_FILE_SIZE / (1024 * 1024)} MB.`;
      return;
    }
    file.value = selectedFile;
  }
}

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

  // Clear input
  if ($input.value) {
    $input.value.value = '';
  }
}
</script>

<style lang="scss" src="./_print.scss" scoped />
<style lang="scss" src="./PMUpload.scss" scoped />
