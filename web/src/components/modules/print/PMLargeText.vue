<template>
  <section class="pm-large-text print-module">
    <PMItemHeader title="Large Text" description="Enter a short text and print it in a large format." />

    <form class="form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="largeTextInput"
        name="large-text-input"
        label="Text"
        required
        autocomplete="off"
        placeholder="This will be huge!"
        :maxlength="20"
        :error="errors.input" />

      <BaseButton type="submit" :disabled="isSubmitting">Print</BaseButton>
    </form>

    <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
  </section>
</template>

<script setup lang="ts">
import { renderLargeTextInputSchema, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitLargeText } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'large-text',
    input: '',
  },
  validationSchema: renderLargeTextInputSchema,
});

const [largeTextInput] = defineField('input');
const submitResponse = ref<PrintSubmitResponse | null>(null);

const onSubmit = handleSubmit(async values => {
  submitResponse.value = await submitLargeText(values);
});
</script>

<style lang="scss" src="./_print.scss" scoped />
