import { z } from 'zod';

export const toolStatusSchema = z.enum(['done', 'in-progress', 'not-started']);

export const keyContactSchema = z.object({
  initials: z.string().max(2),
  name: z.string(),
  role: z.string(),
  description: z.string(),
  // Optional — org-config always supplies these; Phase 2 data sources may not
  email: z.string().optional(),
  slackHandle: z.string().optional(),
});

export const toolSchema = z.object({
  name: z.string(),
  status: toolStatusSchema,
});

export const contactsConfigSchema = z.object({
  title: z.string().default('Key Contacts & Tools'),
  contacts: z.array(keyContactSchema),
  tools: z.array(toolSchema),
});

export type ContactsConfig = z.infer<typeof contactsConfigSchema>;
export type KeyContact = z.infer<typeof keyContactSchema>;
export type Tool = z.infer<typeof toolSchema>;
export type ToolStatus = z.infer<typeof toolStatusSchema>;
