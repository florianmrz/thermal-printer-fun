import type {
  PrintSubmitResponse,
  RenderDataLargeText,
  RenderDataSudoku,
  RenderDataTodoList,
  RenderInputFakeReceipt,
  RenderInputWebsite,
} from '@thermal-printer-fun/shared';
import { authCode, authCodeError, getAuthCode } from './auth-code';
import env from './env';

class ApiError extends Error {
  readonly name: 'ApiError';
  constructor(message?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return String(error);
  }
}

export async function getAuthCodeStatus(): Promise<boolean> {
  const res = await fetch(`${env.VITE_API_BASE_URL}/api/web/code/status`)
    .then(res => res.json() as Promise<{ enabled: boolean }>)
    .then(data => data.enabled)
    .catch(err => console.error('Failed to fetch auth code state:', err));

  return res ?? false;
}

async function fetchWithAuth(url: string, init: RequestInit): Promise<PrintSubmitResponse> {
  const code = await getAuthCode();
  const headers = { ...(init.headers as Record<string, string> | undefined), 'X-Auth-Code': code };
  const res = await fetch(url, { ...init, headers });

  if (res.status === 401 || res.status === 429) {
    // Request failed due to auth, clear current code and ask for another code
    authCode.value = '';
    authCodeError.value = (await res.text()) || 'Unauthorized. Please enter a valid code.';
    return fetchWithAuth(url, init);
  } else if (!res.ok) {
    const errorText = await res.text();
    console.error('API request failed:', errorText);
    if (errorText) {
      throw new ApiError(errorText);
    }
  }

  return res.json() as Promise<PrintSubmitResponse>;
}

export async function submitImagePrint(file: File) {
  const formData = new FormData();
  formData.set('file', file);
  return fetchWithAuth(`${env.VITE_API_BASE_URL}/api/web/print`, {
    body: formData,
    method: 'POST',
  });
}

export async function submitLargeText(payload: RenderDataLargeText) {
  return fetchWithAuth(`${env.VITE_API_BASE_URL}/api/web/print/large-text`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function submitSudoku(payload: RenderDataSudoku) {
  return fetchWithAuth(`${env.VITE_API_BASE_URL}/api/web/print/sudoku`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function submitTodoList(payload: RenderDataTodoList) {
  return fetchWithAuth(`${env.VITE_API_BASE_URL}/api/web/print/todo-list`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function submitWebsite(payload: RenderInputWebsite) {
  return fetchWithAuth(`${env.VITE_API_BASE_URL}/api/web/print/website`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function submitFakeReceipt(payload: RenderInputFakeReceipt) {
  return fetchWithAuth(`${env.VITE_API_BASE_URL}/api/web/print/fake-receipt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
