import { z } from 'zod';
import type { SentryWebhookPayload } from './sentry.js';

export const renderLargeTextInputSchema = z.object({
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
export const renderLargeTextDataSchema = renderLargeTextInputSchema;

export const renderSudokuInputSchema = z.object({
  _type: z.literal('sudoku'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
});
export const renderSudokuDataSchema = z.object({
  _type: z.literal('sudoku'),
  data: z.array(z.array(z.number().int().min(0).max(9))).length(9),
});

export const renderTodoListInputSchema = z.object({
  _type: z.literal('todo-list'),
  title: z.string().trim().max(32).optional(),
  items: z.array(z.string().trim().min(1).max(512)).min(1).max(64),
});
export const renderTodoListDataSchema = renderTodoListInputSchema;

export const renderSentryErrorInputSchema = z.object({
  _type: z.literal('sentry-error'),
  data: z.object({
    id: z.string(),
    project: z.string(),
    project_name: z.string(),
    project_slug: z.string(),
    level: z.string(),
    culprit: z.string(),
    message: z.string(),
    url: z.url(),
    event: z.json(),
  }),
});

export type RenderInputLargeText = z.infer<typeof renderLargeTextInputSchema>;
export type RenderDataLargeText = z.infer<typeof renderLargeTextDataSchema>;

export type RenderInputSudoku = z.infer<typeof renderSudokuInputSchema>;
export type RenderDataSudoku = z.infer<typeof renderSudokuDataSchema>;

export type RenderInputTodoList = z.infer<typeof renderTodoListInputSchema>;
export type RenderDataTodoList = z.infer<typeof renderTodoListDataSchema>;

export const renderWebsiteInputSchema = z.object({
  _type: z.literal('website'),
  url: z.preprocess(
    val => {
      if (typeof val !== 'string') {
        return '';
      }
      // Ensure the URL has a protocol and allow omitting it for convenience
      return /^https?/.test(val) ? val : `https://${val}`;
    },
    z.url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
    })
  ),
  fullPage: z.boolean().default(true),
});

export type RenderInputSentryError = z.infer<typeof renderSentryErrorInputSchema>;
export type RenderDataSentryError = {
  _type: 'sentry-error';
  data: SentryWebhookPayload;
};

export type RenderInputWebsite = z.infer<typeof renderWebsiteInputSchema>;

export type RenderData = RenderDataLargeText | RenderDataSudoku | RenderDataTodoList | RenderDataSentryError;
