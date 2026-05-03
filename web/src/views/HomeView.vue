<template>
  <div class="home-view">
    <div class="card-container">
      <RouterLink v-for="module in printModules" :key="module.id" class="card" :to="{ name: module.id }">
        <div class="icon">
          <BaseIcon :icon="module.icon" size="large" />
        </div>
        <div class="title">{{ module.name }}</div>
        <div class="description">{{ module.description }}</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import BaseIcon from '../components/base/BaseIcon/BaseIcon.vue';
import { printModules } from '../utils/print-modules';
</script>

<style lang="scss" src="./HomeView.scss" scoped />
