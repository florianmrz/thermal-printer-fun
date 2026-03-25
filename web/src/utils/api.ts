import type { PrintSubmitResponse, RenderDataLargeText, RenderDataSudoku } from '@thermal-printer-fun/shared';
import env from './env';

export async function submitImagePrint(file: File) {
  const formData = new FormData();
  formData.set('file', file);
  return fetch(`${env.VITE_API_BASE_URL}/api/web/print`, {
    body: formData,
    method: 'POST',
  }).then(res => res.json() as Promise<PrintSubmitResponse>);
}

export async function submitLargeText(payload: RenderDataLargeText) {
  return fetch(`${env.VITE_API_BASE_URL}/api/web/print/large-text`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(res => res.json() as Promise<PrintSubmitResponse>);
}

export async function submitSudoku(payload: RenderDataSudoku) {
  return fetch(`${env.VITE_API_BASE_URL}/api/web/print/sudoku`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(res => res.json() as Promise<PrintSubmitResponse>);
}
