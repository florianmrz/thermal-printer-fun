<template>
  <component :is="component" class="base-icon" :class="`is-${props.size}`" viewBox="0 0 24 24" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { icons, type IconName } from './icons';

const props = withDefaults(
  defineProps<{
    icon: IconName;
    size?: 'regular' | 'large';
  }>(),
  {
    size: 'regular',
  }
);

const component = computed(() => icons[props.icon]);
</script>

<style lang="scss" src="./BaseIcon.scss" scoped />
