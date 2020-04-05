import fetchIdpMetadata from "./fetchIdpMetadata";

// See metadata.mock.js for how this URL serves data
const testDataUrl = window.location.origin + "/metadata-mock/";

describe("Fetching IDP Metadata", () => {
  it(`can fetch the minimal set of metadata`, async () => {
    await expectAsync(fetchIdpMetadata(testDataUrl + "minimal")).toBeResolvedTo(
      {
        issuer: window.location.origin,
        authorizationEndpoint: window.location.origin + "/authorize",
        tokenEndpoint: window.location.origin + "/token",
        userinfoEndpoint: undefined,
      }
    );
  });

  it("Fails for unreachable host", () =>
    expectAsync(
      fetchIdpMetadata("http://127.0.0.1:56534/connection-refused")
    ).toBeRejectedWithError(
      /^Failed to get IDP metadata http:\/\/127.0.0.1:56534\/connection-refused:/
    ));

  it("Fails for unknown host", () =>
    expectAsync(
      fetchIdpMetadata("http://this.dns.hopefully.does.not.exist/")
    ).toBeRejectedWithError(
      /^Failed to get IDP metadata http:\/\/this.dns.hopefully.does.not.exist\//
    ));

  it("Fails for missing metadata", () =>
    expectAsync(
      fetchIdpMetadata(testDataUrl + "missing-metadata")
    ).toBeRejectedWithError(
      /^Failed to get IDP metadata http:.*: 404 Not Found/
    ));

  it("Fails for invalid JSON", () => {
    const url = testDataUrl + "invalid-json";
    return expectAsync(fetchIdpMetadata(url)).toBeRejectedWithError(
      /^Failed to get IDP metadata http:.*: Invalid JSON: SyntaxError.*/
    );
  });

  it("Fails for unexpected JSON root", () => {
    const url = testDataUrl + "unexpected-json";
    return expectAsync(fetchIdpMetadata(url)).toBeRejectedWithError(
      /^Failed to get IDP metadata http:.*: Expected JSON object: 123.*/
    );
  });

  function expectInvalidFieldError(
    field: string,
    testFile: string
  ): Promise<void> {
    return expectAsync(
      fetchIdpMetadata(testDataUrl + testFile)
    ).toBeRejectedWithError(
      RegExp(
        `^Failed to get IDP metadata http:.*: missing string field '${field}'`
      )
    );
  }

  // Required string fields
  for (const field of ["issuer", "authorization_endpoint", "token_endpoint"]) {
    it(`fails on missing ${field}`, () =>
      expectInvalidFieldError(field, "missing-field/" + field));
    it(`fails on non-string ${field}`, () =>
      expectInvalidFieldError(field, "invalid-field/" + field));
  }

  it(`fails on non-string userinfo_endpoint`, () =>
    expectInvalidFieldError(
      "userinfo_endpoint",
      "invalid-field/userinfo_endpoint"
    ));

  it(`validates the issuer`, () =>
    expectAsync(
      fetchIdpMetadata(testDataUrl + "invalid-issuer")
    ).toBeRejectedWithError(
      /^Failed to get IDP metadata http:.*: issuer 'https:\/\/google.com' is unrelated/
    ));
});
