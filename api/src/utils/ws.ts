import type { PrinterStatus, WebSocketMessage } from '@thermal-printer-fun/shared';
import { getWebSocketClients } from '../routes/ws.js';
import { getPrinterQueueJobIds, setPrinterStatus } from './printer.js';

export function getPrinterClient() {
  const printerClient = getWebSocketClients().find(client => client.__clientType === 'printer');
  return printerClient ?? null;
}

export function getPrinterStatus(): PrinterStatus {
  const printerClient = getPrinterClient();
  return printerClient ? 'connected' : 'disconnected';
}

/**
 * Broadcast a message to all connected web clients.
 */
export function broadcast(message: WebSocketMessage) {
  getWebSocketClients()
    .filter(client => client.__clientType === 'web')
    .forEach(client => client.send(JSON.stringify(message)));
}

export function broadcastPrinterStatus() {
  const status = getPrinterStatus();
  setPrinterStatus(status);
  broadcast({ type: 'printer-status', status });
}

export function broadcastPrinterQueue() {
  broadcast({ type: 'printer-queue', queueJobIds: getPrinterQueueJobIds() });
}
