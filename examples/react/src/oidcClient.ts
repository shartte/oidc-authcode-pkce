import { OIDCClient } from "oidc-authcode-pkce";

export default new OIDCClient({
  clientId: "testclient",
  redirectUrl: "http://localhost:3000/auth/callback",
  metadataUrl:
    "http://192.168.0.5:32773/auth/realms/master/.well-known/openid-configuration",
});
