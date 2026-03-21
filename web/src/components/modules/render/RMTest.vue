<template>
  <div class="rm-test">
    <div class="text">{{ props.data.foo }}</div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataTest } from '@thermal-printer-fun/shared';
import { onMounted } from 'vue';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataTest>>();

onMounted(() => {
  void props.onReady();
});
</script>

<style scoped>
.rm-test {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 500px;
}

.text {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  padding: 16px;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  border-radius: 8px;
  display: inline-block;
}
</style>
