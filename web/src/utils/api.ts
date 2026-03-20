import type { RenderDataTest } from '@thermal-printer-fun/shared';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(`Environment variable "VITE_API_BASE_URL" is not defined.`);
}

export async function submitImagePrint(file: File) {
  const formData = new FormData();
  formData.set('file', file);
  await fetch(`${apiBaseUrl}/api/web/print`, {
    body: formData,
    method: 'POST',
  });
}

export async function submitRenderTest(payload: RenderDataTest) {
  await fetch(`${apiBaseUrl}/api/web/print-render`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
