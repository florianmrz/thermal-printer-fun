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
