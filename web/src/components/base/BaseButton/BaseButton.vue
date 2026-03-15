<template>
  <button class="base-button" :class="`is-${props.variant} is-${props.size}`">
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'filled' | 'outlined';
    size?: 'regular' | 'large'
  }>(),
  {
    variant: 'filled',
    size: 'regular',
  }
);
</script>

<style lang="scss" src="./BaseButton.scss" scoped />
