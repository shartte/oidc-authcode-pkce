import { createChallenge, createPkceValues, PkceValues } from "./pkce";
import urlSafeRandom from "./urlSafeRandom";

describe("PKCE state", function () {
  let pkceValues: PkceValues;
  beforeAll(async () => {
    pkceValues = await createPkceValues();
  });

  // See RFC7636 § 4.1 for recommendation
  it("code verifier has 32 bytes of randomness", () => {
    expect(pkceValues.codeVerifier.length).toBe(urlSafeRandom(32).length);
  });

  it("code verifier of two consecutive calls is different", async () => {
    const nextValues = await createPkceValues();
    expect(nextValues.codeVerifier).not.toBe(pkceValues.codeVerifier);
  });

  it("code challenge is computed from code verifier", async () => {
    expect(pkceValues.codeChallenge).toBe(
      await createChallenge(pkceValues.codeVerifier)
    );
  });

  it("code challenge is the base64 encoded SHA256 digest of the given verifier", async () => {
    // The code verifier comes from RFC7636 Appendix B
    const codeChallenge = await createChallenge(
      "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    );
    expect(codeChallenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});
