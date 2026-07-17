import { z } from 'zod';
import { checklistConfigSchema } from '@/plugins/schemas/checklist';
import { trainingConfigSchema } from '@/plugins/schemas/training';
import { faqLinksConfigSchema } from '@/plugins/schemas/faq-links';
import { plan90ConfigSchema } from '@/plugins/schemas/plan-90';
import { contactsConfigSchema } from '@/plugins/schemas/contacts';
import { policyDocsConfigSchema } from '@/plugins/schemas/policy-docs';
import { announcementsConfigSchema } from '@/plugins/schemas/announcements';
import { communitiesConfigSchema } from '@/plugins/schemas/communities';

const pluginSchemas: Record<string, z.ZodSchema> = {
  checklist: checklistConfigSchema,
  training: trainingConfigSchema,
  'faq-links': faqLinksConfigSchema,
  'plan-90': plan90ConfigSchema,
  contacts: contactsConfigSchema,
  'policy-docs': policyDocsConfigSchema,
  announcements: announcementsConfigSchema,
  communities: communitiesConfigSchema,
};

const rawEntrySchema = z.object({
  pluginId: z.string(),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
  config: z.unknown(),
});

export interface ResolvedPluginEntry {
  pluginId: string;
  enabled: boolean;
  order: number;
  config: unknown;
}

/**
 * Reads, validates, and returns the org plugin config.
 * Throws a descriptive error if any plugin's config is invalid.
 */
export function resolveOrgConfig(raw: unknown): ResolvedPluginEntry[] {
  const entries = z.array(rawEntrySchema).parse(raw);

  return entries.map((entry) => {
    const schema = pluginSchemas[entry.pluginId];
    if (!schema) {
      // Unknown plugins pass through as-is (forwards-compatibility)
      return entry;
    }

    const result = schema.safeParse(entry.config);
    if (!result.success) {
      throw new Error(
        `Invalid config for plugin "${entry.pluginId}": ${result.error.message}`
      );
    }

    return {
      ...entry,
      config: result.data,
    };
  });
}
