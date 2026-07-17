import {
  QueryCommand,
  GetCommand,
  PutCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import documentClient from '@/lib/tasks/dynamodb-client';
import type { Meeting } from '@/lib/api-types';

function getTableName(): string {
  const name = process.env.ONBOARDING_MEETINGS_TABLE;
  if (!name) throw new Error('Missing required env var: ONBOARDING_MEETINGS_TABLE');
  return name;
}

export class MeetingRepository {
  /**
   * Returns all meetings for a given user, queried via the userId-index GSI.
   */
  async getMeetingsForUser(userId: string): Promise<Meeting[]> {
    const params: QueryCommandInput = {
      TableName: getTableName(),
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    };

    const result = await documentClient.send(new QueryCommand(params));
    const items = result.Items ?? [];

    return items.map((item) => ({
      meetingId: item.meetingId as string,
      userId: item.userId as string,
      title: item.title as string,
      startTime: item.startTime as string,
      duration: item.duration as number,
      location: item.location as string,
      attendees: item.attendees as string[],
      date: item.date as string,
      status: item.status as Meeting['status'],
      bobPrepNote: item.bobPrepNote as string,
    }));
  }

  /**
   * Returns a single meeting by its primary key, or null if not found.
   */
  async getMeetingById(meetingId: string): Promise<Meeting | null> {
    const result = await documentClient.send(
      new GetCommand({ TableName: getTableName(), Key: { meetingId } })
    );

    if (!result.Item) return null;
    const item = result.Item;
    return {
      meetingId: item.meetingId as string,
      userId: item.userId as string,
      title: item.title as string,
      startTime: item.startTime as string,
      duration: item.duration as number,
      location: item.location as string,
      attendees: item.attendees as string[],
      date: item.date as string,
      status: item.status as Meeting['status'],
      bobPrepNote: item.bobPrepNote as string,
    };
  }

  /** Seeds a meeting record. Pass force=true to overwrite an existing record. */
  async putMeeting(meeting: Meeting, force = false): Promise<void> {
    await documentClient.send(
      new PutCommand({
        TableName: getTableName(),
        Item: meeting,
        ...(force ? {} : { ConditionExpression: 'attribute_not_exists(meetingId)' }),
      })
    );
  }
}
