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

      <BMPrintJobStatus :jobId="submittedLargeTextJobId" />
    </form>
  </section>
</template>

<script setup lang="ts">
import { renderLargeTextSchema } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitLargeText } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import BMPrintJobStatus from '../basic/BMPrintJobStatus.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'large-text',
    input: '',
  },
  validationSchema: renderLargeTextSchema,
});

const [largeTextInput] = defineField('input');
const submittedLargeTextJobId = ref<string | null>(null);

const onSubmitLargeText = handleSubmit(async values => {
  const { jobId } = await submitLargeText(values);
  submittedLargeTextJobId.value = jobId;
});
</script>

<style lang="scss" src="./LMLargeText.scss" scoped />
