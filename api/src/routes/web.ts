import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.post(
  '/print',
  bodyLimit({
    maxSize: 10 * 1024 * 1024, // 10 MB
    onError: c => c.json({ success: false, message: 'File size exceeds the allowed limit' }, 413),
  }),
  async c => {
    const body = await c.req.parseBody();
    const file = body['file'];

    if(!file || typeof file === 'string') {
      throw new HTTPException(400, { message: 'No file provided' });
    }

    const allowedFileTypes = ['image/png', 'image/jpeg']; // TODO adjust to actual files
    if (!allowedFileTypes.includes(file.type)) {
      throw new HTTPException(400, { message: 'Invalid file type' });
    }

    return c.json({ success: true });
  }
);

export default app;
