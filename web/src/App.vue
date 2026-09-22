<template>
  <a class="skip-to-content-link" href="#main">Skip to content</a>
  <BMHeader />
  <main id="main" class="global-container">
    <RouterView />
  </main>
  <PMAuthCodeOverlay />
</template>

<script setup lang="ts">
import { type PrinterStatus } from '@thermal-printer-fun/shared';
import { useDocumentVisibility, useTimeoutPoll } from '@vueuse/core';
import { onMounted, provide, readonly, ref, shallowReadonly, watch } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import BMHeader from './components/modules/basic/BMHeader.vue';
import PMAuthCodeOverlay from './components/modules/print/PMAuthCodeOverlay.vue';
import { getAuthCodeStatus, getPrinterState } from './utils/api';
import { authCode, authCodeRequired } from './utils/auth-code';
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

async function fetchPrinterState() {
  const state = await getPrinterState();
  if (!state) {
    // Keep showing the last known state, a single failed poll is not worth a UI flicker.
    return;
  }

  printerStatus.value = state.status;
  printerQueueJobIds.value = state.queueJobIds;
}

/**
 * Request printer and queue status while the tab is active.
 */
const printerStatusPoll = useTimeoutPoll(fetchPrinterState, 5_000, {
  immediate: true,
  immediateCallback: true,
});
const documentVisibility = useDocumentVisibility();
watch(documentVisibility, visibility => {
  if (visibility === 'visible') {
    printerStatusPoll.resume();
  } else {
    printerStatusPoll.pause();
  }
});
</script>

<style lang="scss" src="./App.scss" scoped />
