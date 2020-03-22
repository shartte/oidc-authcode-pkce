import urlSafeRandom from "./urlSafeRandom";
import { base64UrlEncode } from "./base64";

export type PkceValues = {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
};

export async function createPkceValues(): Promise<PkceValues> {
  // See RFC7636 § 4.1 for the length recommendation of 32 bytes
  const codeVerifier = urlSafeRandom(32);

  // For method=S256
  // code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))

  // Convert back to uint8array for hashing with SHA256
  // note that url-safe base64 encoding already conforms to ASCII, so this will work
  const rawCodeVerifier = new Uint8Array(
    [...codeVerifier].map((s) => s.charCodeAt(0))
  );
  const digest = await crypto.subtle.digest("SHA-256", rawCodeVerifier);

  const codeChallenge = base64UrlEncode(new Uint8Array(digest), false);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}
