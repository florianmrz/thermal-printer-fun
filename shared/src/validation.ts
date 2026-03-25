import { z } from 'zod';

export const renderLargeTextFormSchema = z.object({
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
export const renderLargeTextDataSchema = renderLargeTextFormSchema;

export const renderSudokuFormSchema = z.object({
  _type: z.literal('sudoku'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
});
export const renderSudokuDataSchema = z.object({
  _type: z.literal('sudoku'),
  data: z.array(z.array(z.number().int().min(0).max(9))).length(9),
});

export type RenderLargeTextInput = z.infer<typeof renderLargeTextFormSchema>;
export type RenderSudokuInput = z.infer<typeof renderSudokuFormSchema>;
export type RenderDataLargeText = z.infer<typeof renderLargeTextDataSchema>;
export type RenderDataSudoku = z.infer<typeof renderSudokuDataSchema>;
export type RenderData = RenderDataLargeText | RenderDataSudoku;
