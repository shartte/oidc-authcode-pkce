import {
  AuthenticationState,
  createAuthenticationState,
  getAuthenticationState,
  removeAuthenticationState,
  storeAuthenticationState,
} from "./authenticationState";
import urlSafeRandom from "./urlSafeRandom";

const expectedAppState = Object.freeze({ someAppState: 123 });

let state: AuthenticationState;
beforeAll(async () => {
  state = await createAuthenticationState(expectedAppState);
});

describe("authentication state creation", () => {
  it("has the application state", () => {
    expect(state.applicationState).toBe(expectedAppState);
  });

  it("has a recent creation date", () => {
    expect(state.created).toBeDefined();
    const secondsInThePast = (Date.now() - state.created.getTime()) / 1000;
    expect(secondsInThePast).toBeGreaterThanOrEqual(0);
    expect(secondsInThePast).toBeLessThan(60);
  });

  it("has a sufficiently long id", () => {
    expect(state.state).toBeDefined();
    // Should be at least as long as 8 bytes of URL-serialized randomness
    expect(state.state.length).toBeGreaterThanOrEqual(urlSafeRandom(8).length);
  });

  it("has a different id on sufficient calls", async () => {
    const nextState = await createAuthenticationState(expectedAppState);
    expect(state.state).not.toBe(nextState.state);
  });

  it("has a PKCE challenge", async () => {
    // Detailed tests can be found in pkce.test.ts
    expect(state.pkceState).toBeDefined();
    expect(state.pkceState.codeChallenge).toBeDefined();
    expect(state.pkceState.codeChallengeMethod).toBeDefined();
    expect(state.pkceState.codeVerifier).toBeDefined();
  });
});

describe("authentication state storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  let savedState: AuthenticationState | undefined;
  describe("when stored and retrieved", () => {
    beforeEach(() => {
      storeAuthenticationState(state);
      savedState = getAuthenticationState(state.state);
    });

    it("is referentially NOT the same", () => {
      expect(savedState).not.toBe(state);
    });

    it("is structurally the same", () => {
      expect(savedState).toEqual(state);
    });
  });

  it("is undefined when an unknown id is retrieved", () => {
    expect(getAuthenticationState(state.state)).not.toBeDefined();
  });

  it("removing unknown ids does not fail", () => {
    removeAuthenticationState(state.state);
  });

  it("can be removed", () => {
    storeAuthenticationState(state);
    expect(getAuthenticationState(state.state)).toBeDefined();
    removeAuthenticationState(state.state);
    expect(getAuthenticationState(state.state)).not.toBeDefined();
  });
});
