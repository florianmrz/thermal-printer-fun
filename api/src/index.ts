import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { injectWebSocket, print, ws } from './routes/ws.js';
import web from './routes/web.js';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('/api/*', cors())

app.route('/ws', ws);
app.route('/api/web', web)

app.post('/api/web/print', c => {
  // TODO replace with actual print data
  const printData = Array.from({ length: 100 }, () =>
    Array.from({ length: 72 }, () => (Math.random() > 0.5 ? 0xff : 0x00))
  );

  print(printData, {
    cutPaper: true,
    printQuality: 'highPrint',
    lineFeedDots: 200,
  });

  return c.json({ success: true });
});

const server = serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3000 }, info => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
injectWebSocket(server);
