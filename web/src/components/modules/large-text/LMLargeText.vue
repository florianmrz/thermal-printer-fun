<template>
  <section class="lm-large-text">
    <form class="form" @submit.prevent="onSubmitLargeText">
      <h2 class="title">Large Text</h2>
      <BaseInput
        v-model="largeTextInput"
        name="large-text-input"
        label="Input"
        required
        autocomplete="off"
        placeholder="Type text to print"
        :maxlength="20"
        :error="errors.input" />

      <BaseButton type="submit" :disabled="isSubmitting">Print</BaseButton>

      <BMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
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
import BMPrintJobResult from '../basic/BMPrintJobResult.vue';

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

<style lang="scss" src="./LMLargeText.scss" scoped />
