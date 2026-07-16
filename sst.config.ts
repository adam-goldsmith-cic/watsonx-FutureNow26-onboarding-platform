/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "onboarding-project",
      // Retain stateful resources in production; remove them in ephemeral stages.
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      // "local" stores Pulumi state on disk (~/.sst/state) — no S3 bootstrap
      // bucket or Docker build needed. We're not deploying any compute to AWS
      // (Vercel handles the Next.js app), so "aws" home is unnecessary.
      home: "local",
      providers: {
        aws: { region: "eu-west-1" },
      },
    };
  },
  async run() {
    const { all } = await import("@pulumi/pulumi");
    const { dynamodb, iam } = await import("@pulumi/aws");

    // ── DynamoDB Tables ──────────────────────────────────────────────────────
    // Both tables already exist in AWS. The `import` option on the resource
    // opts tells Pulumi to adopt the existing resource rather than create a new
    // one. The declared args must match what is already in AWS.

    const tasksTable = new dynamodb.Table(
      "OnboardingTasksTable",
      {
        name: "onboarding-tasks",
        billingMode: "PAY_PER_REQUEST",
        hashKey: "taskId",
        attributes: [
          { name: "taskId", type: "S" },
          { name: "userId", type: "S" },
        ],
        globalSecondaryIndexes: [
          {
            name: "userId-index",
            hashKey: "userId",
            projectionType: "ALL",
          },
        ],
      },
      { import: "onboarding-tasks", retainOnDelete: true },
    );

    const configTable = new dynamodb.Table(
      "OnboardingConfigTable",
      {
        name: "onboarding-config",
        billingMode: "PAY_PER_REQUEST",
        hashKey: "pluginId",
        attributes: [{ name: "pluginId", type: "S" }],
      },
      { import: "onboarding-config", retainOnDelete: true },
    );

    // ── IAM User ─────────────────────────────────────────────────────────────
    // Adopt the existing `watsonx-challenge` IAM user.

    const iamUser = new iam.User(
      "WatsonxChallengeUser",
      { name: "watsonx-challenge" },
      { import: "watsonx-challenge" },
    );

    // ── IAM Policy ───────────────────────────────────────────────────────────
    // Scoped to the two managed tables. ARNs are derived from the table
    // resources so they stay in sync if names ever change.

    const dynamoPolicy = new iam.Policy("WatsonxDynamoPolicy", {
      name: "watson-dyanmo",
      description: "Allows the onboarding app to read/write its DynamoDB tables",
      // Build the policy document once both table ARNs are resolved.
      policy: all([tasksTable.arn, configTable.arn]).apply(
        ([tasksArn, configArn]) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "dynamodb:GetItem",
                  "dynamodb:PutItem",
                  "dynamodb:UpdateItem",
                  "dynamodb:Query",
                  "dynamodb:Scan",
                ],
                Resource: [
                  tasksArn,
                  `${tasksArn}/index/userId-index`,
                  configArn,
                ],
              },
            ],
          }),
      ),
    });

    new iam.UserPolicyAttachment("WatsonxDynamoPolicyAttachment", {
      user: iamUser.name,
      policyArn: dynamoPolicy.arn,
    });

    // ── IAM Access Key ───────────────────────────────────────────────────────
    // SST creates and manages a new access key for the IAM user.
    //
    // IMPORTANT: Once `sst deploy` completes successfully, copy the stack
    // outputs below into .env.local (and the Vercel dashboard), then
    // deactivate and delete the old manually-created access key
    // (AKIATNCG7TNPP3SMDJVW) from the AWS console.

    const accessKey = new iam.AccessKey("WatsonxAccessKey", {
      user: iamUser.name,
    });

    // ── Stack Outputs ────────────────────────────────────────────────────────
    // After `sst deploy --stage production`, run:
    //   npx sst output --stage production
    // and copy the printed values into .env.local and the Vercel dashboard.

    return {
      region: "eu-west-1",
      tasksTableName: tasksTable.name,
      configTableName: configTable.name,
      accessKeyId: accessKey.id,
      // secretAccessKey is sensitive — never log or commit this value.
      secretAccessKey: accessKey.secret,
    };
  },
});
