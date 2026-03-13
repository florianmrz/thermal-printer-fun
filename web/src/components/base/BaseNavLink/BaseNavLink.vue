<template>
  <RouterLink v-bind="props" class="base-nav-link">
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink, type RouterLinkProps } from 'vue-router';

const props = defineProps<RouterLinkProps>();
</script>

<style lang="scss" src="./BaseNavLink.scss" scoped />
