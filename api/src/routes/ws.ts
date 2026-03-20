import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type WebSocket from 'ws';
import type { PrinterStatus, WebSocketMessage } from '@thermal-printer-fun/shared';
import { env } from '../env.js';

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
        broadcastToClients({ type: 'printer-status', status: getPrinterStatus() }, [ws.raw!]);
      },
    };
  })
);

/**
 * Broadcast a message to a given list of connected clients, defaulting to all clients if none are specified.
 */
function broadcastToClients(message: WebSocketMessage, clients?: WebSocket[]) {
  (clients ?? Array.from(wss.clients)).forEach(client => {
    client.send(JSON.stringify(message));
  });
}

function getPrinterClient(): WebSocket | null {
  const printerClient = Array.from(wss.clients).find(
    client => (client as WebSocketWithIdentifier).__clientType === 'printer'
  );
  return printerClient ?? null;
}

function getPrinterStatus(): PrinterStatus {
  const printerClient = getPrinterClient();
  return printerClient ? 'connected' : 'disconnected';
}

async function sendToPrinter(printerClient: WebSocket, data: Uint8Array) {
  await new Promise<void>((resolve, reject) => {
    printerClient.send(data, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function print(
  printLines: Uint8Array<ArrayBuffer>[],
  options?: {
    /**
     * Whether to cut the paper after printing.
     * If set to false, the printer will not cut the paper, allowing for continuous printing.
     *
     * @default true
     */
    cutPaper?: boolean;
    /**
     * The print quality.
     *
     * @default 'highPrint'
     */
    printQuality?: 'highSpeed' | 'normal' | 'highPrint';
    /**
     * The number of dots to feed after printing.
     *
     * @default 0
     */
    lineFeedDots?: number;
  }
) {
  const printerClient = getPrinterClient();
  if (!printerClient) {
    throw new HTTPException(503, { message: 'Printer not connected' });
  }

  // Reset printer and initialize raster mode
  // ESC * r A
  await sendToPrinter(printerClient, Uint8Array.from([0x1b, 0x2a, 0x72, 0x41]));

  // Set raster page length to continous mode
  // ESC * r P n NUL (n = page length, 0 for continous print)
  await sendToPrinter(printerClient, Uint8Array.from([0x1b, 0x2a, 0x72, 0x50, 0x00, 0x00]));

  // Set raster print quality
  // ESC * r Q n NUL (n = print quality: 0 = high speed, 1 = normal 2 = high print)
  const printQuality = options?.printQuality ?? 'highPrint';
  const printQualityMap = {
    highSpeed: 0x30, // 0
    normal: 0x31, // 1
    highPrint: 0x32, // 2
  };
  await sendToPrinter(printerClient, Uint8Array.from([0x1b, 0x2a, 0x72, 0x51, printQualityMap[printQuality], 0x00]));

  // Set raster FF mode
  // ESC * r F n NUL (n = mode: 0 = allows paper cut, 1 = prevents paper cut)
  const cutPaper = options?.cutPaper ?? true;
  await sendToPrinter(printerClient, Uint8Array.from([0x1b, 0x2a, 0x72, 0x46, cutPaper ? 0x30 : 0x31, 0x00]));

  // Send raster data (auto line feed)
  // b H 00 + 72 bytes of data
  let linesInChunk = 0;
  const lineChunks: Uint8Array[] = [];
  let currentChunk: Uint8Array = new Uint8Array();
  printLines.forEach(line => {
    const lineHeader = Uint8Array.from([0x62, 0x48, 0x00]);
    const linePacket = new Uint8Array([...lineHeader, ...line]);
    currentChunk = new Uint8Array([...currentChunk, ...linePacket]);
    linesInChunk++;
    if (linesInChunk >= 100) {
      lineChunks.push(currentChunk);
      currentChunk = new Uint8Array();
      linesInChunk = 0;
    }
  });
  if (currentChunk.length > 0) {
    lineChunks.push(currentChunk);
  }
  for (const chunk of lineChunks) {
    await sendToPrinter(printerClient, chunk);
  }

  // Move vertical direction position by 100 dots
  // ESC * r Y n NUL (n = number of dots to move)
  if (options?.lineFeedDots && typeof options.lineFeedDots === 'number' && options.lineFeedDots > 0) {
    const lineFeedAsHex = Array.from(options.lineFeedDots.toString()).map(c => c.charCodeAt(0));
    await sendToPrinter(printerClient, Uint8Array.from([0x1b, 0x2a, 0x72, 0x59, ...lineFeedAsHex, 0x00]));
  }

  // Execute FF mode (cuts paper)
  // ESC FF NUL
  await sendToPrinter(printerClient, Uint8Array.from([0x1b, 0x0c, 0x00]));
}

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
      broadcastToClients({ type: 'printer-status', status: getPrinterStatus() });
    },
    onMessage(event) {
      console.log(`Message from client: ${event.data}`);
    },
    onClose: () => {
      broadcastToClients({ type: 'printer-status', status: getPrinterStatus() });
    },
  }))
);

export { injectWebSocket, print, app as ws };
