<template>
  <section class="pm-website print-module">
    <PMItemHeader moduleId="website" />

    <form class="form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="urlInput"
        name="website-url-input"
        label="URL"
        type="text"
        required
        autocomplete="off"
        placeholder="https://example.com"
        :error="errors.url" />

      <BaseCheckbox v-model="fullPageInput" name="full-page" label="Full page (max. 5,000 px)" />

      <BaseButton type="submit" :loading="isSubmitting">Print</BaseButton>
    </form>

    <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" />
  </section>
</template>

<script setup lang="ts">
import { renderWebsiteInputSchema, type RenderInputWebsite } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitWebsite } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseCheckbox from '../../base/BaseCheckbox/BaseCheckbox.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm<RenderInputWebsite>({
  initialValues: {
    _type: 'website',
    url: '',
    fullPage: false,
  },
  validationSchema: renderWebsiteInputSchema,
});

const [urlInput] = defineField('url');
const [fullPageInput] = defineField('fullPage');
const submitResponse = ref<{ jobId: string } | null>(null);

const onSubmit = handleSubmit(async values => {
  submitResponse.value = await submitWebsite(values);
});
</script>

<style lang="scss" src="./_print.scss" scoped />
