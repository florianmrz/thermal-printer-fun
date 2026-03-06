<template>
  <header>
    <img alt="Vue logo" src="./assets/logo.svg" width="125" height="125" />

    <div>
      <HelloWorld />

      <p>Printer Status: <b>{{ printerStatus }}</b></p>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<script setup lang="ts">
import { useWebSocket } from '@vueuse/core';
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { type PrinterStatus, type WebSocketMessage } from '../../shared/const';
import HelloWorld from './components/HelloWorld.vue';
import env from './utils/env';

const printerStatus = ref<PrinterStatus>('unknown');

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

<style scoped></style>
