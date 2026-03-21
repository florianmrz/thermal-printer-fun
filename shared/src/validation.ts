import { z } from 'zod';

export const renderTestSchema = z.object({
  _type: z.literal('test'),
  input: z.string().trim().min(1),
});

export type RenderTestInput = z.infer<typeof renderTestSchema>;
export type RenderDataTest = RenderTestInput & { id: string };
export type RenderData = RenderDataTest;
