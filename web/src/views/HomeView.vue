<template>
  <div class="home-view">
    <div class="headline-container">
      <h1 class="title">Thermal Printer</h1>
      <p class="description">Choose one of the print modules below to use the printer.</p>
    </div>
    <div class="card-container">
      <RouterLink v-for="module in printModules" :key="module.id" class="card" :to="{ name: module.id }">
        <div class="title">{{ module.name }}</div>
        <div class="description">{{ module.description }}</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { printModules } from '../utils/print-modules';
</script>

<style lang="scss" src="./HomeView.scss" scoped />
