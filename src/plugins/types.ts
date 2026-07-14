import { ZodSchema } from 'zod';

export type PluginCategory = 'core' | 'hr' | 'it' | 'learning' | 'comms' | 'custom';

export interface PluginDefinition<TConfig = unknown> {
  id: string;
  name: string;
  category: PluginCategory;
  enabled: boolean;
  order: number;
  configSchema: ZodSchema<TConfig>;
  defaultConfig: TConfig;
}

export interface OrgPluginEntry<TConfig = unknown> {
  pluginId: string;
  enabled: boolean;
  order: number;
  config: TConfig;
}
