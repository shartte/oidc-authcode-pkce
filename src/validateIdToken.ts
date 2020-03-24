import { OIDCClientOptions } from "./OIDCClient";
import { IDToken } from "./IDToken";
import { base64UrlDecode, base64UrlEncode } from "./base64";

/**
 * Validates that the given access token is associated with the id token by validating the access token hash
 * present in the id token.
 */
async function validateAccessToken(
  signatureHashAlg: string,
  hashClaim: string,
  accessToken: string
): Promise<void> {
  // According to spec, the hash value is of the access tokens "ASCII representation"
  // Since the access token is opaque, this is ... weird? This will simply crash if the
  // access token contains non-ASCII characters.
  const accessTokenAscii = new Uint8Array(
    accessToken.split("").map((x) => x.charCodeAt(0))
  );
  const accessTokenHash = new Uint8Array(
    await crypto.subtle.digest(signatureHashAlg, accessTokenAscii)
  );
  const upperHalfHash = base64UrlEncode(
    accessTokenHash.slice(0, accessTokenHash.length / 2),
    false
  );

  // Normalizes hashClaim to NOT have padding
  hashClaim = base64UrlEncode(base64UrlDecode(hashClaim), false);
  if (upperHalfHash !== hashClaim) {
    throw new Error(
      `at_hash '${hashClaim}' does not match actual value '${upperHalfHash}'`
    );
  }
}

/**
 * Validates an 'aud' (Audience) claim, which according to the spec can either be a single string scalar
 * or an array of strings. It can also be an array of just a single string, and still be compliant.
 *
 * @param claimedAudience The aud claim found in the ID token.
 * @param clientId The client id of this client.
 */
function validateAudience(
  claimedAudience: string | string[],
  clientId: string
): boolean {
  if (Array.isArray(claimedAudience)) {
    // The spec also requires us to reject ID tokens that contain an untrusted value.
    return claimedAudience.length === 1 && claimedAudience[0] === clientId;
  } else {
    return claimedAudience === clientId;
  }
}

/**
 * Validates an ID Token as per OIDC Core 3.1.3.6. and 3.1.3.7.
 */
async function validateIdToken(
  config: OIDCClientOptions,
  { claims, signatureHashAlg }: IDToken,
  accessToken?: string
): Promise<void> {
  // Check from OIDC Core § 3.1.3.6. validate access token via at_hash, if present
  const at_hash = claims.at_hash;
  if (at_hash !== undefined && accessToken) {
    await validateAccessToken(signatureHashAlg, at_hash, accessToken);
  }

  // Checks from OIDC Core § 3.1.3.7. follow

  // #1 skipped since we don't support encryption, and encrypted tokens are rejected during parsing

  // #2 check that the iss claim matches the issuer
  if (claims.iss !== config.issuer) {
    throw new Error(
      `iss claim '${claims.iss}' does not match expected issuer '${config.issuer}'`
    );
  }

  //  #3 The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer
  //  identified by the iss (issuer) Claim as an audience. The aud (audience) Claim MAY contain an array with more
  //  than one element. The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience,
  //  or if it contains additional audiences not trusted by the Client.
  if (!validateAudience(claims.aud, config.clientId)) {
    throw new Error(
      `aud claim '${claims.aud}' contains untrusted audience other than client id ${config.clientId}`
    );
  }

  // #4 If the ID Token contains multiple audiences, the Client SHOULD verify that an azp Claim is present.
  // Skipped because we do not support multiple audiences

  // #5 If an azp (authorized party) Claim is present, the Client SHOULD verify that its client_id is the Claim Value.
  if (claims.azp !== undefined && claims.azp !== config.clientId) {
    throw new Error(
      `azp claim '${claims.azp}' unexpected. Should be client id ${config.clientId}`
    );
  }

  // #6 If the ID Token is received via direct communication between the Client and the Token Endpoint (which
  // it is in this flow), the TLS server validation MAY be used to validate the issuer in place of checking the
  // token signature. The Client MUST validate the signature of all other ID Tokens according to JWS [JWS] using
  // the algorithm specified in the JWT alg Header Parameter. The Client MUST use the keys provided by the Issuer.
  // We make use of TLS here to avoid having to apply signature validation.

  // #7 The alg value SHOULD be the default of RS256 or the algorithm sent by the Client in the
  // id_token_signed_response_alg parameter during Registration.
  // We skip this because we do not know the value of id_token_signed_response_alg here, and the check is optional.

  // #8 If the JWT alg Header Parameter uses a MAC based algorithm such as HS256, HS384, or HS512, the octets of the
  // UTF-8 representation of the client_secret corresponding to the client_id contained in the aud (audience) Claim
  // are used as the key to validate the signature. For MAC based algorithms, the behavior is unspecified if the
  // aud is multi-valued or if an azp value is present that is different than the aud value.
  // Ignored because we do not validate the signature as per #6. TLS is used instead.

  const clockSkew = config.clockSkew ?? 0;

  // #9 The current time MUST be before the time represented by the exp Claim.
  const now = Date.now() / 1000;
  if (now > claims.exp + clockSkew) {
    throw new Error(`ID token has expired @ ${claims.exp}.`);
  }

  // #10 The iat Claim can be used to reject tokens that were issued too far away from the current time, limiting
  // the amount of time that nonces need to be stored to prevent attacks. The acceptable range is Client specific.
  // #11 If a nonce value was sent in the Authentication Request, a nonce Claim MUST be present and its value
  // checked to verify that it is the same value as the one that was sent in the Authentication Request. The Client
  // SHOULD check the nonce value for replay attacks. The precise method for detecting replay attacks is Client specific.
  // NOTE: This library does not use nonces, because our state parameter is already one-time-use only,
  //       and has the same entropy as the nonce would have.

  // #12 If the acr Claim was requested, the Client SHOULD check that the asserted Claim Value is appropriate. The
  // meaning and processing of acr Claim Values is out of scope for this specification.

  // #13 If the auth_time Claim was requested, either through a specific request for this Claim or by using the
  // max_age parameter, the Client SHOULD check the auth_time Claim value and request re-authentication if it
  // determines too much time has elapsed since the last End-User authentication.
}

export default validateIdToken;
