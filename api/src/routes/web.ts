import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { convertImageToPrintData } from '../utils/image.js';
import { print } from './ws.js';

const app = new Hono();

app.post(
  '/print',
  bodyLimit({
    // TODO already validate client-side
    maxSize: 10 * 1024 * 1024, // 10 MB
    onError: c => c.json({ success: false, message: 'File size exceeds the allowed limit' }, 413),
  }),
  async c => {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || typeof file === 'string') {
      throw new HTTPException(400, { message: 'No file provided' });
    }

    // TODO already validate client-side
    const allowedFileTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
      'image/tiff',
    ];
    if (!allowedFileTypes.includes(file.type)) {
      throw new HTTPException(400, { message: 'Invalid file type' });
    }

    const bytes = await file.bytes();
    const printData = await convertImageToPrintData(bytes);
    print(printData, { printQuality: 'highPrint', cutPaper: true });

    return c.json({ success: true });
  }
);

export default app;
