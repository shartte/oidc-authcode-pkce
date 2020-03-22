/**
 * Encodes a {@link Uint8Array} using Base64 encoding with the URL-safe alphabet as
 * specified in https://tools.ietf.org/html/rfc4648#section-5.
 *
 * @param data The bytes to encode.
 * @param padding Whether to include the padding characters at the end.
 */
export function base64UrlEncode(data: Uint8Array, padding: boolean): string {
  let result = btoa(String.fromCharCode(...data));

  // Translate to URL-safe alphabet, padding is the same
  result = result.replace(/\+/g, "-").replace(/\//g, "_");

  if (!padding) {
    const firstPadding = result.indexOf("=");
    if (firstPadding !== -1) {
      return result.substr(0, firstPadding);
    }
  }
  return result;
}

/**
 * Decodes a given string using Base64 encoding with the URL-safe alphabet as
 * specified in https://tools.ietf.org/html/rfc4648#section-5.
 */
export function base64UrlDecode(encoded: string): Uint8Array {
  // Translate from URL-safe alphabet to standard alphabet
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");

  const binaryString = atob(encoded);
  return Uint8Array.from([...binaryString].map((x) => x.charCodeAt(0)));
}
