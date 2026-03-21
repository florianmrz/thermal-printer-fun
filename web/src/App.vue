<template>
  <a class="skip-to-content-link" href="#main">Skip to content</a>
  <BMHeader />
  <main id="main" class="global-container">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { provide, readonly, ref, shallowReadonly } from 'vue';
import { RouterView } from 'vue-router';
import { type PrinterStatus, type WebSocketMessage } from '@thermal-printer-fun/shared';
import BMHeader from './components/modules/basic/BMHeader.vue';
import env from './utils/env';
import { printerQueueJobIdsInjectionKey, printerStatusInjectionKey } from './utils/keys';

const printerStatus = ref<PrinterStatus>('unknown');
const printerQueueJobIds = ref<string[]>([]);

provide(printerStatusInjectionKey, readonly(printerStatus));
provide(printerQueueJobIdsInjectionKey, shallowReadonly(printerQueueJobIds));

useWebSocket(`${env.VITE_API_BASE_URL}/ws/web`, {
  autoReconnect: true,
  onMessage(_ws, event) {
    try {
      const parsed: WebSocketMessage = JSON.parse(event.data);

      switch (parsed.type) {
        case 'printer-status': {
          printerStatus.value = parsed.status;
          break;
        }
        case 'printer-queue': {
          printerQueueJobIds.value = parsed.queueJobIds;
          break;
        }
        default: {
          console.warn('Unknown WebSocket message:', JSON.stringify(parsed as unknown));
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  },
});
</script>

<style lang="scss" src="./App.scss" scoped />
