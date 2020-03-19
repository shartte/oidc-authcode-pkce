import {
  createAuthenticationState,
  storeAuthenticationState
} from "./authenticationState";
import { ResolvedClientConfig } from "./OIDCClient";

export default async function requestAuthentication({
  clientId,
  redirectUrl,
  authorizationEndpoint
}: ResolvedClientConfig): Promise<string> {
  const authenticationState = await createAuthenticationState();
  storeAuthenticationState(authenticationState);

  const { state, nonce, pkceState } = authenticationState;

  const params = new URLSearchParams({
    scope: "openid",
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUrl,
    state,
    nonce,
    // The default mode for the authorization code flow is "query", but since we'll process
    // the response entirely client side, using query is counter-productive. It would send
    // the information along to the server unnecessarily.
    response_mode: "fragment",
    // As per RFC7636 § 4.3
    code_challenge: pkceState.codeChallenge,
    code_challenge_method: pkceState.codeChallengeMethod
  });

  return `${authorizationEndpoint}?${params}`;
}
