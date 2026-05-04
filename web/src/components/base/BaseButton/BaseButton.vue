<template>
  <button
    class="base-button"
    :class="[`is-${props.variant}`, `is-${props.size}`, { 'is-icon-only': props.iconOnly, 'is-loading': props.loading }]"
    :disabled="props.loading || props.disabled"
    :aria-busy="props.loading ? 'true' : undefined"
    type="button"
  >
    <span class="button-content">
      <slot />
    </span>
    <span v-if="props.loading" class="button-loader" aria-hidden="true">
      <span class="loader-dot" />
      <span class="loader-dot" />
      <span class="loader-dot" />
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'filled' | 'outlined';
    size?: 'regular' | 'large';
    iconOnly?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'filled',
    size: 'regular',
    loading: false,
    disabled: false,
  }
);
</script>

<style lang="scss" src="./BaseButton.scss" scoped />
