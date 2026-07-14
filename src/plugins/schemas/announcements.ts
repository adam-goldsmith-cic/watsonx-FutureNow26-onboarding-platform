import { z } from 'zod';

export const announcementAudienceSchema = z.enum(['all', 'cohort', 'team']);

export const announcementSchema = z.object({
  id: z.string(),
  message: z.string(),
  audience: announcementAudienceSchema,
  expiresAt: z.string().datetime().optional(),
});

export const announcementsConfigSchema = z.object({
  title: z.string().default('Announcements'),
  items: z.array(announcementSchema),
});

export type AnnouncementsConfig = z.infer<typeof announcementsConfigSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type AnnouncementAudience = z.infer<typeof announcementAudienceSchema>;
