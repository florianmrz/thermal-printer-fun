<template>
  <div class="rm-todo-list">
    <h1 v-if="props.data.title" class="title">{{ props.data.title }}</h1>

    <div v-for="(item, index) in props.data.items" :key="index" class="todo-item">
      <div class="checkbox"></div>
      <div class="item-text">{{ item }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataTodoList } from '@thermal-printer-fun/shared';
import { onMounted } from 'vue';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataTodoList>>();

onMounted(async () => {
  props.onReady();
});
</script>

<style lang="scss" src="./RMTodoList.scss" scoped />
