import {
  AuthenticationState,
  getAuthenticationState,
  removeAuthenticationState,
} from "./authenticationState";
import { ResolvedClientConfig } from "./OIDCClient";
import parseIdToken from "./parseIdToken";
import { IDToken } from "./IDToken";
import validateIdToken from "./validateIdToken";
import IdpError from "./IdpError";

async function handleCodeResponse(
  config: ResolvedClientConfig,
  code: string,
  sessionState: string | undefined,
  authState: AuthenticationState
): Promise<AuthenticationResult> {
  const { clientId, redirectUrl, tokenEndpoint } = config;
  let tokenResponse: Response;

  try {
    tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: redirectUrl,
        code_verifier: authState.pkceState.codeVerifier,
      }),
    });
  } catch (e) {
    throw new Error(`Failed to retrieve token from ${tokenEndpoint}: ${e}`);
  }

  if (!tokenResponse.ok) {
    throw new Error(
      `Failed to retrieve token from ${tokenEndpoint}: ${tokenResponse.status} ${tokenResponse.statusText}`
    );
  }

  let tokenResponseBody: any;
  try {
    tokenResponseBody = await tokenResponse.json();
  } catch (e) {
    throw new Error(
      `Failed to read token response from ${tokenEndpoint}: ${e}`
    );
  }

  const {
    id_token: encodedIdToken,
    access_token: accessToken,
  } = tokenResponseBody;

  const idToken = parseIdToken(encodedIdToken);

  await validateIdToken(config, idToken.claims);

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

/**
 * Lists potential error codes returned by the IDP,
 * according to RFC6749 § 4.1.2.1.
 * Since some IDPs opt to return custom codes, this
 * type is more a hint than a complete list or guarantee.
 */
export type ErrorCode =
  | "invalid_request"
  | "unauthorized_client"
  | "access_denied"
  | "unsupported_response_type"
  | "invalid_scope"
  | "server_error"
  | "temporarily_unavailable"
  | string;

// RFC6749 § 4.1.2.1. lists possible error codes and
// specifies the set of allowed characters as: %x20-21 / %x23-5B / %x5D-7E
// for both the error code and description.
function sanitizeErrorText(code: string): string;
function sanitizeErrorText(code: string | null): string | undefined;
function sanitizeErrorText(code: string | null): string | undefined {
  return code?.replace(/[^ -!#-\[\]-~]/g, "");
}

// RFC6749 § 4.1.2.1. specifies a set of valid characters for error_uri
function sanitizeErrorUri(uri: string | null): string | undefined {
  return uri?.replace(/[^!#-\[\]-~]/g, "");
}

export default async function completeAuthentication(
  params: URLSearchParams,
  config: ResolvedClientConfig
): Promise<AuthenticationResult> {
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
  let error = params.get("error");
  if (code && error) {
    throw new Error("'code' and 'error' parameters are mutually exclusive.");
  } else if (code) {
    const sessionState = params.get("session_state") ?? undefined;
    return handleCodeResponse(config, code, sessionState, authState);
  } else if (error) {
    error = sanitizeErrorText(error);
    const description = sanitizeErrorText(params.get("error_description"));
    const uri = sanitizeErrorUri(params.get("error_uri"));

    throw new IdpError(error, description, uri);
  } else {
    throw new Error("Missing 'code' or 'error' parameter.");
  }
}
