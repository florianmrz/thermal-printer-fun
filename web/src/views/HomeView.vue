<template>
  <div class="home-view">
    <div class="card-container">
      <RouterLink class="card" :to="{ name: 'print' }">
        <div class="icon">🖨️</div>
        <div class="title">Print</div>
      </RouterLink>
      <RouterLink class="card" :to="{ name: 'large-text' }">
        <div class="icon">🔤</div>
        <div class="title">Large Text</div>
      </RouterLink>
      <RouterLink class="card" :to="{ name: 'test' }">
        <div class="icon">🧪</div>
        <div class="title">Test</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style lang="scss" src="./HomeView.scss" scoped />
