<template>
  <component :is="props.icon" class="base-icon" :class="`is-${props.size}`" />
</template>

<script setup lang="ts">
import { type Component } from 'vue';

const props = defineProps<{
  icon: Component;
  size: 'small' | 'medium' | 'large';
}>();
</script>

<style lang="scss" src="./BaseIcon.scss" scoped />
