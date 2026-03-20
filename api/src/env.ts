import z from "zod";

const envSchema = z.object({
  WEBSOCKET_TOKEN: z.string(),
  WEB_APP_BASE_URL: z.url(),
  RENDER_BASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
