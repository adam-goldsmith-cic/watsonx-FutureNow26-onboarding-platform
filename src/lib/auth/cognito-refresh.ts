import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

interface CognitoClient {
  send: (command: unknown) => Promise<unknown>;
}

/** Silently refreshes Cognito tokens using the refresh token. */
export async function refreshCognitoTokens(
  refreshToken: string,
  client?: CognitoClient
): Promise<{
  accessToken: string;
  idToken: string;
  accessTokenExpiry: number;
} | null> {
  try {
    const cognitoClient =
      client ??
      new CognitoIdentityProviderClient({
        region: process.env.COGNITO_REGION ?? "eu-west-1",
      });

    const result = (await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      })
    )) as { AuthenticationResult?: { AccessToken?: string; IdToken?: string; ExpiresIn?: number } };

    const auth = result.AuthenticationResult;
    if (!auth?.AccessToken || !auth?.IdToken) return null;
    return {
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      accessTokenExpiry: Math.floor(Date.now() / 1000) + (auth.ExpiresIn ?? 3600),
    };
  } catch {
    return null;
  }
}
