import {
  AuthenticationState,
  getAuthenticationState,
  removeAuthenticationState
} from "./authenticationState";
import { ResolvedClientConfig } from "./OIDCClient";
import parseIdToken from "./parseIdToken";
import { IDToken } from "./IDToken";
import validateIdToken from "./validateIdToken";

async function handleCodeResponse(
  config: ResolvedClientConfig,
  code: string,
  sessionState: string | undefined,
  authState: AuthenticationState
): Promise<{ idToken: IDToken; accessToken: string }> {
  const { clientId, redirectUrl, tokenEndpoint } = config;
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUrl,
      code_verifier: authState.pkceState.codeVerifier
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(
      "Failed to retrieve token: " + (await tokenResponse.text())
    );
  }

  const {
    id_token: encodedIdToken,
    access_token: accessToken
  } = await tokenResponse.json();

  const idToken = parseIdToken(encodedIdToken);

  await validateIdToken(config, authState.nonce, idToken, accessToken);

  return {
    idToken,
    accessToken
  };
}

export default async function completeAuthentication(
  config: ResolvedClientConfig
): Promise<{ idToken: IDToken; accessToken: string }> {
  const params = new URLSearchParams(location.hash.substring(1));

  // The state parameter is required for both error and success responses
  const state = params.get("state");
  if (!state) {
    throw new Error("Missing 'state' parameter.");
  }

  const authState = getAuthenticationState(state);
  if (!authState) {
    throw new Error(`State '${state}' not found.`);
  }
  removeAuthenticationState(state);

  // We can get either a code or an error response
  const code = params.get("code");
  const error = params.get("error");
  if (code && error) {
    throw new Error("'code' and 'error' parameters are mutually exclusive.");
  } else if (code) {
    const sessionState = params.get("session_state") ?? undefined;
    return handleCodeResponse(config, code, sessionState, authState);
  } else if (error) {
    const description = params.get("error_description") ?? "Unknown Error";

    throw new Error(error + ": " + description);
  } else {
    throw new Error("Missing 'code' or 'error' parameter.");
  }
}
