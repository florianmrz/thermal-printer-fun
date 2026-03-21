import {
  FILE_UPLOAD_OPTIONS,
  renderLargeTextSchema,
  renderTestSchema,
  type PrintSubmitResponse,
} from '@thermal-printer-fun/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { convertImageToPrintData } from '../utils/image.js';
import { print } from '../utils/printer.js';
import { renderToPng } from '../utils/render.js';

const app = new Hono();

app.post(
  '/print',
  bodyLimit({
    maxSize: FILE_UPLOAD_OPTIONS.MAX_FILE_SIZE,
    onError: c => c.json({ success: false, message: 'File size exceeds the allowed limit' }, 413),
  }),
  async c => {
    const body = await c.req.parseBody();
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

app.post('/print-render', async c => {
  const body = await c.req.json();
  const data = renderTestSchema.parse(body);

  const fakeId = Math.random().toString(36).substring(2, 10);
  const renderData = { ...data, id: fakeId };
  const printData = () => renderToPng(renderData).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId, renderData } satisfies PrintSubmitResponse);
});

app.post('/print-large-text', async c => {
  const body = await c.req.json();
  const data = renderLargeTextSchema.parse(body);

  const printData = () => renderToPng(data).then(image => convertImageToPrintData(image));
  const { jobId } = print(printData, { printQuality: 'highPrint', cutPaper: true });
  return c.json({ success: true, jobId, renderData: data } satisfies PrintSubmitResponse);
});

export default app;
