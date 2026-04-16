<template>
  <div class="base-checkbox">
    <label :for="id" class="label" :class="{ 'is-disabled': props.disabled }">
      <input
        :id="id"
        v-model="model"
        type="checkbox"
        :required="props.required"
        :disabled="props.disabled"
        :name="props.name"
        class="field"
        :class="{ 'has-error': props.error }" />
      <span class="label-text">{{ props.label }}</span>
    </label>
    <span v-if="props.error" class="error">{{ props.error }}</span>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

const props = defineProps<{
  required?: boolean;
  disabled?: boolean;
  name?: string;
  label: string;
  error?: string;
}>();

const model = defineModel<boolean>({ required: true });

const id = useId();
</script>

<style src="./BaseCheckbox.scss" lang="scss" scoped />