#!/usr/bin/env tsx
/**
 * Create a user in the Cognito User Pool and assign them to a group.
 *
 * Usage:
 *   npm run create-user -- --email alice@ibm.com --name "Alice Smith" --role onboarders --temp-password TempP@ss1
 *
 * Roles: admins | onboarders
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { z } from 'zod';

// ── Arg parsing ───────────────────────────────────────────────────────────────

function getArg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const rawInput = {
  email: getArg('email'),
  name: getArg('name'),
  role: getArg('role'),
  tempPassword: getArg('temp-password'),
};

// ── Validation ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  email: z.string().email('--email must be a valid email address'),
  name: z.string().min(1, '--name must not be empty'),
  role: z.enum(['admins', 'onboarders'], {
    error: '--role must be "admins" or "onboarders"',
  }),
  tempPassword: z.string().min(8, '--temp-password must be at least 8 characters'),
});

const parsed = inputSchema.safeParse(rawInput);

if (!parsed.success) {
  console.error('Invalid arguments:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.message}`);
  }
  process.exit(1);
}

const { email, name, role, tempPassword } = parsed.data;

// ── Cognito client ────────────────────────────────────────────────────────────

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;
const region = process.env.COGNITO_REGION ?? 'eu-west-1';

if (!userPoolId) {
  console.error('COGNITO_USER_POOL_ID environment variable is not set.');
  process.exit(1);
}

const client = new CognitoIdentityProviderClient({ region });

// ── Create user ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`Creating user ${email} in group "${role}"...`);

  try {
    // 1. Create the user with a temporary password (suppress the welcome email)
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'name', Value: name },
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
        ],
      })
    );

    // 2. Set the password as permanent (skip forced-change-on-first-login)
    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: tempPassword,
        Permanent: true,
      })
    );

    // 3. Add the user to the correct group
    await client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: role,
      })
    );

    console.log(`✓ User ${email} created and added to "${role}".`);
    console.log(`  Password: ${'*'.repeat(tempPassword.length)} (masked)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to create user: ${message}`);
    process.exit(1);
  }
}

main();
