<template>
  <section class="pm-sudoku">
    <form class="form" @submit.prevent="onSubmit">
      <PMItemHeader title="Sudoku" description="Print a Sudoku puzzle to solve on paper." />

      <BaseSelect
        v-model="difficulty"
        name="sudoku-difficulty"
        label="Difficulty"
        required
        :options="
          renderSudokuInputSchema.shape.difficulty.options.map(option => ({
            label: `${option.charAt(0).toUpperCase()}${option.slice(1)}`,
            value: option,
          }))
        "
        :error="errors.difficulty" />

      <BaseButton type="submit" :disabled="isSubmitting">Print</BaseButton>

      <BaseButton v-if="printedSudokuSolution" type="button" variant="outlined" @click="printSolution"
        >Print Solution</BaseButton
      >

      <PMPrintJobResult v-if="submitResponse" :jobId="submitResponse.jobId" :renderData="submitResponse.renderData" />
    </form>
  </section>
</template>

<script setup lang="ts">
import { renderSudokuInputSchema, type PrintSubmitResponse } from '@thermal-printer-fun/shared';
import { getSudoku } from 'sudoku-gen';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { submitSudoku } from '../../../utils/api';
import BaseButton from '../../base/BaseButton/BaseButton.vue';
import BaseSelect from '../../base/BaseSelect/BaseSelect.vue';
import PMItemHeader from './PMItemHeader.vue';
import PMPrintJobResult from './PMPrintJobResult.vue';

const { defineField, errors, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    _type: 'sudoku',
    difficulty: 'medium',
  },
  validationSchema: renderSudokuInputSchema,
});

const [difficulty] = defineField('difficulty');
const submitResponse = ref<PrintSubmitResponse | null>(null);
const printedSudokuSolution = ref<number[][] | null>(null);

const onSubmit = handleSubmit(async values => {
  const sudoku = getSudoku(values.difficulty);

  submitResponse.value = await submitSudoku({
    _type: 'sudoku',
    data: convertSudokuToArray(sudoku.puzzle),
  });

  printedSudokuSolution.value = convertSudokuToArray(sudoku.solution);
});

async function printSolution() {
  if (!printedSudokuSolution.value) return;

  submitResponse.value = await submitSudoku({
    _type: 'sudoku',
    data: printedSudokuSolution.value,
  });
}

/**
 * Convert `sudoku-gen` output to our internal format.
 *
 * Example output from `sudoku-gen`:
 * '41--75-----53--7--2-36-81--7-9--25-1-3--9-47--2-1-7---6587--9-----26-8--1925---47'
 *
 * Should be converted to a 9x9 array where empty cells are represented as 0:
 * [
 *   [4, 1, 0, 0, 7, 5, 0, 0, 0],
 *   [0, 5, 3, 0, 0, 7, 0, 0, 2],
 *   [0, 3, 6, 0, 8, 1, 0, 0, 0],
 *   [0, 7, 0, 9, 0, 0, 2, 5, 0],
 *   [1, 0, 3, 0, 0, 0, 9, 0, 4],
 *   [0, 0, 0, 4, 7, 0, 0, 1, 0],
 *   [0, 0, 7, 0, 0, 0, 6, 5, 8],
 *   [0, 0, 0, 0, 2, 6, 8, 0, 0],
 *   [0, 0, 0, 1, 9, 2, 5, 0, 0],
 * ]
 */
function convertSudokuToArray(sudoku: string): number[][] {
  const convertedSudoku = [];
  for (let i = 0; i < 9; i++) {
    const row = [];
    for (let j = 0; j < 9; j++) {
      const char = sudoku[i * 9 + j];
      row.push(char === '-' ? 0 : parseInt(char!, 10));
    }
    convertedSudoku.push(row);
  }
  return convertedSudoku;
}
</script>

<style lang="scss" src="./PMSudoku.scss" scoped />
