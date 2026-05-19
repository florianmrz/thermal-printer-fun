import { zValidator } from '@hono/zod-validator';
import {
  FILE_UPLOAD_OPTIONS,
  renderFakeReceiptInputSchema,
  renderLargeTextDataSchema,
  renderSentryErrorInputSchema,
  renderSudokuDataSchema,
  renderTodoListDataSchema,
  renderWebsiteInputSchema,
  type PrintSubmitResponse,
  type SentryWebhookPayload,
} from '@thermal-printer-fun/shared';
import { Hono, type Context } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { bodyLimit } from 'hono/body-limit';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { env } from '../env.js';
import { generateFakeReceipt } from '../utils/fake-receipt.js';
import { convertImageToPrintData } from '../utils/image.js';
import { print } from '../utils/printer.js';
import { getConnInfo } from '@hono/node-server/conninfo';
import { renderToPng, renderWebsiteToPng } from '../utils/render.js';

const app = new Hono();

/**
 * Auth code
 */

const AUTH_RATE_LIMIT_FREE_ATTEMPTS = 5;
const AUTH_RATE_LIMIT_MAX_BLOCK_MS = 15 * 60 * 1000; // 15 minutes

interface AuthRateLimitEntry {
  failedAttempts: number;
  blockedUntil: number;
}

const authRateLimitMap = new Map<string, AuthRateLimitEntry>();

function pruneAuthRateLimit() {
  const now = Date.now();
  for (const [ip, entry] of authRateLimitMap) {
    if (entry.blockedUntil < now && entry.failedAttempts <= AUTH_RATE_LIMIT_FREE_ATTEMPTS) {
      authRateLimitMap.delete(ip);
    }
  }
}

function assertAuthCode(c: Context) {
  if (env.AUTH_CODE.length === 0) {
    return;
  }

  const ip = getConnInfo(c).remote.address || 'unknown';
  const now = Date.now();
  const entry = authRateLimitMap.get(ip);

  if (entry && entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    throw new HTTPException(429, { message: `Too many failed attempts. Try again in ${retryAfterSeconds}s.` });
  }

  const providedCode = c.req.header('X-Auth-Code') || '';
  if (providedCode !== env.AUTH_CODE) {
    const current = entry ?? { failedAttempts: 0, blockedUntil: 0 };
    current.failedAttempts++;

    if (current.failedAttempts > AUTH_RATE_LIMIT_FREE_ATTEMPTS) {
      const exponent = current.failedAttempts - AUTH_RATE_LIMIT_FREE_ATTEMPTS - 1;
      const blockMs = Math.min(Math.pow(2, exponent) * 1000, AUTH_RATE_LIMIT_MAX_BLOCK_MS);
      current.blockedUntil = now + blockMs;
    }

    authRateLimitMap.set(ip, current);
    if (authRateLimitMap.size % 100 === 0) {
      pruneAuthRateLimit();
    }

    throw new HTTPException(401, { message: 'Incorrect code. Please try again.' });
  }

  if (entry) {
    authRateLimitMap.delete(ip);
  }
}

const authMiddleware = createMiddleware((c, next) => {
  assertAuthCode(c);
  return next();
});

app.get('/code/status', c => c.json({ enabled: env.AUTH_CODE.length > 0 }));

/**
 * Print
 */

app.post(
  '/print',
  bodyLimit({
    maxSize: FILE_UPLOAD_OPTIONS.MAX_FILE_SIZE,
    onError: c => c.json({ success: false, message: 'File size exceeds the allowed limit' }, 413),
  }),
  async c => {
    const body = await c.req.parseBody();
    assertAuthCode(c); // This has to be happen after parsing the body

    const file = body['file'];

    if (!file || typeof file === 'string') {
      throw new HTTPException(400, { message: 'No file provided' });
    }

    if (!FILE_UPLOAD_OPTIONS.ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new HTTPException(400, { message: 'Invalid file type' });
    }

    const bytes = await file.bytes();
    const printData = await convertImageToPrintData(bytes);
    const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });

    return c.json({ success: true, jobId } satisfies PrintSubmitResponse);
  }
);

app.post('/print/large-text', authMiddleware, zValidator('json', renderLargeTextDataSchema), async c => {
  const data = c.req.valid('json');

  const printData = () => renderToPng(data).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId, renderData: data } satisfies PrintSubmitResponse);
});

app.post('/print/sudoku', authMiddleware, zValidator('json', renderSudokuDataSchema), async c => {
  const data = c.req.valid('json');

  const printData = () => renderToPng(data).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId, renderData: data } satisfies PrintSubmitResponse);
});

app.post('/print/todo-list', authMiddleware, zValidator('json', renderTodoListDataSchema), async c => {
  const data = c.req.valid('json');

  const printData = () => renderToPng(data).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId, renderData: data } satisfies PrintSubmitResponse);
});

app.post(
  '/print/sentry-error',
  bearerAuth({ token: env.SENTRY_ERROR_TOKEN }),
  authMiddleware,
  zValidator('json', renderSentryErrorInputSchema),
  async c => {
    const data = c.req.valid('json');
    const finalData = { ...data, data: data.data as SentryWebhookPayload };

    const printData = () => renderToPng(finalData).then(image => convertImageToPrintData(image));
    const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
    return c.json({ success: true, jobId, renderData: finalData } satisfies PrintSubmitResponse);
  }
);

app.post('/print/fake-receipt', authMiddleware, zValidator('json', renderFakeReceiptInputSchema), async c => {
  const data = c.req.valid('json');
  const { topic } = data;

  const receipt = await generateFakeReceipt(topic);
  const finalData = { _type: 'fake-receipt' as const, topic, ...receipt };

  const printData = () => renderToPng(finalData).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId, renderData: finalData } satisfies PrintSubmitResponse);
});

app.post('/print/website', authMiddleware, zValidator('json', renderWebsiteInputSchema), async c => {
  const data = c.req.valid('json');
  const { url, fullPage } = data;

  const printData = () => renderWebsiteToPng(url, fullPage).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId } satisfies PrintSubmitResponse);
});

export default app;
