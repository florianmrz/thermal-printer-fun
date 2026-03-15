<template>
  <button class="base-button" :class="[`is-${props.variant} is-${props.size}`, { 'is-icon-only': props.iconOnly }]" type="button">
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'filled' | 'outlined';
    size?: 'regular' | 'large',
    iconOnly?: boolean;
  }>(),
  {
    variant: 'filled',
    size: 'regular',
  }
);
</script>

<style lang="scss" src="./BaseButton.scss" scoped />
