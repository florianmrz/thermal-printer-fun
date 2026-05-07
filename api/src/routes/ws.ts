import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import WebSocket from 'ws';
import { env } from '../env.js';
import { broadcastPrinterQueue, broadcastPrinterStatus } from '../utils/ws.js';

const app = new Hono().basePath('/ws');
const { injectWebSocket, upgradeWebSocket, wss } = createNodeWebSocket({ app });

/**
 * To distinguish between printer clients and web clients, we add a custom property to underlying WebSocket object.
 */
type WebSocketWithIdentifier = WebSocket & { __clientType: 'printer' | 'web'; __id: string; __lastHeartBeat?: number };

app.get(
  '/web',
  upgradeWebSocket(_c => {
    return {
      onOpen(_event, ws) {
        const newClient = ws.raw as WebSocketWithIdentifier;
        newClient.__clientType = 'web';
        newClient.__id = nanoid();

        newClient.on('pong', () => (newClient.__lastHeartBeat = Date.now()));

        broadcastPrinterStatus();
        broadcastPrinterQueue();
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
      const newClient = ws.raw as WebSocketWithIdentifier;
      newClient.__clientType = 'printer';
      newClient.__id = nanoid();

      // Disconnect any other printer clients that might be still connected.
      getWebSocketClients().forEach(client => {
        if (client.__id !== newClient.__id && client.__clientType === 'printer') {
          client.terminate();
        }
      });

      newClient.on('pong', () => (newClient.__lastHeartBeat = Date.now()));

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

/**
 * Send a ping to all connected clients every 10 seconds to keep the WebSocket connections alive and detect any stale connections.
 */
setInterval(() => {
  getWebSocketClients().forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }

    if (client.__lastHeartBeat && Date.now() - client.__lastHeartBeat > 10_000) {
      client.terminate();
    }
  });
}, 3_000);

export { injectWebSocket, app as ws };
