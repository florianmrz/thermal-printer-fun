<template>
  <header class="bm-header">
    <div class="global-container">
      <div class="header-container">
        <RouterLink :to="{ name: 'home' }" class="logo">
          <BaseDitheredImage :src="`/images/logo.png`" :size="64" />
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

        <PMPrinterStatus class="printer-status" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { printModules } from '../../../utils/print-modules';
import BaseDitheredImage from '../../base/BaseDitheredImage/BaseDitheredImage.vue';
import BaseNavLink from '../../base/BaseNavLink/BaseNavLink.vue';
import BaseSelect from '../../base/BaseSelect/BaseSelect.vue';
import PMPrinterStatus from '../print/PMPrinterStatus.vue';

const route = useRoute();
const router = useRouter();

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
