import { z } from 'zod';

export const renderTestSchema = z.object({
  _type: z.literal('test'),
  input: z.string().trim().min(1),
});

export const renderLargeTextSchema = z.object({
  _type: z.literal('large-text'),
  input: z.string().trim().min(1).max(20).refine(value => !/[\r\n]/.test(value), {
    message: 'Newlines are not allowed',
  }),
});

export type RenderTestInput = z.infer<typeof renderTestSchema>;
export type RenderLargeTextInput = z.infer<typeof renderLargeTextSchema>;
export type RenderDataTest = RenderTestInput & { id: string };
export type RenderDataLargeText = RenderLargeTextInput;
export type RenderData = RenderDataTest | RenderDataLargeText;
