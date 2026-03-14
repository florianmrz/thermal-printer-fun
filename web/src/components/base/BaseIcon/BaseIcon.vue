<template>
  <component :is="component" class="base-icon" :class="`is-${props.size}`" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { icons, type IconName } from './icons';

const props = defineProps<{
  icon: IconName;
  size: 'small' | 'medium' | 'large';
}>();

const component = computed(() => icons[props.icon]);
</script>

<style lang="scss" src="./BaseIcon.scss" scoped />
