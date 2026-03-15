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
  }).then(res => res.json());
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
