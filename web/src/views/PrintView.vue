<template>
  <div class="print-view">
    <nav class="nav-links">
      <BaseNavLink :to="{ name: 'print-upload' }">Upload</BaseNavLink>
      <BaseNavLink :to="{ name: 'print-camera' }">Camera</BaseNavLink>
    </nav>
    <slot/>
  </div>
</template>

<script setup lang="ts">
import BaseNavLink from '../components/base/BaseNavLink/BaseNavLink.vue';
</script>

<style lang="scss" src="./PrintView.scss" scoped />
