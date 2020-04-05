import { base64UrlDecode } from "./base64";
import { IDToken } from "./IDToken";

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

export default function parseIdToken(encodedToken: string): IDToken {
  const [encodedHeader, ...jwtParts] = encodedToken.split(".");

  // The header is encoded in the same way for both JWE and JWS,
  // which allows us to idenify if a JWT is signed and not encrypted
  let header: any;
  try {
    header = JSON.parse(utf8Decoder.decode(base64UrlDecode(encodedHeader)));
  } catch (e) {
    throw new Error("Failed to parse ID Token header: " + e);
  }

  const alg = header.alg;
  if (typeof header.alg !== "string") {
    throw new Error("'alg' in id_token header is missing.");
  }

  // Pattern to match known signature algorithms from RFC7518 (JWA).
  // The pattern also matches the variant of the SHA hash being used.
  const match = alg.match(/^(HS|RS|ES|PS)(256|384|512)$/);
  if (!match) {
    throw new Error(`Unknown signature algorithm used in id_token: ${alg}`);
  }

  // Since we checked that it's not an encrypted JWT (as per JWE), we can now be sure
  // it should consist of three parts, and extract the remaining two
  const [encodedPayload, signature] = jwtParts;

  let claims: any;
  try {
    claims = JSON.parse(utf8Decoder.decode(base64UrlDecode(encodedPayload)));
  } catch (e) {
    throw new Error("Failed to parse ID Token payload: " + e);
  }

  return {
    claims,
    encodedToken,
    header,
    signature,
  };
}
