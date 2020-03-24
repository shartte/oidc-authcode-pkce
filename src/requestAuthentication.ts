import {
  createAuthenticationState,
  storeAuthenticationState,
} from "./authenticationState";
import { ResolvedClientConfig } from "./OIDCClient";

/**
 * Creates and stores the state required for a new authentication request and returns
 * the URL at the authorization server that the user needs to be redirected to.
 *
 * @param clientId ID of the client at the IDP.
 * @param redirectUrl Redirect URL where the user will be redirected to by the IDP after successful or
 *                    failed authentication.
 * @param authorizationEndpoint The IDP's authorization endpoint.
 * @param applicationState Application specific state to be persisted alongside the authentication state.
 * @param disableFragmentResponseMode Do not send a response_mode=fragment request parameter.
 */
export default async function requestAuthentication(
  {
    clientId,
    redirectUrl,
    authorizationEndpoint,
    disableFragmentResponseMode,
  }: ResolvedClientConfig,
  applicationState: unknown
): Promise<string> {
  const authenticationState = await createAuthenticationState(applicationState);
  storeAuthenticationState(authenticationState);

  const { state, pkceState } = authenticationState;

  const params: Record<string, string> = {
    scope: "openid",
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUrl,
    state,
    // PKCE parameters as per RFC7636 § 4.3
    code_challenge: pkceState.codeChallenge,
    code_challenge_method: pkceState.codeChallengeMethod,
  };

  // The default mode for the authorization code flow is "query", but since we'll process
  // the response entirely client side, using query is counter-productive. It would send
  // the information along to the server unnecessarily.
  if (!disableFragmentResponseMode) {
    params.response_mode = "fragment";
  }

  const serializedParams = new URLSearchParams(params).toString();

  return `${authorizationEndpoint}?${serializedParams}`;
}
