import {
  QueryCommand,
  UpdateCommand,
  PutCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import documentClient from './dynamodb-client';
import type { TaskState, TaskStatus } from '@/lib/api-types';

const TABLE_NAME = 'onboarding-tasks';

export interface TaskPatch {
  status: TaskStatus;
  completedAt: string | null;
  notes: string | null;
}

export interface SeedTask {
  taskId: string;
  userId: string;
  dueDate: string;
}

export class TaskRepository {
  /**
   * Returns all tasks for a given user, queried via the userId-index GSI.
   * Returns an empty array if the user has no tasks seeded yet.
   */
  async getTasksForUser(userId: string): Promise<TaskState[]> {
    const params: QueryCommandInput = {
      TableName: TABLE_NAME,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    };

    const result = await documentClient.send(new QueryCommand(params));
    const items = result.Items ?? [];

    return items.map((item) => ({
      taskId: item.taskId as string,
      userId: item.userId as string,
      status: item.status as TaskStatus,
      dueDate: item.dueDate as string,
      completedAt: (item.completedAt as string | undefined) ?? null,
      notes: (item.notes as string | undefined) ?? null,
    }));
  }

  /**
   * Updates status, completedAt, and notes for an existing task.
   * Returns null if the task does not exist (was never seeded).
   */
  async updateTask(taskId: string, patch: TaskPatch): Promise<TaskState | null> {
    try {
      const result = await documentClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { taskId },
          ConditionExpression: 'attribute_exists(taskId)',
          UpdateExpression:
            'SET #status = :status, completedAt = :completedAt, notes = :notes',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': patch.status,
            ':completedAt': patch.completedAt ?? null,
            ':notes': patch.notes ?? null,
          },
          ReturnValues: 'ALL_NEW',
        })
      );

      const item = result.Attributes!;
      return {
        taskId: item.taskId as string,
        userId: item.userId as string,
        status: item.status as TaskStatus,
        dueDate: item.dueDate as string,
        completedAt: (item.completedAt as string | undefined) ?? null,
        notes: (item.notes as string | undefined) ?? null,
      };
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Seeds tasks for a user. Skips rows that already exist (idempotent).
   * Returns a count of seeded vs skipped rows.
   */
  async seedTasksForUser(
    tasks: SeedTask[]
  ): Promise<{ seeded: number; skipped: number }> {
    let seeded = 0;
    let skipped = 0;

    await Promise.all(
      tasks.map(async (task) => {
        try {
          await documentClient.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: {
                taskId: task.taskId,
                userId: task.userId,
                status: 'NOT_STARTED' satisfies TaskStatus,
                dueDate: task.dueDate,
                completedAt: null,
                notes: null,
              },
              ConditionExpression: 'attribute_not_exists(taskId)',
            })
          );
          seeded++;
        } catch (err) {
          if (err instanceof ConditionalCheckFailedException) {
            skipped++;
          } else {
            throw err;
          }
        }
      })
    );

    return { seeded, skipped };
  }
}
