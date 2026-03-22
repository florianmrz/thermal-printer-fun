<template>
  <header class="bm-header">
    <div class="global-container">
      <div class="header-container">
        <RouterLink :to="{ name: 'home' }" class="logo">🖨️</RouterLink>

        <nav class="nav-links">
          <BaseNavLink :to="{ name: 'upload' }">Upload</BaseNavLink>
          <BaseNavLink :to="{ name: 'camera' }">Camera</BaseNavLink>
          <BaseNavLink :to="{ name: 'large-text' }">Large Text</BaseNavLink>
          <BaseNavLink :to="{ name: 'test' }">Test</BaseNavLink>
        </nav>

        <div class="printer-status" :class="`is-${printerStatus}`">
          <span class="printer-status-text">{{ printerStatus }} (Print queue: {{ printerQueueJobIds?.length ?? 0 }})</span>
          <span class="printer-status-indicator" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { RouterLink } from 'vue-router';
import { printerQueueJobIdsInjectionKey, printerStatusInjectionKey } from '../../../utils/keys';
import BaseNavLink from '../../base/BaseNavLink/BaseNavLink.vue';

const printerStatus = inject(printerStatusInjectionKey);
const printerQueueJobIds = inject(printerQueueJobIdsInjectionKey);
</script>

<style lang="scss" src="./BMHeader.scss" scoped />
