<template>
  <div class="home">
    <form @submit="handleSubmit">
      <UploadForm @fileSelected="handleFileSelected" />
      <button type="submit">print</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadForm from '../components/photo/UploadForm.vue';
import { submitImagePrint } from '../utils/api';

const file = ref<File | null>(null);

function handleFileSelected(selectedFile: File) {
  file.value = selectedFile;
}

async function handleSubmit(e: SubmitEvent) {
  e.preventDefault();

  if (!file.value) {
    return;
  }
  await submitImagePrint(file.value);
}

</script>
