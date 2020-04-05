import fetchIdpMetadata from "./fetchIdpMetadata";
import requestAuthentication from "./requestAuthentication";
import completeAuthentication from "./completeAuthentication";
import takeParameters from "./takeParameters";

/**
 * Contains Metadata about an OpenID provider as specified in
 * https://openid.net/specs/openid-connect-discovery-1_0.html
 */
export type IDPMetadata = {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  /**
   * The userinfo endpoint - although recommended - is not required.
   */
  userinfoEndpoint: string | undefined;
};

export type ClientConfig = {
  /**
   * The "Client Identifier", see https://tools.ietf.org/html/rfc6749#section-2.2
   */
  clientId: string;

  /**
   * The "Redirection Endpoint", see https://tools.ietf.org/html/rfc6749#section-3.1.2
   */
  redirectUrl: string;

  /**
   * This setting makes the token validation more lenient with regards to timestamp checks (i.e. for expiration),
   * by allowing a mismatch of up to the given number of seconds.
   */
  clockSkew?: number;

  /**
   * Do not use the response_mode=fragment to retrieve the authorization code from the IDP.
   * Some IDPs silently ignore response_mode and fall back to the default (which is query).
   * By default, the fragment will be used since the browser will not send the code back to the web server
   * in this case.
   */
  disableFragmentResponseMode?: boolean;
};

export type ResolvedClientConfig = ClientConfig & IDPMetadata;

/**
 * This client configuration allows the IDP metadata to be fetched from an IDP
 * metadata endpoint (see the OpenID Discovery specification).
 */
type UnresolvedClientConfig = ClientConfig & {
  metadataUrl: string;
} & Partial<IDPMetadata>;

export type OIDCClientOptions = ResolvedClientConfig | UnresolvedClientConfig;

function isFullClientConfig(
  config: ResolvedClientConfig | UnresolvedClientConfig
): config is ResolvedClientConfig {
  return (config as UnresolvedClientConfig).metadataUrl === undefined;
}

type RequestAuthenticationOptions = {
  /**
   * Application specific state that will be saved alongside the authentication state, and returned as
   * part of {@link AuthenticationResult}.
   */
  applicationState: unknown;

  /**
   * Replace the current history location with the authorization server URL.
   * This can be helpful if you use a specific route to automatically call {@link OIDCClient#requestAuthentication},
   * and want the user's back button to continue functioning.
   */
  replaceLocation?: boolean;
};

export class OIDCClient {
  private config: UnresolvedClientConfig | ResolvedClientConfig;

  private readonly location: Location;

  private readonly history: History;

  constructor(
    config: UnresolvedClientConfig | ResolvedClientConfig,
    location?: Location,
    history?: History
  ) {
    this.config = config;
    this.location = location ?? window.location;
    this.history = history ?? window.history;
  }

  private async resolveConfig(): Promise<ResolvedClientConfig> {
    if (isFullClientConfig(this.config)) {
      return this.config;
    } else {
      const { metadataUrl, ...configOverrides } = this.config;
      this.config = {
        ...(await fetchIdpMetadata(metadataUrl)),
        ...configOverrides,
      };
      return this.config;
    }
  }

  async requestAuthentication({
    applicationState,
    replaceLocation,
  }: RequestAuthenticationOptions): Promise<void> {
    const url = await requestAuthentication(
      await this.resolveConfig(),
      applicationState
    );
    if (replaceLocation) {
      this.location.replace(url);
    } else {
      this.location.href = url;
    }
  }

  async completeAuthentication(): ReturnType<typeof completeAuthentication> {
    const config = await this.resolveConfig();

    const params = takeParameters(
      this.location,
      this.history,
      config.disableFragmentResponseMode
    );

    return completeAuthentication(params, config);
  }
}
