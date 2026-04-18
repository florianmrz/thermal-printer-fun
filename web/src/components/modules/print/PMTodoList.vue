<template>
  <section class="pm-todo-list print-module">
    <PMItemHeader
      title="Todo List"
      description='Create a printable checklist.<br/>("Enter" to add, "Backspace" to remove an item).' />

    <form class="form" @submit.prevent="onSubmit">
      <BaseInput
        v-model="title"
        name="todo-list-title"
        label="Title"
        :maxlength="32"
        autocomplete="off"
        placeholder="My Todo List"
        :error="errors.title" />

      <div class="items-list">
        <BaseInput
          v-for="(item, index) in items"
          ref="itemsInputs"
          :key="item.key"
          :modelValue="item.value"
          @update:modelValue="value => updateItem(index, value)"
          @paste="(e: ClipboardEvent) => handlePasteOnItem(index, e)"
          @keydown="(e: KeyboardEvent) => handleKeyPressOnItem(index, e)"
          :name="`todo-item-${index}`"
          :label="`Item ${index + 1}`"
          :maxlength="512"
          required
          autocomplete="off"
          placeholder="Buy milk"
          :error="errors[`items[${index}]`]" />
      </div>

      <p v-if="errors.items" class="error">{{ errors.items }}</p>

      <div class="actions-container">
        <BaseButton type="button" variant="outlined" @click="pushItem('')"> Add Item </BaseButton>
        <BaseButton type="submit">Print</BaseButton>
      </div>
    </form>

    <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
  </section>
</template>

<script setup lang="ts">
import { renderTodoListInputSchema, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { useFieldArray, useForm } from 'vee-validate';
import { nextTick, ref, useTemplateRef } from 'vue';
import { submitTodoList } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseInput from '../../base/BaseInput/BaseInput.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';

const $itemsInputs = useTemplateRef<{ $el: HTMLDivElement }[]>('itemsInputs');

const { defineField, errors, handleSubmit } = useForm({
  initialValues: {
    _type: 'todo-list',
    title: '',
    items: [''],
  },
  validationSchema: renderTodoListInputSchema,
});

const [title] = defineField<'title', string>('title');
const {
  fields: items,
  push: pushItem,
  remove: removeItem,
  update: updateItem,
  insert: insertItem,
} = useFieldArray<string>('items');
const submitResponse = ref<PrintSubmitResponse | null>(null);

async function handleKeyPressOnItem(index: number, event: KeyboardEvent) {
  console.log(event.key);

  if (event.key === 'Enter') {
    console.log('inputs', $itemsInputs.value);
    event.preventDefault();
    // On Enter key press, add a new item below the current one
    pushItem('');

    await nextTick();
    $itemsInputs.value?.[index + 1]?.$el?.querySelector('input')?.focus();
  } else if (event.key === 'Backspace' && items.value[index]?.value === '' && index !== 0) {
    // On Backspace key press, if the current item is empty, remove it
    event.preventDefault();
    removeItem(index);

    await nextTick();
    $itemsInputs.value?.[index - 1]?.$el?.querySelector('input')?.focus();
  } else if (event.key === 'ArrowUp' && index > 0) {
    event.preventDefault();
    $itemsInputs.value?.[index - 1]?.$el?.querySelector('input')?.focus();
  } else if (event.key === 'ArrowDown' && index < items.value.length - 1) {
    event.preventDefault();
    $itemsInputs.value?.[index + 1]?.$el?.querySelector('input')?.focus();
  }
}

async function handlePasteOnItem(index: number, event: ClipboardEvent) {
  const pastedText = event.clipboardData?.getData('text');
  if (!pastedText || !/\r?\n/.test(pastedText)) {
    return;
  }

  event.preventDefault();

  const pastedLines = pastedText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (pastedLines.length === 0) {
    return;
  }

  updateItem(index, pastedLines[0] ?? '');

  for (const [offset, line] of pastedLines.slice(1).entries()) {
    insertItem(index + offset + 1, line);
  }

  await nextTick();
  const focusIndex = Math.min(index + pastedLines.length - 1, items.value.length - 1);
  $itemsInputs.value?.[focusIndex]?.$el?.querySelector('input')?.focus();
}

const onSubmit = handleSubmit(async values => {
  submitResponse.value = await submitTodoList(values);
});
</script>

<style lang="scss" src="./_print.scss" scoped />
<style lang="scss" src="./PMTodoList.scss" scoped />
