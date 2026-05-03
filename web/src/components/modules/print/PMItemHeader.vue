<template>
  <header v-if="moduleInfo" class="pm-item-header">
    <div class="icon">
      <BaseDitheredImage :src="`/images/print-modules/${moduleInfo.id}.png`" />
    </div>
    <h2 class="title">{{ moduleInfo.name }}</h2>
    <p class="description">{{ moduleInfo.description }}</p>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type PrintModuleId, printModules } from '../../../utils/print-modules';
import BaseDitheredImage from '../../base/BaseDitheredImage/BaseDitheredImage.vue';

const props = defineProps<{
  moduleId: PrintModuleId;
}>();

const moduleInfo = computed(() => printModules.find(module => module.id === props.moduleId));
</script>

<style lang="scss" src="./PMItemHeader.scss" scoped />
