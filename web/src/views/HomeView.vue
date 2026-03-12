<template>
  <div class="home-view">
    <div class="card-container">
      <RouterLink class="card" :to="{ name: 'print' }">
        <div class="icon">🖨️</div>
        <div class="title">Print</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style lang="scss" src="./HomeView.scss" scoped />
