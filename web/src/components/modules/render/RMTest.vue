<template>
  <p>{{ props.data.foo }}</p>
</template>

<script setup lang="ts">
import type { RenderDataTest } from '../../../../../shared/types';

const props = defineProps<{
  data: RenderDataTest;
}>();
</script>
