import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { env } from "./env.js";
import { HTTPException } from "hono/http-exception";

const app = new Hono();
const { injectWebSocket, upgradeWebSocket, wss } = createNodeWebSocket({ app });

app.post("/api/print", (c) => {
  console.log(`Connected clients: ${wss.clients.size}`);

  // TODO replace with actual print data
  const printData = new Array(100)
    .fill(null)
    .map(() =>
      new Array(72).fill(null).map(() => (Math.random() > 0.5 ? 0xff : 0x00)),
    );

  print(printData, {
    cutPaper: true,
    printQuality: "highPrint",
    lineFeedDots: 200,
  });

  return c.json({ success: true });
});

function print(
  printLines: number[][],
  options?: {
    cutPaper?: boolean;
    printQuality?: "highSpeed" | "normal" | "highPrint";
    lineFeedDots?: number;
  },
) {
  const printerClient = Array.from(wss.clients).find(
    (client) => client.readyState === WebSocket.OPEN,
  );
  if (!printerClient) {
    throw new HTTPException(503, { message: "Printer not connected" });
  }

  // Reset printer and initialize raster mode
  // ESC * r A
  printerClient.send(Uint8Array.from([0x1b, 0x2a, 0x72, 0x41]));

  // Set raster page length to continous mode
  // ESC * r P n NUL (n = page length, 0 for continous print)
  printerClient.send(Uint8Array.from([0x1b, 0x2a, 0x72, 0x50, 0x00, 0x00]));

  // Set raster print quality
  // ESC * r Q n NUL (n = print quality: 0 = high speed, 1 = normal 2 = high print)
  const printQuality = options?.printQuality ?? "highPrint";
  const printQualityMap = {
    highSpeed: 0x30, // 0
    normal: 0x31, // 1
    highPrint: 0x32, // 2
  };
  printerClient.send(
    Uint8Array.from([
      0x1b,
      0x2a,
      0x72,
      0x51,
      printQualityMap[printQuality],
      0x00,
    ]),
  );

  // Set raster FF mode
  // ESC * r F n NUL (n = mode: 0 = allows paper cut, 1 = prevents paper cut)
  const cutPaper = options?.cutPaper ?? true;
  printerClient.send(
    Uint8Array.from([0x1b, 0x2a, 0x72, 0x46, cutPaper ? 0x30 : 0x31, 0x00]),
  );

  // Send raster data (auto line feed)
  // b H 00 + 72 bytes of data
  let linesInChunk = 0;
  const lineChunks: Uint8Array[] = [];
  let currentChunk: Uint8Array = new Uint8Array();
  printLines.forEach((line) => {
    const lineHeader = Uint8Array.from([0x62, 0x48, 0x00]);
    const lineData = Uint8Array.from(line);
    const linePacket = new Uint8Array([...lineHeader, ...lineData]);
    currentChunk = new Uint8Array([...currentChunk, ...linePacket]);
    linesInChunk++;
    if (linesInChunk >= 100) {
      lineChunks.push(currentChunk);
      currentChunk = new Uint8Array();
      linesInChunk = 0;
    }
  });
  lineChunks.forEach((chunk) => printerClient.send(chunk));

  // Move vertical direction position by 100 dots
  // ESC * r Y n NUL (n = number of dots to move)
  if (
    options?.lineFeedDots &&
    typeof options.lineFeedDots === "number" &&
    options.lineFeedDots > 0
  ) {
    const lineFeedAsHex = Array.from(options.lineFeedDots.toString()).map((c) =>
      c.charCodeAt(0),
    );
    printerClient.send(
      Uint8Array.from([0x1b, 0x2a, 0x72, 0x59, ...lineFeedAsHex, 0x00]),
    );
  }

  // Execute FF mode (cuts paper)
  // ESC FF NUL
  printerClient.send(Uint8Array.from([0x1b, 0x0c, 0x00]));
}

app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onOpen(_event, ws) {
      const websocketToken = ws.url?.searchParams.get("token");
      if (websocketToken !== env.WEBSOCKET_TOKEN) {
        ws.close(1008, "Invalid API token");
        return;
      }
      console.log("Client connected");
    },
    onMessage(event) {
      console.log(`Message from client: ${event.data}`);
    },
    onClose: () => {
      console.log("Connection closed");
    },
  })),
);

const server = serve(
  { fetch: app.fetch, hostname: "0.0.0.0", port: 3000 },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
injectWebSocket(server);
