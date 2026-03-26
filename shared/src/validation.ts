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

export const renderTodoListFormSchema = z.object({
  _type: z.literal('todo-list'),
  title: z.string().trim().max(32).optional(),
  items: z.array(z.string().trim().min(1).max(512)).min(1).max(64),
});
export const renderTodoListDataSchema = renderTodoListFormSchema;

export type RenderLargeTextInput = z.infer<typeof renderLargeTextFormSchema>;
export type RenderSudokuInput = z.infer<typeof renderSudokuFormSchema>;
export type RenderTodoListInput = z.infer<typeof renderTodoListFormSchema>;
export type RenderDataLargeText = z.infer<typeof renderLargeTextDataSchema>;
export type RenderDataSudoku = z.infer<typeof renderSudokuDataSchema>;
export type RenderDataTodoList = z.infer<typeof renderTodoListDataSchema>;
export type RenderData = RenderDataLargeText | RenderDataSudoku | RenderDataTodoList;
