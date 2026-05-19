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
import { renderToPng, renderWebsiteToPng } from '../utils/render.js';

const app = new Hono();

/**
 * Auth code
 */

function assertAuthCode(c: Context) {
  if (env.AUTH_CODE.length === 0) {
    return;
  }

  const providedCode = c.req.header('X-Auth-Code') || '';
  if (providedCode !== env.AUTH_CODE) {
    throw new HTTPException(401, { message: 'Incorrect code. Please try again.' });
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
