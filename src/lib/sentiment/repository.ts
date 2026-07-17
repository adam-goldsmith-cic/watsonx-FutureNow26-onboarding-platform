import {
  QueryCommand,
  PutCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import documentClient from '@/lib/tasks/dynamodb-client';
import type { SentimentEntry } from '@/lib/api-types';

function getTableName(): string {
  const name = process.env.ONBOARDING_SENTIMENT_TABLE;
  if (!name) throw new Error('Missing required env var: ONBOARDING_SENTIMENT_TABLE');
  return name;
}

export class SentimentRepository {
  /**
   * Writes a new sentiment entry to DynamoDB.
   */
  async createSentimentEntry(entry: SentimentEntry): Promise<SentimentEntry> {
    await documentClient.send(
      new PutCommand({
        TableName: getTableName(),
        Item: entry,
      })
    );
    return entry;
  }

  /**
   * Returns the most recent sentiment entry for a given user, or null if none.
   * Uses the userId-index GSI and sorts by createdAt descending in memory.
   */
  async getLatestForUser(userId: string): Promise<SentimentEntry | null> {
    const params: QueryCommandInput = {
      TableName: getTableName(),
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    };

    const result = await documentClient.send(new QueryCommand(params));
    const items = result.Items ?? [];

    if (items.length === 0) return null;

    const entries: SentimentEntry[] = items.map((item) => ({
      entryId: item.entryId as string,
      userId: item.userId as string,
      mood: item.mood as SentimentEntry['mood'],
      notes: (item.notes as string | undefined) ?? null,
      createdAt: item.createdAt as string,
    }));

    // Sort descending by createdAt and return the latest
    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return entries[0];
  }

  /**
   * Returns all sentiment entries for a given user, ordered oldest → newest.
   */
  async getAllForUser(userId: string): Promise<SentimentEntry[]> {
    const params: QueryCommandInput = {
      TableName: getTableName(),
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    };

    const result = await documentClient.send(new QueryCommand(params));
    const items = result.Items ?? [];

    return items
      .map((item) => ({
        entryId: item.entryId as string,
        userId: item.userId as string,
        mood: item.mood as SentimentEntry['mood'],
        notes: (item.notes as string | undefined) ?? null,
        createdAt: item.createdAt as string,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}
