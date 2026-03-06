export type PrinterStatus = 'unknown' | 'connected' | 'disconnected';

interface WebSocketMessagePrinterStatus {
  type: 'printer-status';
  status: PrinterStatus;
}

export type WebSocketMessage = WebSocketMessagePrinterStatus;