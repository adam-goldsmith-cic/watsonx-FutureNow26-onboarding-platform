import { z } from 'zod';

export const policyDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  askBobPrompt: z.string().optional(),
});

export const policyDocsConfigSchema = z.object({
  title: z.string().default('Policies & Documents'),
  documents: z.array(policyDocSchema),
});

export type PolicyDocsConfig = z.infer<typeof policyDocsConfigSchema>;
export type PolicyDoc = z.infer<typeof policyDocSchema>;
