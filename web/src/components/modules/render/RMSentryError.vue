<template>
  <div class="rm-sentry-error">
    Sentry error
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import type { RenderSentryErrorData } from '@thermal-printer-fun/shared';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderSentryErrorData>>();

onMounted(async () => {
  console.log(props.data.data);
  props.onReady();
});
</script>

<style lang="scss" src="./RMSentryError.scss" scoped />
