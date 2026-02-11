import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { env } from "./env.js";
import { HTTPException } from "hono/http-exception";

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get("/api", (c) => {
  const apiToken = c.req.header("Authorization")?.replace("Bearer ", "");
  if (apiToken !== env.API_TOKEN) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  return c.json({ foo: "bar" });
});

app.get(
  "/ws",
  upgradeWebSocket((c) => ({
    onOpen(_event, ws) {
      const websocketToken = ws.url?.searchParams.get("token");
      if (websocketToken !== env.WEBSOCKET_TOKEN) {
        ws.close(1008, "Invalid API token");
        return;
      }
      ws.send(JSON.stringify({ type: "print" }));
    },
    onMessage(event, ws) {
      console.log(`Message from client: ${event.data}`);
      ws.send(JSON.stringify({ type: "test", payload: "Hello from server!" }));
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
