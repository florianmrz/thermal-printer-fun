import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import type WebSocket from 'ws';
import { env } from '../env.js';
import { broadcastPrinterStatus } from '../utils/ws.js';

const app = new Hono().basePath('/ws');
const { injectWebSocket, upgradeWebSocket, wss } = createNodeWebSocket({ app });

/**
 * To distinguish between printer clients and web clients, we add a custom property to underlying WebSocket object.
 */
type WebSocketWithIdentifier = WebSocket & { __clientType: 'printer' | 'web' };

app.get(
  '/web',
  upgradeWebSocket(_c => {
    return {
      onOpen(_event, ws) {
        (ws.raw as WebSocketWithIdentifier).__clientType = 'web';
        broadcastPrinterStatus();
      },
    };
  })
);

app.get(
  '/printer',
  upgradeWebSocket(() => ({
    onOpen(_event, ws) {
      const websocketToken = ws.url?.searchParams.get('token');
      if (websocketToken !== env.WEBSOCKET_TOKEN) {
        ws.close(1008, 'Invalid API token');
        return;
      }
      (ws.raw as WebSocketWithIdentifier).__clientType = 'printer';
      broadcastPrinterStatus();
    },
    onMessage(event) {
      console.log(`Message from client: ${event.data}`);
    },
    onClose: () => {
      broadcastPrinterStatus();
    },
  }))
);

export function getWebSocketClients() {
  return Array.from(wss.clients) as WebSocketWithIdentifier[];
}

export { injectWebSocket, app as ws };
