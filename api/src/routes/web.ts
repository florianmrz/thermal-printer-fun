import { FILE_UPLOAD_OPTIONS, renderTestSchema } from '@thermal-printer-fun/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { convertImageToPrintData } from '../utils/image.js';
import { print } from './ws.js';

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
    print(printData, { printQuality: 'highPrint', cutPaper: true });

    return c.json({ success: true });
  }
);

app.post('/render-test', async c => {
  const body = await c.req.json();
  const parsedBody = renderTestSchema.parse(body);

  console.log(parsedBody);

  return c.json({ success: true });
});

export default app;
