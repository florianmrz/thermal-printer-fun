import z from "zod";

const envSchema = z.object({
  WEBSOCKET_TOKEN: z.string(),
});

export const env = envSchema.parse(process.env);
