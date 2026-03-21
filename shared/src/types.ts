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
