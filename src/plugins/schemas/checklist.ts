import { z } from 'zod';

export const taskCategorySchema = z.enum(['IT', 'HR', 'SEC', 'MGR', 'TEAM']);

export const checklistTaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: taskCategorySchema,
  dueDayOffset: z.number().int().nonnegative(),
  mandatory: z.boolean(),
  roles: z.array(z.string()),
  link: z
    .object({
      label: z.string(),
      url: z.string(),
    })
    .optional(),
});

export const checklistConfigSchema = z.object({
  title: z.string().default('First Week Checklist'),
  tasks: z.array(checklistTaskSchema),
});

export type ChecklistConfig = z.infer<typeof checklistConfigSchema>;
export type ChecklistTask = z.infer<typeof checklistTaskSchema>;
export type TaskCategory = z.infer<typeof taskCategorySchema>;
