import {
  ScanCommand,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import documentClient from '@/lib/tasks/dynamodb-client';
import type { OrgNode } from '@/lib/api-types';

function getTableName(): string {
  const name = process.env.ONBOARDING_ORG_CHART_TABLE;
  if (!name) throw new Error('Missing required env var: ONBOARDING_ORG_CHART_TABLE');
  return name;
}

function mapItem(item: Record<string, unknown>): OrgNode {
  return {
    nodeId: item.nodeId as string,
    name: item.name as string,
    role: item.role as string,
    initials: item.initials as string,
    color: item.color as string,
    bio: item.bio as string,
    parentId: (item.parentId as string | undefined) ?? null,
    isCurrentUser: (item.isCurrentUser as boolean | undefined) ?? false,
    level: item.level as number,
  };
}

export class OrgChartRepository {
  /**
   * Returns all org chart nodes. Org chart is shared across the organisation,
   * so no per-user filtering is required.
   */
  async getAllNodes(): Promise<OrgNode[]> {
    const result = await documentClient.send(
      new ScanCommand({ TableName: getTableName() })
    );
    const items = result.Items ?? [];
    return items
      .map((item) => mapItem(item as Record<string, unknown>))
      .sort((a, b) => a.level - b.level);
  }

  /**
   * Returns a single org node by its primary key, or null if not found.
   */
  async getNodeById(nodeId: string): Promise<OrgNode | null> {
    const result = await documentClient.send(
      new GetCommand({ TableName: getTableName(), Key: { nodeId } })
    );

    if (!result.Item) return null;
    return mapItem(result.Item as Record<string, unknown>);
  }

  /** Seeds an org chart node. Pass force=true to overwrite an existing record. */
  async putNode(node: OrgNode, force = false): Promise<void> {
    await documentClient.send(
      new PutCommand({
        TableName: getTableName(),
        Item: node,
        ...(force ? {} : { ConditionExpression: 'attribute_not_exists(nodeId)' }),
      })
    );
  }
}
