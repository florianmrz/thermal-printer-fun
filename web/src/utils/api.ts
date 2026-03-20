import type { RenderTestInput } from '@thermal-printer-fun/shared';

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

export async function submitRenderTest(payload: RenderTestInput) {
  await fetch(`${apiBaseUrl}/api/web/render-test`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// These settings are to be kept in sync with the server-side ones
export const FILE_UPLOAD_OPTIONS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_FILE_TYPES: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/svg+xml',
    'image/tiff',
  ],
};
