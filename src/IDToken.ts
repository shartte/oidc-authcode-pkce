import { OIDCStandardClaims } from "./claims";

/**
 * As specified in RFC7516:
 *
 * A JSON numeric value representing the number of seconds from
 * 1970-01-01T00:00:00Z UTC until the specified UTC date/time,
 * ignoring leap seconds.  This is equivalent to the IEEE Std 1003.1,
 * 2013 Edition [POSIX.1] definition "Seconds Since the Epoch", in
 * which each day is accounted for by exactly 86400 seconds, other
 * than that non-integer values can be represented.  See RFC 3339
 * [RFC3339] for details regarding date/times in general and UTC in
 * particular.
 */
export type NumericDate = number;

export type IDTokenClaims = {
  /**
   * The ID token issuer.
   *
   * Specified in both RFC7519 (JWT) and OIDC Core.
   */
  iss: string;

  /**
   * The ID token audience. It can be a string in case only one audience is specified, but an array with
   * just a single audience is also allowed.
   *
   * Specified in both RFC7519 (JWT) and OIDC Core.
   */
  aud: string[] | string;

  /**
   * Expiration time from the exp claim.
   *
   * Specified in both RFC7519 (JWT) and OIDC Core.
   */
  exp: NumericDate;

  /**
   * The time at which this token was issued.
   *
   * Specified in both RFC7519 (JWT) and OIDC Core.
   */
  iat: NumericDate;

  /**
   * An optional time before which this token must not be used.
   *
   * Specified in RFC7519 (JWT).
   */
  nbf?: NumericDate;

  /**
   * An optional unique ID of this particular token.
   *
   * The "jti" value is a case-sensitive string.
   *
   * Specified in RFC7519 (JWT).
   */
  jti?: string;

  /**
   * The at_hash claim as specified in https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken
   */
  at_hash?: string;

  // auth_time claim specified in OIDC Core §2
  auth_time?: NumericDate;

  /**
   * The nonce claim as specified in https://openid.net/specs/openid-connect-core-1_0.html#IDToken
   */
  nonce?: string;

  /**
   * The acr claim, which contains an Authentication Context Class Reference, as specified in
   * https://openid.net/specs/openid-connect-core-1_0.html#IDToken
   */
  acr?: string;

  /**
   * The amr claim, which contains references to the authentication methods, as specified in
   * https://openid.net/specs/openid-connect-core-1_0.html#IDToken
   */
  amr?: string[];

  /**
   * The azp claim, which contains the Client ID of the party to which the ID token was issued,
   * as specified by https://openid.net/specs/openid-connect-core-1_0.html#IDToken
   */
  azp?: string;
} & OIDCStandardClaims &
  Record<string, unknown>;

export type IDToken = {
  /**
   * The full encoded token as it was retrieved from the IDP's token endpoint.
   */
  encodedToken: string;

  /**
   * The JOSE header of the ID token.
   */
  header: Record<string, unknown>;

  /**
   * The claims stored in the ID token.
   */
  claims: IDTokenClaims;

  /**
   * The Base64 URL-Encoded signature of the ID token.
   */
  signature: string;
};
