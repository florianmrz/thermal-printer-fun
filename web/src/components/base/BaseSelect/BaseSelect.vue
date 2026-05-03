<template>
  <div class="base-select">
    <label v-if="props.label" :for="id" class="label">
      {{ props.label }}
      <span v-if="props.required">*</span>
    </label>
    <div class="field-wrapper">
      <select
        :id="id"
        v-model="model"
        :required="props.required"
        :disabled="props.disabled"
        :name="props.name"
        :aria-label="props.ariaLabel"
        class="field"
        :class="{ 'has-error': props.error, 'is-placeholder': props.placeholder && !model }">
        <option v-if="props.placeholder" disabled value="">{{ props.placeholder }}</option>
        <option v-for="option in props.options" :key="option.value" :value="option.value" :disabled="option.disabled">
          {{ option.label }}
        </option>
      </select>
    </div>
    <span v-if="props.error" class="error">{{ props.error }}</span>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

const props = defineProps<{
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  label?: string;
  ariaLabel?: string;
  error?: string;
}>();

const model = defineModel<string>({ required: true });

const id = useId();
</script>

<style src="./BaseSelect.scss" lang="scss" scoped />
