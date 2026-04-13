import z from "zod";

const envSchema = z.object({
  ENV: z.enum(["development", "production"]),
  WEBSOCKET_TOKEN: z.string().min(32),
  SENTRY_ERROR_TOKEN: z.string().min(32),
  WEB_APP_BASE_URL: z.url(),
  RENDER_BASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
