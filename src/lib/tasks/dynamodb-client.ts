import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Use an explicit credentials provider so the SDK never falls back to the
// default credential chain (which picks up AWS_SESSION_TOKEN from the
// environment and breaks long-lived IAM user key auth).
// Validation is deferred to request time so the build succeeds without env vars.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'eu-west-1',
  credentials: async () => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Missing required env vars: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }
    return { accessKeyId, secretAccessKey };
  },
});

const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Don't send explicit nulls to DynamoDB — omit them instead
    removeUndefinedValues: true,
  },
});

export default documentClient;
