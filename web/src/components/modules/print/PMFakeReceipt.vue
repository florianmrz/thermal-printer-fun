<template>
  <section class="pm-fake-receipt print-module">
    <PMItemHeader moduleId="fake-receipt" />

    <form class="form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="topicInput"
        name="fake-receipt-topic"
        label="Topic"
        required
        autocomplete="off"
        placeholder="e.g. Dungeon & Dragons, Coffee Shop, Space Station..."
        :maxlength="80"
        :error="errors.topic" />

      <span class="error-message" v-if="submitError">{{ submitError }}</span>

      <BaseButton type="submit" :loading="isSubmitting">Print</BaseButton>
    </form>

    <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
  </section>
</template>

<script setup lang="ts">
import { renderFakeReceiptInputSchema, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitFakeReceipt } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'fake-receipt',
    topic: '',
  },
  validationSchema: renderFakeReceiptInputSchema,
});

const [topicInput] = defineField('topic');
const submitResponse = ref<PrintSubmitResponse | null>(null);
const submitError = ref<string | null>(null);

const onSubmit = handleSubmit(async values => {
  try {
    submitResponse.value = await submitFakeReceipt(values);
    submitError.value = null;
  } catch (error) {
    submitError.value = (error instanceof Error ? error.message : String(error));
  }
});
</script>

<style lang="scss" src="./_print.scss" scoped />
