<template>
  <header class="bm-header">
    <div class="global-container">
      <div class="header-container">
        <RouterLink :to="{ name: 'home' }" class="logo">🖨️</RouterLink>

        <nav class="nav-links">
          <RouterLink :to="{ name: 'home' }">Home</RouterLink>
          <RouterLink :to="{ name: 'print' }">Print</RouterLink>
        </nav>

        <div class="printer-status" :class="`is-${printerStatus}`">
          <span class="printer-status-text">{{ printerStatus }}</span>
          <span class="printer-status-indicator" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { RouterLink } from 'vue-router';
import { printerStatusInjectionKey } from '../../../utils/keys';

const printerStatus = inject(printerStatusInjectionKey);
</script>

<style lang="scss" src="./BMHeader.scss" scoped />
