<template>
  <div class="base-pin-input" role="group" :aria-label="ariaLabel ?? `${length}-digit PIN`">
    <input
      v-for="(_, index) in length"
      :key="index"
      ref="inputRefs"
      class="pin-cell"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="*"
      :value="digits[index] ?? ''"
      :disabled="disabled"
      :aria-label="`Digit ${index + 1} of ${length}`"
      @input="handleInput($event as InputEvent, index)"
      @keydown="handleKeydown($event, index)"
      @focus="handleFocus($event)"
      @paste.prevent="handlePaste($event, index)" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    length?: number;
    disabled?: boolean;
    ariaLabel?: string;
  }>(),
  { length: 6 }
);

const model = defineModel<string>({ default: '' });

const emit = defineEmits<{
  complete: [value: string];
}>();

// Internal per-cell digit array
const digits = ref<string[]>(Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''));

const inputRefs = useTemplateRef('inputRefs');

const isComplete = computed(() => digits.value.every(d => d.length === 1));

// Sync model → digits when model changes externally
watch(model, newVal => {
  digits.value = Array.from({ length: props.length }, (_, i) => newVal[i] ?? '');
});

function updateAndEmit(index: number, value: string) {
  digits.value[index] = value;
  const joined = digits.value.join('');
  model.value = joined;
  if (isComplete.value) {
    emit('complete', joined);
  }
}

function focusCell(index: number) {
  const el = inputRefs.value?.[index];
  if (el) {
    el.focus();
    // Place cursor at end
    requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
  }
}

function handleInput(event: InputEvent, index: number) {
  const target = event.target as HTMLInputElement;
  const rawValue = event.data ?? target.value;

  // Multi-char input (e.g. mobile autocomplete or paste via input event)
  if (rawValue.length > 1) {
    distributeChars(rawValue, index);
    return;
  }

  // Only allow digits
  if (rawValue && !/^\d$/.test(rawValue)) {
    target.value = digits.value[index] ?? '';
    return;
  }

  updateAndEmit(index, rawValue);
  target.value = rawValue;

  // Advance focus
  if (rawValue && index < props.length - 1) {
    focusCell(index + 1);
  }
}

function handleKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace') {
    event.preventDefault();
    if (digits.value[index]) {
      // Clear current cell
      updateAndEmit(index, '');
      (event.target as HTMLInputElement).value = '';
    } else if (index > 0) {
      // Move to previous and clear it
      updateAndEmit(index - 1, '');
      const prevEl = inputRefs.value?.[index - 1];
      if (prevEl) {
        prevEl.value = '';
        prevEl.focus();
      }
    }
  } else if (event.key === 'Delete') {
    event.preventDefault();
    updateAndEmit(index, '');
    (event.target as HTMLInputElement).value = '';
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    focusCell(index - 1);
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault();
    focusCell(index + 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    focusCell(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    focusCell(props.length - 1);
  }
}

function handleFocus(event: FocusEvent) {
  const target = event.target as HTMLInputElement;
  // Select existing content so typing replaces it
  target.setSelectionRange(0, target.value.length);
}

function handlePaste(event: ClipboardEvent, index: number) {
  const rawValue = event.clipboardData?.getData('text') ?? '';
  const onlyDigits = rawValue.replace(/\D/g, '');
  if (onlyDigits) {
    distributeChars(onlyDigits, index);
  }
}

function distributeChars(chars: string, startIndex: number) {
  const onlyDigits = chars.replace(/\D/g, '');
  const startAt = onlyDigits.length >= props.length ? 0 : startIndex;
  const lastFilledIndex = Math.min(startAt + onlyDigits.length - 1, props.length - 1);

  for (let i = startAt; i <= lastFilledIndex; i++) {
    const char = onlyDigits[i - startAt] ?? '';
    digits.value[i] = char;
    const el = inputRefs.value?.[i];
    if (el) el.value = char;
  }

  const joined = digits.value.join('');
  model.value = joined;
  if (isComplete.value) emit('complete', joined);

  // Focus the cell after the last filled, or the last cell
  focusCell(Math.min(lastFilledIndex + 1, props.length - 1));
}

/** Focuses the first empty cell, or the last cell if all filled. */
function focus() {
  const firstEmpty = digits.value.findIndex(d => !d);
  focusCell(firstEmpty >= 0 ? firstEmpty : props.length - 1);
}

defineExpose({ focus });
</script>

<style lang="scss" src="./BasePinInput.scss" scoped />
