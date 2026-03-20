<template>
  <section class="test-module">
    <form class="test-form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="foo"
        name="foo"
        label="Foo"
        required
        autocomplete="off"
        placeholder="Type a value"
        :error="errors.foo" />

      <BaseButton type="submit" :disabled="isSubmitting">Submit</BaseButton>
    </form>
  </section>
</template>

<script setup lang="ts">
import { renderTestSchema } from '@thermal-printer-fun/shared';
import { useForm } from 'vee-validate';
import { submitRenderTest } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'test',
    foo: '',
  },
  validationSchema: renderTestSchema,
});

const [foo] = defineField('foo');

const onSubmit = handleSubmit(async values => {
  await submitRenderTest(values);
});
</script>

<style lang="scss" src="./TMTest.scss" scoped />
