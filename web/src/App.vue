<template>
  <a class="skip-to-content-link" href="#main">Skip to content</a>
  <BMHeader />
  <main id="main" class="global-container">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { provide, readonly, ref } from 'vue';
import { RouterView } from 'vue-router';
import { type PrinterStatus, type WebSocketMessage } from '../../shared/const';
import BMHeader from './components/modules/basic/BMHeader.vue';
import env from './utils/env';
import { printerStatusInjectionKey } from './utils/keys';

const printerStatus = ref<PrinterStatus>('unknown');

provide(printerStatusInjectionKey, readonly(printerStatus));

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
        default: {
          console.warn('Unknown WebSocket message type:', parsed.type);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  },
});
</script>

<style lang="scss" src="./App.scss" scoped />
