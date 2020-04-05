import parseIdToken from "./parseIdToken";
import { base64UrlEncode } from "./base64";

function bakeJwt(
  header: object,
  payload: object | string,
  signature?: string
): string {
  const encoder = new TextEncoder();
  const encodedHeader = base64UrlEncode(
    encoder.encode(JSON.stringify(header)),
    false
  );
  let encodedPayload: string;
  if (typeof payload === "string") {
    encodedPayload = payload;
  } else {
    encodedPayload = base64UrlEncode(
      encoder.encode(JSON.stringify(payload)),
      false
    );
  }
  if (!signature) {
    return encodedHeader + "." + encodedPayload;
  } else {
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}

describe("ID Token parsing", () => {
  it("Parsing invalid token", () => {
    expect(() => parseIdToken("")).toThrowError(
      /Failed to parse ID Token header/
    );
  });

  it("algorithm in JWT header is mandatory", () => {
    expect(() => parseIdToken(bakeJwt({}, {}))).toThrowError(
      "'alg' in id_token header is missing."
    );
  });

  it("non-signature algorithms in JWT header are rejected", () => {
    expect(() => parseIdToken(bakeJwt({ alg: "A256GCMKW" }, {}))).toThrowError(
      "Unknown signature algorithm used in id_token: A256GCMKW"
    );
  });

  it("invalid payload is rejected", () => {
    expect(() => parseIdToken(bakeJwt({ alg: "HS256" }, "..."))).toThrowError(
      /Failed to parse ID Token payload/
    );
  });

  it("parsing a valid token succeeds", () => {
    const expectedClaims = { claim1: "c", claim2: [1, 2] };
    const expectedHeader = { alg: "HS256" };
    const expectedSignature = "qwdqwd";

    const jwt = bakeJwt(expectedHeader, expectedClaims, expectedSignature);
    const { claims, encodedToken, header, signature } = parseIdToken(jwt);

    expect(encodedToken).toBe(jwt);
    expect(claims).toEqual(expectedClaims as any);
    expect(header).toEqual(expectedHeader);
    expect(signature).toBe(expectedSignature);
  });
});
