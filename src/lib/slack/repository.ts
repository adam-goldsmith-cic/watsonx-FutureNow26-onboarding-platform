import {
  QueryCommand,
  GetCommand,
  PutCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import documentClient from '@/lib/tasks/dynamodb-client';
import type { SlackMessage, SlackMessageType } from '@/lib/api-types';

function getTableName(): string {
  const name = process.env.ONBOARDING_SLACK_MESSAGES_TABLE;
  if (!name) throw new Error('Missing required env var: ONBOARDING_SLACK_MESSAGES_TABLE');
  return name;
}

function mapItem(item: Record<string, unknown>): SlackMessage {
  return {
    messageId: item.messageId as string,
    userId: item.userId as string,
    senderName: item.senderName as string,
    channel: item.channel as string,
    type: item.type as SlackMessageType,
    timestamp: item.timestamp as string,
    preview: item.preview as string,
    fullText: item.fullText as string,
    initials: item.initials as string,
    color: item.color as string,
    isUnread: item.isUnread as boolean,
  };
}

export class SlackRepository {
  /**
   * Returns all Slack messages for a given user, queried via the userId-index GSI.
   * Optionally filter by message type (dm | channel | mention).
   */
  async getMessagesForUser(
    userId: string,
    type?: SlackMessageType
  ): Promise<SlackMessage[]> {
    const params: QueryCommandInput = {
      TableName: getTableName(),
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    };

    const result = await documentClient.send(new QueryCommand(params));
    const items = result.Items ?? [];

    const messages = items.map((item) => mapItem(item as Record<string, unknown>));

    const filtered = type ? messages.filter((m) => m.type === type) : messages;

    // Sort newest first
    return filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Returns a single Slack message by its primary key, or null if not found.
   */
  async getMessageById(messageId: string): Promise<SlackMessage | null> {
    const result = await documentClient.send(
      new GetCommand({ TableName: getTableName(), Key: { messageId } })
    );

    if (!result.Item) return null;
    return mapItem(result.Item as Record<string, unknown>);
  }

  /** Seeds a Slack message. Pass force=true to overwrite an existing record. */
  async putMessage(message: SlackMessage, force = false): Promise<void> {
    await documentClient.send(
      new PutCommand({
        TableName: getTableName(),
        Item: message,
        ...(force ? {} : { ConditionExpression: 'attribute_not_exists(messageId)' }),
      })
    );
  }
}
