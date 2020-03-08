# OpenID Connect Client (RP) for Modern Web Apps

![CI](https://github.com/shartte/oidc-authcode-pkce/workflows/CI/badge.svg)

## Overview

This project aims to provide a very lightweight JavaScript library to implement OpenID connect
using the latest best practices for a single page application.
It only supports the minimal feature set required to integrate with an IDP using the authorization
code flow with PKCE (as a public client), and silent refresh. If your project requires a more fully
featured OIDC client, see [similar projects](#similar-projects).

This library aims to follow the best current practice JavaScript Applications with and without a backend
outlined in [OAuth 2.0 for Browser-Based Apps](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps-05).

## Features

- **Authorization Code Flow**<br>
  Authenticates users using the OAuth 2.0 Authorization Code flow.
- **OpenID Connect**<br>
  Requests id tokens (if desired) and allows querying the user profile from the userprofile endpoint. Will also
  validate the id token and access token as outlined in the spec.
- **Silent Refresh**<br>
  By silently  renewing the access token in a hidden iframe, tokens can still have a relatively short lifetime, while 
  avoiding re-authentication or storing sensitive refresh tokens. The user's session will instead be maintained
  by the authorization server using cookies or other means.
- **Authenticated Requests**<br>
  Provides an easy way to make authenticated requests using tokens obtained with the library, by providing
  a way to make authenticated [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) requests.

## Relevant Specifications

See the [IETF Datatracker](https://datatracker.ietf.org/wg/oauth/documents/) to get an overview of OAuth related documents.

The following standards and best practices are especially relevant for this library:

- [RFC6749: The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)<br>
  The core OAuth specification.
- [OpenID](http://openid.net/specs/openid-connect-core-1_0.html)<br>
  Enhances RFC6749 with an identity layer (ID tokens/user profiles).
- [RFC6750: The OAuth 2.0 Authorization Framework: Bearer Token Usage](https://tools.ietf.org/html/rfc6750)<br>
  Relevant for making authenticated requests using the access token obtained from the IDP, and
  the standardized error codes returned for invalid tokens.
- [RFC7636: Proof Key for Code Exchange by OAuth Public Clients](https://tools.ietf.org/html/rfc7636)<br>
  Adds PKCE to the authorization code flow specifically for public clients.
- [OAuth 2.0 for Browser-Based Apps](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps-05)<br>
  _DRAFT_ of best current practice focusing on browser-based apps.
- [RFC8414: OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414.html)<br>
  Specifies IDP metadata that is retrievable through a well-known URL, making it possible to use an authorization server
  by just providing it's base URL to this library.

## Similar Projects

- [oidc-client-js](https://github.com/IdentityModel/oidc-client-js) (certified)<br>
  A fully featured OIDC client that has a relatively large footprint due to inclusion of the cryptography functions
  required for the discouraged implicit flow.
- [angular-oauth2-oidc](https://github.com/manfredsteyer/angular-oauth2-oidc) (certified)<br>
  A library for Angular applications which recently (9.0.0) has moved support for the implicit flow to an optional
  dependency, greatly reducing the bundle size.
- [AppAuth-JS](https://github.com/openid/AppAuth-JS)<br>
  While provided by the openid organization, this library is not certified and does not perform any id token
  validation. It may be argued that this is superflous, but the spec mandates it.
