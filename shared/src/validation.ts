import { z } from 'zod';

export const renderTestSchema = z.object({
  foo: z.string().trim().min(1),
});

export type RenderTestInput = z.infer<typeof renderTestSchema>;
