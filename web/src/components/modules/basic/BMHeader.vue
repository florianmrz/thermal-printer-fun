<template>
  <header class="bm-header">
    <div class="global-container">
      <div class="header-container">
        <RouterLink :to="{ name: 'home' }" class="logo">
          <BaseIcon icon="printer" size="large" />
        </RouterLink>

        <nav class="nav-links" aria-label="Print modules">
          <BaseNavLink v-for="module in printModules" :key="module.id" :to="{ name: module.id }">{{
            module.name
          }}</BaseNavLink>
        </nav>

        <BaseSelect
          v-model="selectedModuleId"
          class="nav-select"
          name="module-navigation"
          placeholder="Choose a module"
          aria-label="Choose a print module"
          :options="moduleSelectOptions" />

        <div class="printer-status-wrapper">
          <div class="printer-status" :class="`is-${printerStatus}`">
            <span class="printer-status-text"
              >Printer: {{ printerStatus }} (Queue: {{ printerQueueJobIds?.length ?? 0 }})</span
            >
            <BaseIcon
              v-if="printerStatus !== 'unknown'"
              class="printer-status-indicator"
              :icon="printerStatus === 'disconnected' ? 'warning-diamond' : 'check'" />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { printerQueueJobIdsInjectionKey, printerStatusInjectionKey } from '../../../utils/keys';
import { printModules } from '../../../utils/print-modules';
import BaseIcon from '../../base/BaseIcon/BaseIcon.vue';
import BaseNavLink from '../../base/BaseNavLink/BaseNavLink.vue';
import BaseSelect from '../../base/BaseSelect/BaseSelect.vue';

const route = useRoute();
const router = useRouter();

const printerStatus = inject(printerStatusInjectionKey);
const printerQueueJobIds = inject(printerQueueJobIdsInjectionKey);

const moduleSelectOptions = printModules.map(module => ({
  label: module.name,
  value: module.id,
}));

const selectedModuleId = computed({
  get: () => {
    const activeModule = printModules.find(module => module.id === route.name);

    return activeModule?.id ?? '';
  },
  set: nextModuleId => {
    if (!nextModuleId || nextModuleId === route.name) {
      return;
    }

    void router.push({ name: nextModuleId });
  },
});
</script>

<style lang="scss" src="./BMHeader.scss" scoped />
