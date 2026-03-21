<template>
  <p class="bm-print-job-status" v-if="jobId">
    Job ID: {{ jobId }}<br />
    <span v-if="queuePosition">Queue position: {{ queuePosition }}</span>
    <span v-else>Print completed</span>
  </p>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { printerQueueJobIdsInjectionKey } from '../../../utils/keys';

const props = defineProps<{
  jobId: string | null;
}>();

const printerQueueJobIds = inject(printerQueueJobIdsInjectionKey);

const queuePosition = computed(() => {
  if (!props.jobId || !printerQueueJobIds) {
    return null;
  }

  const queueIndex = printerQueueJobIds.value.indexOf(props.jobId);
  return queueIndex >= 0 ? queueIndex + 1 : null;
});
</script>

<style lang="scss" src="./BMPrintJobStatus.scss" scoped />
