import {
  AuthenticationState,
  getAuthenticationState,
  removeAuthenticationState,
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
): Promise<AuthenticationResult> {
  const { clientId, redirectUrl, tokenEndpoint } = config;
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUrl,
      code_verifier: authState.pkceState.codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(
      "Failed to retrieve token: " + (await tokenResponse.text())
    );
  }

  const {
    id_token: encodedIdToken,
    access_token: accessToken,
  } = await tokenResponse.json();

  const idToken = parseIdToken(encodedIdToken);

  await validateIdToken(config, idToken, accessToken);

  return {
    idToken,
    accessToken,
    applicationState: authState.applicationState,
  };
}

export type AuthenticationResult = {
  idToken: IDToken;
  accessToken?: string;
  applicationState: unknown;
};

export default async function completeAuthentication(
  config: ResolvedClientConfig
): Promise<AuthenticationResult> {
  const params = new URLSearchParams(location.hash.substring(1));

  // Strip out the parameters supplied from the IDP from the browser history
  // This avoids issues when reloading the current page using F5 that arise
  // from the state parameter no longer being valid.
  const lastHash = location.href.lastIndexOf("#");
  if (lastHash !== -1) {
    history.replaceState(null, "", location.href.substr(0, lastHash));
  }

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
