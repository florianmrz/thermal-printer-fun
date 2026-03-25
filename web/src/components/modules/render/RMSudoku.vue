<template>
  <div class="rm-sudoku">
    <div v-for="(row, rowIndex) in data.data" :key="rowIndex" class="sudoku-row">
      <div v-for="(cell, cellIndex) in row" :key="cellIndex" class="sudoku-cell">
        {{ cell !== 0 ? cell : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataSudoku } from '@thermal-printer-fun/shared';
import { onMounted } from 'vue';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataSudoku>>();

onMounted(async () => {
  console.log(props.data.data);
  props.onReady();
});
</script>

<style lang="scss" src="./RMSudoku.scss" scoped />
