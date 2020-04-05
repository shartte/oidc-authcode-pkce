import { IDPMetadata } from "./OIDCClient";

export default async function fetchIdpMetadata(
  metadataUrl: string
): Promise<IDPMetadata> {
  function throwError(error: unknown): never {
    throw new Error(`Failed to get IDP metadata ${metadataUrl}: ${error}`);
  }

  let response: Response;
  try {
    response = await fetch(metadataUrl);
  } catch (e) {
    throwError(e);
  }

  // The standard specifically states that the status must be 200
  if (response.status !== 200) {
    throwError(`${response.status} ${response.statusText}`);
  }

  // Parse the IDPs JSON response
  let body: any;
  try {
    body = await response.json();
  } catch (e) {
    throwError(`Invalid JSON: ${e}`);
  }
  if (typeof body !== "object" || !body) {
    throwError(`Expected JSON object: ${body}`);
  }

  // Returns a field from the response body and throws an exception if it's not present.
  function getField(field: string, required: boolean): string {
    const value = body[field];
    if ((required || value !== undefined) && typeof value !== "string") {
      throwError(`missing string field '${field}'`);
    }
    return value;
  }

  const issuer = getField("issuer", true);
  const authorizationEndpoint = getField("authorization_endpoint", true);
  const tokenEndpoint = getField("token_endpoint", true);
  const userinfoEndpoint = getField("userinfo_endpoint", false);

  // Validate the issuer, while the standard mandates the strings to be equal,
  // we have found IDPs in the wild that omit the context path from the issuer.
  if (metadataUrl.indexOf(issuer) !== 0) {
    throwError(`issuer '${issuer}' is unrelated.`);
  }

  return {
    issuer,
    authorizationEndpoint,
    tokenEndpoint,
    userinfoEndpoint,
  };
}
