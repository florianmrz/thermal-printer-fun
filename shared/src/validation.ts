import { z } from 'zod';

export const renderLargeTextSchema = z.object({
  _type: z.literal('large-text'),
  input: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .refine(value => !/[\r\n]/.test(value), {
      message: 'Newlines are not allowed',
    }),
});

export type RenderLargeTextInput = z.infer<typeof renderLargeTextSchema>;
export type RenderDataLargeText = RenderLargeTextInput;
export type RenderData = RenderDataLargeText;
