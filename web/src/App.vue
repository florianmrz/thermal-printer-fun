<template>
  <a class="skip-to-content-link" href="#main">Skip to content</a>
  <BMHeader />
  <main id="main" class="global-container">
    <RouterView />
  </main>
  <PMAuthCodeOverlay />
</template>

<script setup lang="ts">
import { type PrinterStatus, type WebSocketMessage } from '@thermal-printer-fun/shared';
import { useWebSocket } from '@vueuse/core';
import { onMounted, provide, readonly, ref, shallowReadonly } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import BMHeader from './components/modules/basic/BMHeader.vue';
import PMAuthCodeOverlay from './components/modules/print/PMAuthCodeOverlay.vue';
import { getAuthCodeStatus } from './utils/api';
import { authCode, authCodeRequired } from './utils/auth-code';
import env from './utils/env';
import { printerQueueJobIdsInjectionKey, printerStatusInjectionKey } from './utils/keys';

const router = useRouter();
const printerStatus = ref<PrinterStatus>('unknown');
const printerQueueJobIds = ref<string[]>([]);

provide(printerStatusInjectionKey, readonly(printerStatus));
provide(printerQueueJobIdsInjectionKey, shallowReadonly(printerQueueJobIds));

onMounted(async () => {
  // Persist auth code from query param (e.g. from a QR code link)
  const params = new URLSearchParams(window.location.search);
  const codeParam = params.get('code');
  if (codeParam && /^\d{6}$/.test(codeParam)) {
    authCode.value = codeParam;
    // Remove the param from the URL without a navigation
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('code');
    void router.replace(newUrl);
  }

  authCodeRequired.value = await getAuthCodeStatus();
});

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
