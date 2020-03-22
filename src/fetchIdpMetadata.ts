import { IDPMetadata } from "./OIDCClient";

export default async function fetchIdpMetadata(
  metadataUrl: string
): Promise<IDPMetadata> {
  const response = await fetch(metadataUrl);

  // The standard specifically states that the status must be 200
  if (response.status !== 200) {
    throw new Error("Failed to fetch IDP metadata: " + response.statusText);
  }

  const body = await response.json();

  // Returns a field from the response body and throws an exception if it's not present.
  function getField(field: string, required?: boolean): string {
    const value = body[field];
    if ((required || value !== undefined) && typeof value !== "string") {
      throw new Error(`IDP metadata is missing string field '${field}'`);
    }
    return value;
  }

  const issuer = getField("issuer");
  const authorizationEndpoint = getField("authorization_endpoint");
  const tokenEndpoint = getField("token_endpoint");
  const userinfoEndpoint = getField(body["userinfo_endpoint"]);

  // Validate the issuer, while the standard mandates the strings to be equal,
  // we have found IDPs in the wild that omit the context path from the issuer.
  if (metadataUrl.indexOf(issuer) !== 0) {
    throw new Error(
      `Retrieved issuer '${issuer}' is unrelated to '${metadataUrl}'.`
    );
  }

  return {
    issuer,
    authorizationEndpoint,
    tokenEndpoint,
    userinfoEndpoint,
  };
}
