import { z } from 'zod';

export const trainingStatusSchema = z.enum(['not-started', 'in-progress', 'completed', 'overdue']);

export const trainingCourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  progress: z.number().int().min(0).max(100),
  status: trainingStatusSchema,
  dueDate: z.string().optional(),
});

export const trainingConfigSchema = z.object({
  title: z.string().default('Training & Compliance'),
  courses: z.array(trainingCourseSchema),
});

export type TrainingConfig = z.infer<typeof trainingConfigSchema>;
export type TrainingCourse = z.infer<typeof trainingCourseSchema>;
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;
