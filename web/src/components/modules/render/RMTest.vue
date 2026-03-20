<template>
  <p>{{ props.data.foo }}</p>
</template>

<script setup lang="ts">
import type { RenderDataTest } from '@thermal-printer-fun/shared';

const props = defineProps<{
  data: RenderDataTest;
}>();
</script>
