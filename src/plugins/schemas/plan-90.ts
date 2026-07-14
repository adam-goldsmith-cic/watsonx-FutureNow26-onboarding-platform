import { z } from 'zod';

export const planPhaseSchema = z.object({
  label: z.string(),
  subtitle: z.string(),
  colorClass: z.string(),
  goals: z.array(z.string()),
});

export const plan90ConfigSchema = z.object({
  title: z.string().default('Your 30 / 60 / 90 Day Plan'),
  phases: z.array(planPhaseSchema).length(3),
});

export type Plan90Config = z.infer<typeof plan90ConfigSchema>;
export type PlanPhase = z.infer<typeof planPhaseSchema>;
