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

      <BMPrintJobStatus :jobId="submittedJobId" />
    </form>
  </section>
</template>

<script setup lang="ts">
import { renderTestSchema } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitRenderTest } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import BMPrintJobStatus from '../basic/BMPrintJobStatus.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'test',
    input: '',
  },
  validationSchema: renderTestSchema,
});

const [input] = defineField('input');
const submittedJobId = ref<string | null>(null);

const onSubmit = handleSubmit(async values => {
  const { jobId } = await submitRenderTest(values);
  submittedJobId.value = jobId;
});
</script>

<style lang="scss" src="./TMTest.scss" scoped />
