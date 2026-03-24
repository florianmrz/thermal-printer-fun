<template>
  <div class="home-view">
    <div class="card-container">
      <RouterLink class="card" :to="{ name: 'upload' }">
        <div class="icon">
          <BaseIcon icon="upload-sharp" size="large" />
        </div>
        <div class="title">Upload</div>
      </RouterLink>
      <RouterLink class="card" :to="{ name: 'camera' }">
        <div class="icon"><BaseIcon icon="camera" size="large" /></div>
        <div class="title">Camera</div>
      </RouterLink>
      <RouterLink class="card" :to="{ name: 'large-text' }">
        <div class="icon"><BaseIcon icon="a-arrow-up-sharp" size="large" /></div>
        <div class="title">Large Text</div>
      </RouterLink>
      <RouterLink class="card" :to="{ name: 'test' }">
        <div class="icon"><BaseIcon icon="test-tube-sharp" size="large" /></div>
        <div class="title">Test</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import BaseIcon from '../components/base/BaseIcon/BaseIcon.vue';
</script>

<style lang="scss" src="./HomeView.scss" scoped />
