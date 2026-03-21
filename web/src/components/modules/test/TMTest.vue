<template>
  <section class="test-module">
    <form class="test-form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="input"
        name="input"
        label="Input"
        required
        autocomplete="off"
        placeholder="Type a value"
        :error="errors.input" />

      <BaseButton type="submit" :disabled="isSubmitting">Submit</BaseButton>

      <BMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
    </form>
  </section>
</template>

<script setup lang="ts">
import { renderTestSchema, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitRenderTest } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import BMPrintJobResult from '../basic/BMPrintJobResult.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'test',
    input: '',
  },
  validationSchema: renderTestSchema,
});

const [input] = defineField('input');
const submitResponse = ref<PrintSubmitResponse | null>(null);

const onSubmit = handleSubmit(async values => {
  submitResponse.value = await submitRenderTest(values);
});
</script>

<style lang="scss" src="./TMTest.scss" scoped />
