import z from 'zod';

const env = z
  .object({
    VITE_API_BASE_URL: z.url(),
  })
  .parse(import.meta.env);

export default env;
