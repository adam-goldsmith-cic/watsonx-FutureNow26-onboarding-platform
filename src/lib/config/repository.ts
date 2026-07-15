import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import documentClient from '../tasks/dynamodb-client';
import type { OrgPluginConfig } from '@/lib/api-types';

const TABLE_NAME = 'onboarding-config';

export class ConfigRepository {
  /**
   * Returns all plugin config entries from the onboarding-config table.
   * Returns an empty array if the table has not been seeded yet.
   */
  async getAllPlugins(): Promise<OrgPluginConfig[]> {
    const result = await documentClient.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );

    const items = result.Items ?? [];

    return items.map((item) => ({
      pluginId: item.pluginId as string,
      enabled: item.enabled as boolean,
      order: item.order as number,
      config: item.config as unknown,
    }));
  }

  /**
   * Upserts a single plugin config entry (overwrites if it already exists).
   */
  async putPlugin(entry: OrgPluginConfig): Promise<void> {
    await documentClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pluginId: entry.pluginId,
          enabled: entry.enabled,
          order: entry.order,
          config: entry.config,
        },
      })
    );
  }

  /**
   * Upserts all plugin config entries in parallel.
   */
  async putAllPlugins(entries: OrgPluginConfig[]): Promise<void> {
    await Promise.all(entries.map((entry) => this.putPlugin(entry)));
  }
}
