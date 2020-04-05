import { base64UrlEncode } from "./base64";
import { getRandomValues } from "./crypto";

/**
 * Creates a string suitable for inclusion in a URL that contains a specified amount of cryptographic
 * randomness.
 *
 * @param bytes The number of random bytes to generate.
 */
export default function urlSafeRandom(bytes: number): string {
  const arr = new Uint8Array(bytes);
  getRandomValues(arr);
  return base64UrlEncode(arr, false);
}
