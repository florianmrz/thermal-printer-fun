import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import printer from './routes/printer.js';
import web from './routes/web.js';
import { env } from './env.js';

const app = new Hono();

app.use('/api/*', cors());

app.route('/api/printer', printer);
app.route('/api/web', web);

serve({ fetch: app.fetch, hostname: '0.0.0.0', port: env.PORT }, info => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
