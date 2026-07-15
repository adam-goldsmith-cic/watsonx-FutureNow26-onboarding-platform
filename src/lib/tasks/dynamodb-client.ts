import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Don't send explicit nulls to DynamoDB — omit them instead
    removeUndefinedValues: true,
  },
});

export default documentClient;
