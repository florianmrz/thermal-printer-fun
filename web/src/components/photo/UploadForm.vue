<template>
  <div class="upload-form">
    <div ref="dropzone" class="dropzone"></div>
    <label for="photo">File</label>
    <input ref="fileInput" id="photo" type="file" @change="handleFileUpload" accept="image/*" />
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core';
import { useTemplateRef } from 'vue';

const $dropzone = useTemplateRef('dropzone');
const $input = useTemplateRef('fileInput');

const emit = defineEmits<{
  'file-selected': [file: File];
}>();


useDropZone($dropzone, {
  onDrop: (files) => {
    if (files?.[0]) {
      emit('file-selected', files[0]);
    }
  },
});

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    emit('file-selected', target.files[0]);
  }
}

function clear() {
  if ($input.value) {
    $input.value.value = '';
  }
}

defineExpose({
  clear,
});
</script>

<style scoped>
.dropzone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 20px;
}
</style>
