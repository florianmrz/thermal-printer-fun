import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import web from './routes/web.js';
import { injectWebSocket, ws } from './routes/ws.js';

const app = new Hono();

app.use('/api/*', cors());

app.route('/ws', ws);
app.route('/api/web', web);

const server = serve({ fetch: app.fetch, hostname: '0.0.0.0', port: 3000 }, info => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
injectWebSocket(server);
