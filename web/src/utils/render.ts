import type { RenderData } from '@thermal-printer-fun/shared';

export function parseRenderData(input: string) {
  try {
    const data = JSON.parse(window.atob(input));
    return data as RenderData;
  } catch (error) {
    throw new Error(`Failed to parse render data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function encodeRenderData(data: RenderData) {
  const json = JSON.stringify(data);
  return window.btoa(json);
}
