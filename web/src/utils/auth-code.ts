import { useLocalStorage } from '@vueuse/core';
import { ref } from 'vue';

const AUTH_CODE_STORAGE_KEY = 'thermal-printer-fun_auth-code';

export const authCode = useLocalStorage<string>(AUTH_CODE_STORAGE_KEY, '');
export const authCodeRequired = ref<boolean>(false);
export const authCodeError = ref<string | null>(null);
export const pendingAuthRequest = ref<boolean>(false);

let resolveAuthCodeRequest: ((code: string) => void) | null = null;
let rejectAuthCodeRequest: (() => void) | null = null;

/**
 * Returns the persisted auth code, empty string if auth is not required or requests an code via the overlay.
 */
export async function getAuthCode(): Promise<string> {
  if (!authCodeRequired.value) {
    return '';
  }

  if (authCode.value) {
    return authCode.value;
  }

  pendingAuthRequest.value = true;
  const code = await new Promise<string>((resolve, reject) => {
    resolveAuthCodeRequest = resolve;
    rejectAuthCodeRequest = () => {
      pendingAuthRequest.value = false;
      reject(new Error('Auth code input was cancelled. Print was not submitted.'));
    };
  });
  pendingAuthRequest.value = false;
  return code;
}

/**
 * Called by the overlay when the user submits a code.
 * Persists it and resolves the pending promise.
 */
export function provideAuthCode(code: string | null) {
  authCodeError.value = null;

  if (code === null) {
    // User has cancelled the auth code input
    authCode.value = '';
    rejectAuthCodeRequest?.();
  } else {
    authCode.value = code;
    resolveAuthCodeRequest?.(code);
  }

  resolveAuthCodeRequest = null;
  rejectAuthCodeRequest = null;
}
