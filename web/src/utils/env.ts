import z from 'zod';

const { data: env, error } = z
  .object({
    VITE_ENV: z.enum(['development', 'production']),
    VITE_BASE_URL: z.url(),
    VITE_API_BASE_URL: z.url(),
  })
  .safeParse(import.meta.env);

if (error) {
  console.error('Invalid environment variables, please check your ".env" file. See error details below:');
  throw error;
}
export default env as NonNullable<typeof env>;
