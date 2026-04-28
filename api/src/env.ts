import z from "zod";

const envSchema = z.object({
  ENV: z.enum(["development", "production"]),
  WEBSOCKET_TOKEN: z.string().min(32),
  SENTRY_ERROR_TOKEN: z.string().min(32),
  WEB_APP_BASE_URL: z.url(),
  RENDER_BASE_URL: z.url(),
  AWS_REGION: z.string().min(2),
  AWS_BEDROCK_MODEL_ID: z.string().min(10),
  AWS_BEDROCK_API_KEY: z.string().min(32),
  REPLICATE_API_KEY: z.string().min(32)
});

export const env = envSchema.parse(process.env);
