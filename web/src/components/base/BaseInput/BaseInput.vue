<template>
  <div class="base-input">
    <label v-if="props.label" :for="id" class="label">
      {{ props.label }}
      <span v-if="props.required">*</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="props.type"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :required="props.required"
      :disabled="props.disabled"
      :name="props.name"
      class="field"
      :class="{ 'has-error': props.error }" />
    <span v-if="props.error" class="error">{{ props.error }}</span>
  </div>
</template>

<script setup lang="ts">
import { useId, type InputAutoCompleteAttribute, type InputTypeHTMLAttribute } from 'vue';

const props = defineProps<{
  type?: InputTypeHTMLAttribute;
  placeholder?: string;
  autocomplete?: InputAutoCompleteAttribute;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  label?: string;
  error?: string;
}>();

const model = defineModel<string>({ required: true });

const id = useId();
</script>

<style src="./BaseInput.scss" lang="scss" scoped />
