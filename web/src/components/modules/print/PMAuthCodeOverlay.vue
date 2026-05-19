<template>
  <dialog ref="dialogRef" class="overlay-dialog" clsoedby="closerequest" @close="handleCancel">
    <div class="overlay-panel">
      <div class="overlay-header">
        <BaseIcon icon="unlock" size="large" class="overlay-icon" />
        <h2 id="overlay-title" class="overlay-title">Passcode required</h2>
      </div>

      <p class="overlay-description">Enter the 6-digit passcode to continue.</p>

      <form class="overlay-form" @submit.prevent="handleSubmit">
        <BasePinInput
          ref="pinInputRef"
          v-model="code"
          :length="6"
          :disabled="isSubmitting"
          aria-label="Passcode"
          @complete="handleSubmit" />

        <p v-if="authCodeError" class="overlay-error" role="alert">{{ authCodeError }}</p>

        <div class="actions-container">
          <BaseButton type="button" variant="outlined" :disabled="isSubmitting" @click="handleCancel">
            Cancel
          </BaseButton>
          <BaseButton type="submit" variant="filled" :loading="isSubmitting" :disabled="code.length < 6">
            Submit
          </BaseButton>
        </div>
      </form>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import { authCodeError, pendingAuthRequest, provideAuthCode } from '../../../utils/auth-code';
import BaseIcon from '../../base/BaseIcon/BaseIcon.vue';
import BasePinInput from '../../base/BasePinInput/BasePinInput.vue';
import BaseButton from '../../base/BaseButton/BaseButton.vue';

const code = ref('');
const isSubmitting = ref(false);
const pinInputRef = ref<InstanceType<typeof BasePinInput> | null>(null);
const dialogRef = useTemplateRef<HTMLDialogElement>('dialogRef');

// Auto-focus pin input when overlay opens, and reset state
watch(pendingAuthRequest, open => {
  if (open) {
    code.value = '';
    isSubmitting.value = false;
    // Show dialog and focus pin input on next tick after render
    requestAnimationFrame(() => {
      dialogRef.value?.showModal();
      requestAnimationFrame(() => pinInputRef.value?.focus());
    });
  } else {
    dialogRef.value?.close();
  }
});

function handleSubmit() {
  if (code.value.length < 6 || isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  provideAuthCode(code.value);
}

function handleCancel() {
  // If the user closes the dialog without submitting a code, we should still mark the auth request as resolved to avoid blocking the UI indefinitely
  dialogRef.value?.close();
  if (pendingAuthRequest.value) {
    provideAuthCode(null);
  }
}
</script>

<style lang="scss" src="./PMAuthCodeOverlay.scss" scoped />
