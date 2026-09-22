import type { RenderData } from './validation.js';

export type PrinterStatus = 'unknown' | 'connected' | 'disconnected';

/**
 * Response of the state endpoint the web app polls while its tab is active.
 */
export interface PrinterStateResponse {
  status: PrinterStatus;
  queueJobIds: string[];
}

export interface PrintSubmitResponse {
  success: true;
  jobId: string;
  renderData?: RenderData;
}
