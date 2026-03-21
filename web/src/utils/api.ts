import type { RenderLargeTextInput, RenderTestInput } from '@thermal-printer-fun/shared';

interface PrintSubmitResponse {
  success: boolean;
  jobId: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(`Environment variable "VITE_API_BASE_URL" is not defined.`);
}

export async function submitImagePrint(file: File) {
  const formData = new FormData();
  formData.set('file', file);
  return fetch(`${apiBaseUrl}/api/web/print`, {
    body: formData,
    method: 'POST',
  }).then(res => res.json() as Promise<PrintSubmitResponse>);
}

export async function submitRenderTest(payload: RenderTestInput) {
  return fetch(`${apiBaseUrl}/api/web/print-render`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(res => res.json() as Promise<PrintSubmitResponse>);
}

export async function submitLargeText(payload: RenderLargeTextInput) {
  return fetch(`${apiBaseUrl}/api/web/print-large-text`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(res => res.json() as Promise<PrintSubmitResponse>);
}
