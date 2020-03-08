import { IDP } from "./IDP";

const cachedMetadata: unique symbol = Symbol.for("idp-metadata");

export type IDPMetadata = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
};

type IDPWithMetadata = IDP & { [cachedMetadata]: IDPMetadata | undefined };

// Gets the hidden cached IDP metadata field
function getCached(idp: IDP): IDPMetadata | undefined {
  return (idp as IDPWithMetadata)[cachedMetadata];
}

// Sets the hidden cached IDP metadata field
function setCached(idp: IDP, metadata: IDPMetadata) {
  (idp as IDPWithMetadata)[cachedMetadata] = metadata;
}

function getRequired(body: any, field: string): string {
  const value = body[field];
  if (!value) {
    throw new Error(`IDP metadata is missing field '${field}'`);
  }
  return value;
}

async function fetchMetadata(idp: IDP): Promise<IDPMetadata> {
  const url = new URL(
    ".well-known/openid-configuration",
    idp.issuer
  ).toString();
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch IDP Metadata: " + response.statusText);
  }

  const body = await response.json();
  console.debug(body);

  const authorizationEndpoint = getRequired(body, "authorization_endpoint");
  const tokenEndpoint = getRequired(body, "token_endpoint");
  return {
    authorizationEndpoint,
    tokenEndpoint
  };
}

export default async function idpMetadata(idp: IDP): Promise<IDPMetadata> {
  let metadata = getCached(idp);
  if (metadata) {
    return metadata;
  }

  metadata = await fetchMetadata(idp);
  setCached(idp, metadata);

  return metadata;
}
