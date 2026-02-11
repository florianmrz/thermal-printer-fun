import z from "zod";

const envSchema = z.object({
  API_TOKEN: z.string(),
  WEBSOCKET_TOKEN: z.string(),
});

export const env = envSchema.parse(process.env);
