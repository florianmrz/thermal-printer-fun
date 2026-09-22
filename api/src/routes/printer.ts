import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { env } from '../env.js';
import { getPrinterPollIntervalMs, recordPrinterPoll } from '../utils/presence.js';
import { claimNextJob, hasJobsWaiting } from '../utils/printer.js';

const app = new Hono();

app.use('/poll', bearerAuth({ token: env.PRINTER_TOKEN }));

/**
 * The single endpoint the printer client talks to. Every poll both reports the client's state and
 * picks up at latest print job.
 *
 * Responds with `200` and the raw print data as the body when a job is waiting, or `204` when there
 * is nothing to print. Either way `X-Poll-Interval-Ms` tells the client when to come back, which
 * lets us tune the poll rate without reflashing the device.
 */
app.get('/poll', c => {
  const usbReady = c.req.query('usbReady') === '1';
  const rssi = Number.parseInt(c.req.query('rssi') ?? '', 10);
  const freeHeap = Number.parseInt(c.req.query('freeHeap') ?? '', 10);

  const job = usbReady ? claimNextJob() : null;
  const pollIntervalMs = getPrinterPollIntervalMs(hasJobsWaiting());

  recordPrinterPoll({
    intervalMs: pollIntervalMs,
    usbReady,
    rssi: Number.isNaN(rssi) ? undefined : rssi,
    freeHeap: Number.isNaN(freeHeap) ? undefined : freeHeap,
  });

  c.header('X-Poll-Interval-Ms', String(pollIntervalMs));

  if (!job) {
    return c.body(null, 204);
  }

  console.log(`Handing print job ${job.id} (${job.data.byteLength} bytes) to the printer client.`);
  c.header('X-Job-Id', job.id);
  c.header('Content-Type', 'application/octet-stream');
  c.header('Content-Length', String(job.data.byteLength));
  return c.body(job.data.buffer, 200);
});

export default app;
