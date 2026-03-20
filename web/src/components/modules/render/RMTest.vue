<template>
  <p>{{ props.data.foo }}</p>
</template>

<script setup lang="ts">
import type { RenderDataTest } from '@thermal-printer-fun/shared';
import { onMounted } from 'vue';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataTest>>();

onMounted(() => {
  void props.onReady();
});
</script>
