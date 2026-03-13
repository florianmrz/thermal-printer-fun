<template>
  <div class="print-view">
    <nav class="nav-links">
      <BaseNavLink :to="{ name: 'print-upload' }">Upload</BaseNavLink>
      <BaseNavLink :to="{ name: 'print-camera' }">Camera</BaseNavLink>
    </nav>
    <form @submit="handleSubmit">
      <UploadForm v-if="$route.name === 'print-upload'" @fileSelected="handleFileSelected" />
      <CameraForm v-if="$route.name === 'print-camera'" @fileSelected="handleFileSelected" />
      <button type="submit">print</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import BaseNavLink from '../components/base/BaseNavLink/BaseNavLink.vue';
import CameraForm from '../components/photo/CameraForm.vue';
import UploadForm from '../components/photo/UploadForm.vue';
import { submitImagePrint } from '../utils/api';

const $route = useRoute();

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

<style lang="scss" src="./PrintView.scss" scoped />
