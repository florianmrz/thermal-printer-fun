<template>
  <button class="base-button" :class="`is-${props.variant}`">
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'filled' | 'outlined';
  }>(),
  {
    variant: 'filled',
  }
);
</script>

<style lang="scss" src="./BaseButton.scss" scoped />
