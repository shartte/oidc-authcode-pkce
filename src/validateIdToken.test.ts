import { ResolvedClientConfig } from "./OIDCClient";
import { IDTokenClaims } from "./IDToken";
import validateIdToken from "./validateIdToken";

const config: ResolvedClientConfig = {
  clientId: "client-id",
  redirectUrl: "redirect-url",
  tokenEndpoint: "token-endpoint",
  authorizationEndpoint: "authorization-endpoint",
  issuer: "http://testissuer",
  clockSkew: undefined,
  disableFragmentResponseMode: undefined,
  userinfoEndpoint: undefined,
};

const createTimestamp = (offsetSeconds = 0) =>
  Math.floor(Date.now() / 1000 + offsetSeconds);

const createMinimalClaims = (): IDTokenClaims => ({
  iss: config.issuer,
  aud: config.clientId,
  exp: createTimestamp(1000),
  iat: createTimestamp(),
});

describe("ID token validation", () => {
  it("Minimal ID tokens pass validation", () => {
    return validateIdToken(config, createMinimalClaims());
  });

  it("Expired tokens are rejected", () =>
    expectAsync(
      validateIdToken(config, {
        ...createMinimalClaims(),
        exp: createTimestamp(-10),
      })
    ).toBeRejectedWithError(/ID token has expired/));

  it("Tokens from another issuer are rejected", () =>
    expectAsync(
      validateIdToken(config, {
        ...createMinimalClaims(),
        iss: "http://google.com",
      })
    ).toBeRejectedWithError(/does not match expected issuer/));

  const testAudience = (aud: string | string[]) =>
    validateIdToken(config, {
      ...createMinimalClaims(),
      aud,
    });

  it("Tokens for a different audience (scalar) are rejected", () =>
    expectAsync(testAudience("other-client")).toBeRejectedWithError(
      /contains untrusted audience/
    ));

  it("Tokens for a different audience (array) are rejected", () =>
    expectAsync(testAudience(["other-client"])).toBeRejectedWithError(
      /contains untrusted audience/
    ));

  it("Tokens with additional untrusted audiences are rejected", () =>
    expectAsync(
      testAudience(["client-id", "other-client"])
    ).toBeRejectedWithError(/contains untrusted audience/));

  it("The audience can also be wrapped in an array", () =>
    testAudience(["client-id"]));

  it("azp claims containing something other than the client id are rejected", () =>
    expectAsync(
      validateIdToken(config, {
        ...createMinimalClaims(),
        azp: "someother-client",
      })
    ).toBeRejectedWithError(
      /azp claim 'someother-client' unexpected. Should be client id client-id/
    ));
});
