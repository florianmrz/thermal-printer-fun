import { z } from 'zod';

export const renderTestSchema = z.object({
  _type: z.literal('test'),
  foo: z.string().trim().min(1),
});

export const renderDataSchema = z.discriminatedUnion('_type', [renderTestSchema]);

export type RenderTestInput = z.infer<typeof renderTestSchema>;
export type RenderDataTest = RenderTestInput;
export type RenderData = z.infer<typeof renderDataSchema>;
