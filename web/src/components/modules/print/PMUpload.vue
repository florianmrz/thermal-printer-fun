<template>
  <PrintView>
    <form class="pm-upload" @submit="handleSubmit">
      <label ref="dropzone" class="dropzone" for="photo">
        <BaseIcon icon="upload" size="large" />
        Upload a file</label
      >
      <input ref="fileInput" id="photo" type="file" @change="handleFileUpload" accept="image/*" />
      <BaseButton v-if="!!file" type="submit">Print</BaseButton>
    </form>
  </PrintView>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';
import { submitImagePrint } from '../../../utils/api';
import PrintView from '../../../views/PrintView.vue';
import BaseIcon from '../../base/BaseIcon/BaseIcon.vue';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
const $dropzone = useTemplateRef('dropzone');
const $input = useTemplateRef('fileInput');

const file = ref<File | null>(null);

useDropZone($dropzone, {
  onDrop: files => {
    if (files?.[0]) {
      file.value = files[0];
    }
  },
});

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    file.value = target.files[0];
  }
}

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault();

  if (!file.value) {
    return;
  }

  await submitImagePrint(file.value);

  // Clear input
  if ($input.value) {
    $input.value.value = '';
  }
}
</script>

<style lang="scss" src="./PMUpload.scss" scoped />
