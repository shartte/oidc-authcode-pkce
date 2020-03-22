import urlSafeRandom from "./urlSafeRandom";
import { createPkceValues, PkceValues } from "./pkce";

export type AuthenticationState = {
  /**
   * State is used to correlate a response from the IDP back to this specific authentication request.
   * It is used for validation purposes, but also as a CSRF-prevention measure on the callback URL.
   */
  state: string;

  /**
   * The moment in time when this authentication state was initially created.
   */
  created: Date;

  /**
   * Contains the state needed for performing PKCE.
   */
  pkceState: PkceValues;

  /**
   * Application-specific state that should be preserved across the authentication attempt.
   */
  applicationState: unknown;
};

/**
 * Creates the initial state needed for a new authentication request.
 */
export async function createAuthenticationState(
  applicationState: unknown
): Promise<AuthenticationState> {
  const state = urlSafeRandom(8);
  const created = new Date();

  return {
    state,
    created,
    pkceState: await createPkceValues(),
    applicationState
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
    created: new Date(state.created),
    pkceState: {
      codeChallenge: state.pkceState.codeChallenge,
      codeVerifier: state.pkceState.codeVerifier,
      codeChallengeMethod: state.pkceState.codeChallengeMethod
    },
    applicationState: state.applicationState
  };
}

export function removeAuthenticationState(id: string): void {
  localStorage.removeItem("auth_state_" + id);
}
