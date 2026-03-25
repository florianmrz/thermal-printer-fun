<template>
  <section class="lm-large-text">
    <form class="form" @submit.prevent="onSubmitLargeText">
      <PMItemHeader title="Large Text" description="Enter a short text and print it in a large format." />

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

      <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
    </form>
  </section>
</template>

<script setup lang="ts">
import { renderLargeTextSchema, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
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
  validationSchema: renderLargeTextSchema,
});

const [largeTextInput] = defineField('input');
const submitResponse = ref<PrintSubmitResponse | null>(null);

const onSubmitLargeText = handleSubmit(async values => {
  submitResponse.value = await submitLargeText(values);
});
</script>

<style lang="scss" src="./PMLargeText.scss" scoped />
