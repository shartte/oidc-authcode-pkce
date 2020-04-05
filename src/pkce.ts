import urlSafeRandom from "./urlSafeRandom";
import { base64UrlEncode } from "./base64";
import { digest } from "./crypto";

export type PkceValues = {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
};

// This is only exported for testing purposes
export async function createChallenge(verifier: string): Promise<string> {
  // For method=S256
  // code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))

  // Convert back to uint8array for hashing with SHA256
  // note that url-safe base64 encoding already conforms to ASCII, so this will work
  const rawCodeVerifier = new Uint8Array(
    [...verifier].map((s) => s.charCodeAt(0))
  );
  const verifierDigest = await digest("SHA-256", rawCodeVerifier);
  return base64UrlEncode(new Uint8Array(verifierDigest), false);
}

export async function createPkceValues(): Promise<PkceValues> {
  // See RFC7636 § 4.1 for the length recommendation of 32 bytes
  const codeVerifier = urlSafeRandom(32);
  const codeChallenge = await createChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}
