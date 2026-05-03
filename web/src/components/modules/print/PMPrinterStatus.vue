<template>
  <BasePopover class="pm-printer-status" placement="bottom-end">
    <template #trigger="{ isOpen }">
      <button
        class="status-trigger"
        :class="[`is-${status}`, { 'is-open': isOpen }]"
        type="button"
        aria-label="Show printer status details"
        :aria-expanded="isOpen">
        <BaseIcon icon="printer" />
        <BaseIcon :icon="statusIcon" />
        <div class="trigger-divider"></div>
        <BaseIcon icon="list-box" />
        <span class="queue-count" aria-label="Queue count">{{ queueCountDisplay }}</span>
      </button>
    </template>

    <div class="status-popover">
      <div class="status-container">
        <div class="status-headline">Printer Status</div>
        <p class="status-text">{{ status }}</p>
      </div>

      <hr />

      <div class="status-container">
        <div class="status-headline">Queue Details</div>
        <div class="queue-details">
          <p v-if="queueCount === 0">Queue is currently empty.</p>
          <template v-else>
            <p>{{ queueCount }} job{{ queueCount === 1 ? '' : 's' }} in queue:</p>

            <ol class="queue-list">
              <li v-for="jobId in queueJobIds" :key="jobId" class="queue-item">
                {{ jobId }}
              </li>
            </ol>
          </template>
        </div>
      </div>
    </div>
  </BasePopover>
</template>

<script setup lang="ts">
import type { PrinterStatus } from '@thermal-printer-fun/shared';
import { computed, inject } from 'vue';
import { printerQueueJobIdsInjectionKey, printerStatusInjectionKey } from '../../../utils/keys';
import BaseIcon from '../../base/BaseIcon/BaseIcon.vue';
import type { IconName } from '../../base/BaseIcon/icons';
import BasePopover from '../../base/BasePopover/BasePopover.vue';

const printerStatus = inject(printerStatusInjectionKey);
const printerQueueJobIds = inject(printerQueueJobIdsInjectionKey);

const status = computed<PrinterStatus>(() => printerStatus?.value ?? 'unknown');
const queueJobIds = computed(() => printerQueueJobIds?.value ?? []);
const queueCount = computed(() => queueJobIds.value.length);

const queueCountDisplay = computed(() => (status.value === 'unknown' ? '?' : queueCount.value.toString()));

const statusIcon = computed<IconName>(() => {
  if (status.value === 'connected') {
    return 'check';
  }

  if (status.value === 'disconnected') {
    return 'warning-diamond';
  }

  return 'loader';
});
</script>

<style lang="scss" src="./PMPrinterStatus.scss" scoped />
