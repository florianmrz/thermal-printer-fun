import type { RenderData } from './validation.js';

export type PrinterStatus = 'unknown' | 'connected' | 'disconnected';

interface WebSocketMessagePrinterStatus {
  type: 'printer-status';
  status: PrinterStatus;
}

interface WebSocketMessagePrinterQueue {
  type: 'printer-queue';
  queueJobIds: string[];
}

export type WebSocketMessage = WebSocketMessagePrinterStatus | WebSocketMessagePrinterQueue;

export interface PrintSubmitResponse {
  success: true;
  jobId: string;
  renderData?: RenderData;
}
