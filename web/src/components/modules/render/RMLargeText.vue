<template>
  <div class="rm-large-text">
    {{ props.data.input }}
  </div>
</template>

<script setup lang="ts">
import type { RenderDataLargeText } from '@thermal-printer-fun/shared';
import { onMounted } from 'vue';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataLargeText>>();

onMounted(async () => {
  props.onReady();
});
</script>

<style lang="scss" src="./RMLargeText.scss" scoped />
