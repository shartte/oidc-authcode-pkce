import { OIDCClient } from "./OIDCClient";
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import {
  createAuthenticationState,
  getAuthenticationState,
  storeAuthenticationState,
} from "./authenticationState";

describe("OIDCClient", () => {
  let mockLocation: SpyObj<Location>;
  let mockHistory: SpyObj<History>;
  let hrefSetter: Spy;
  let hrefGetter: Spy;
  let hashGetter: Spy;

  let client: OIDCClient;
  beforeEach(() => {
    mockLocation = createSpyObj<Location>(
      "location",
      ["replace"],
      ["href", "hash"]
    );
    const hrefProp = Object.getOwnPropertyDescriptor(mockLocation, "href")!!;
    hrefSetter = hrefProp.set as Spy;
    hrefGetter = hrefProp.get as Spy;
    const hashProp = Object.getOwnPropertyDescriptor(mockLocation, "hash")!!;
    hashGetter = hashProp.get as Spy;

    mockHistory = createSpyObj<History>("history", ["replaceState"]);

    client = new OIDCClient(
      {
        clientId: "client-id",
        redirectUrl: "redirect-url",
        metadataUrl: location.origin + "/metadata-mock/oidc-client-test",
      },
      mockLocation,
      mockHistory
    );
  });

  it("requestAuthentication", async () => {
    const applicationState = {
      someField: 123,
      complexField: { subField: "string" },
    };
    await client.requestAuthentication({
      applicationState,
    });

    // Check that the OIDCClient did redirect using location.href
    expect(hrefSetter).toHaveBeenCalledTimes(1);
    expect(mockLocation.replace).not.toHaveBeenCalled();

    // The expected URL is hard to actually assert on, but we'll try our best here:
    const url = hrefSetter.calls.argsFor(0)[0] as string;

    expect(url.indexOf(location.origin + "/authorize?")).toBe(0);

    // Ensure the state has been stored and contains the application state we passed in
    const params = new URLSearchParams(url);
    const stateId = params.get("state");
    expect(stateId).toBeDefined();

    const savedState = getAuthenticationState(stateId!!);
    expect(savedState).toBeDefined();

    expect(savedState!!.applicationState).toEqual(applicationState);
  });

  it("requestAuthentication with replaceLocation", async () => {
    await client.requestAuthentication({
      applicationState: {},
      replaceLocation: true,
    });

    // Check that the OIDCClient did redirect using location.replace
    expect(mockLocation.replace).toHaveBeenCalledTimes(1);
    const setter = Object.getOwnPropertyDescriptor(mockLocation, "href")!!.set;
    expect(setter).not.toHaveBeenCalled();

    const url = mockLocation.replace.calls.argsFor(0)[0];
    expect(url.indexOf(location.origin + "/authorize")).toBe(0);
  });

  it("completeAuthentication", async () => {
    const applicationState = {
      someField: 123,
      complexField: { subField: "string" },
    };

    // Manually set up the required state to receive an IDP response
    const authState = await createAuthenticationState(applicationState);
    // Fake the PKCE values so we can validate them in the mock
    authState.pkceState.codeVerifier = "code-verifier";
    storeAuthenticationState(authState);

    hrefGetter.and.returnValue("");
    hashGetter.and.returnValue("#state=" + authState.state + "&code=123");

    await client.completeAuthentication();
  });
});
