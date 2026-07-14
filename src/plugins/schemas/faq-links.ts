import { z } from 'zod';

export const faqLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  icon: z.string(),
  url: z.string(),
});

export const faqLinksConfigSchema = z.object({
  title: z.string().default('FAQ & Quick Links'),
  links: z.array(faqLinkSchema),
});

export type FaqLinksConfig = z.infer<typeof faqLinksConfigSchema>;
export type FaqLink = z.infer<typeof faqLinkSchema>;
