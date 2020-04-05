import { ResolvedClientConfig } from "./OIDCClient";
import completeAuthentication from "./completeAuthentication";
import {
  createAuthenticationState,
  storeAuthenticationState,
} from "./authenticationState";
import IdpError from "./IdpError";

describe("Processing IDP response", () => {
  const config: ResolvedClientConfig = {
    clientId: "client-id",
    redirectUrl: "redirect-url",
    tokenEndpoint: location.origin + "/token",
    userinfoEndpoint: undefined,
    clockSkew: undefined,
    authorizationEndpoint: location.origin + "/metadata-mock/authorization",
    issuer: location.origin,
    disableFragmentResponseMode: undefined,
  };

  const appState = {
    sendBackTo: "some-url",
  };
  const validParams = {
    state: "local-state-id",
    code: "123",
  };

  beforeEach(async () => {
    // Start with a blank slate regarding local storage
    localStorage.clear();

    const state = await createAuthenticationState(appState);
    validParams.state = state.state;
    storeAuthenticationState(state);
  });

  const test = (
    params: Record<string, string>,
    configOverrides: Partial<ResolvedClientConfig> = {}
  ) => {
    return completeAuthentication(new URLSearchParams(params), {
      ...config,
      ...configOverrides,
    });
  };

  it("missing state parameter is an error", () =>
    expectAsync(test({})).toBeRejectedWithError(/Missing 'state' parameter/));

  it("unknown state is an error", () =>
    expectAsync(test({ state: "something" })).toBeRejectedWithError(
      /State 'something' not found/
    ));

  it("token endpoint response status other than 200 fails", () =>
    expectAsync(
      test(validParams, {
        tokenEndpoint: location.origin + "/path-not-found",
      })
    ).toBeRejectedWithError(/Failed to retrieve token from .*: 404 Not Found/));

  it("token endpoint unreachable host fails", () =>
    expectAsync(
      test(validParams, {
        tokenEndpoint: "http://127.9.99.134:56535/token",
      })
    ).toBeRejectedWithError(/Failed to retrieve token from .*:/));

  // I.e. if there's a "fancy" 404 not found page or just HTML junk being returned
  it("non-json response from token endpoint fails", () =>
    expectAsync(
      test(validParams, {
        tokenEndpoint: location.origin + "/token/invalid-json",
      })
    ).toBeRejectedWithError(/Failed to read token response from/));

  it("code and error parameters are mutually exclusive", () =>
    expectAsync(
      test({ ...validParams, error: "some-error" })
    ).toBeRejectedWithError(
      /'code' and 'error' parameters are mutually exclusive/
    ));

  it("lack of both code and error parameter is an error", () =>
    expectAsync(test({ state: validParams.state })).toBeRejectedWithError(
      /Missing 'code' or 'error' parameter/
    ));

  it("error is propagated as exception with details and sanitized", async () => {
    try {
      await test({ state: validParams.state, error: 'error"code' });
      fail("Expected error response to throw");
    } catch (e) {
      const idpError = e as IdpError;
      expect(idpError).toBeInstanceOf(IdpError);
      // Notice how the code has been sanitized
      expect(idpError.error).toBe("errorcode");
      expect(idpError.description).not.toBeDefined();
      expect(idpError.uri).not.toBeDefined();
    }
  });

  it("error description and uri are propagated", async () => {
    try {
      await test({
        state: validParams.state,
        error: "error-code",
        error_description: '"description',
        error_uri: "uri uri",
      });
      fail("Expected error response to throw");
    } catch (e) {
      const idpError = e as IdpError;
      expect(idpError).toBeInstanceOf(IdpError);
      expect(idpError.error).toBe("error-code");
      // Notice how the description and uri have been sanitized
      expect(idpError.description).toBe("description");
      expect(idpError.uri).toBe("uriuri");
    }
  });
});
