import urlSafeRandom from "./urlSafeRandom";
import { createPkceValues, PkceValues } from "./pkce";

export type AuthenticationState = {
  /**
   * State is used to correlate a response from the IDP back to this specific authentication request.
   * It is used for validation purposes (i.e. to find the original nonce and the PKCE state), but also
   * as a CSRF-prevention measure on the callback URL
   */
  state: string;

  /**
   * While a nonce is optional but allows us to check that the issued id token is specifically for this
   * authentication request. While the standard states "sufficient entropy must be used", it
   * does not state, how much is "sufficient". We'll use 8 bytes (=128 bit) which matches the entropy of UUIDs.
   */
  nonce: string;

  /**
   * The moment in time when this authentication state was initially created.
   */
  created: Date;

  /**
   * Contains the state needed for performing PKCE.
   */
  pkceState: PkceValues;
};

export async function createAuthenticationState(): Promise<
  AuthenticationState
> {
  const state = urlSafeRandom(8);
  const nonce = urlSafeRandom(8);

  const created = new Date();

  return {
    state,
    nonce,
    created,
    pkceState: await createPkceValues()
  };
}

export function storeAuthenticationState(state: AuthenticationState): void {
  localStorage["auth_state_" + state.state] = JSON.stringify(state);
}

export function getAuthenticationState(
  id: string
): AuthenticationState | undefined {
  const serializedState = localStorage["auth_state_" + id];
  if (!serializedState) {
    return undefined;
  }

  const state = JSON.parse(serializedState);
  return {
    state: state.state,
    nonce: state.nonce,
    created: new Date(state.created),
    pkceState: {
      codeChallenge: state.pkceState.codeChallenge,
      codeVerifier: state.pkceState.codeVerifier,
      codeChallengeMethod: state.pkceState.codeChallengeMethod
    }
  };
}

export function removeAuthenticationState(id: string): void {
  localStorage.removeItem("auth_state_" + id);
}
