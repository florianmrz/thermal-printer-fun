<template>
  <div class="pm-print-job-result">
    Job ID: {{ jobId }}<br />
    <p>
      <span v-if="queuePosition">Queue position: {{ queuePosition }}</span>
      <span v-else>Print completed</span>
    </p>
    <p v-if="env.VITE_ENV === 'development' && props.renderData">
      <a :href="`/render.html?data=${encodeRenderData(props.renderData)}`" target="_blank"
        >View Render</a
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import type { RenderData } from '@thermal-printer-fun/shared';
import { computed, inject } from 'vue';
import env from '../../../utils/env';
import { printerQueueJobIdsInjectionKey } from '../../../utils/keys';
import { encodeRenderData } from '../../../utils/render';

const props = defineProps<{
  jobId: string;
  renderData?: RenderData;
}>();

const printerQueueJobIds = inject(printerQueueJobIdsInjectionKey);

const queuePosition = computed(() => {
  if (!printerQueueJobIds) {
    return null;
  }

  const queueIndex = printerQueueJobIds.value.indexOf(props.jobId);
  return queueIndex >= 0 ? queueIndex + 1 : null;
});
</script>

<style lang="scss" src="./PMPrintJobResult.scss" scoped />
