import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { env } from "./env.js";
import { HTTPException } from "hono/http-exception";

const app = new Hono();
const { injectWebSocket, upgradeWebSocket, wss } = createNodeWebSocket({ app });

app.post("/api/print", (c) => {
  console.log(`Connected clients: ${wss.clients.size}`);

  print();

  return c.json({ success: true });
});

function print() {
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

  // TODO this seems to not actually make that big of a difference
  // Set raster print quality
  // ESC * r Q n NUL (n = print quality: 0 = high speed, 1 = normal 2 = high print)
  printerClient.send(Uint8Array.from([0x1b, 0x2a, 0x72, 0x51, 0x00, 0x00]));

  // Set raster FF mode
  // ESC * r F n NUL (n = mode: 1 = prevents paper cut, 0 = allows paper cut)
  // TODO doesn't work?
  // const cutPaper = false;
  // printerClient.send(Uint8Array.from([0x1b, 0x2a, 0x72, 0x46, cutPaper ? 0x00 : 0x01, 0x00]));

  // Send raster data (auto line feed)
  // b H 00 + 72 bytes of data
  for (let i = 0; i < 1; i++) {
    const data = Uint8Array.from([
      0x62,
      0x48,
      0x00,
      ...new Array(72)
        .fill(null)
        .map(() => (Math.random() > 0.5 ? 0xff : 0x00)),
    ]);
    const finalData = [];
    // Use chunks of 100 lines to avoid overwhelming the printer
    for (let j = 0; j < 100; j++) {
      finalData.push(...data);
    }
    printerClient.send(finalData);
  }

  // Move vertical direction position by 100 dots
  // TODO doesn't work?
  // printerClient.send(Uint8Array.from([0x1b, 0x2a, 0x72, 0x59, 0x64, 0x00]));

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
