import { z } from 'zod';

export const communitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  slackChannel: z.string(),
  cadence: z.string(),
  memberCount: z.string(),
  isRecommended: z.boolean(),
  iconEmoji: z.string(),
  bobNote: z.string(),
});

export const communitiesConfigSchema = z.object({
  title: z.string().default('Recommended for You'),
  communities: z.array(communitySchema),
});

export type Community = z.infer<typeof communitySchema>;
export type CommunitiesConfig = z.infer<typeof communitiesConfigSchema>;
