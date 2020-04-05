const express = require("express");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");

// Sadly this file has to be JavaScript, because the karma config is loaded without TS transpilation

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));

function createMockMetadata(req) {
  const port = req.socket.localPort;
  const originUrl = `http://localhost:${port}`;
  return {
    issuer: originUrl,
    authorization_endpoint: originUrl + "/authorize",
    token_endpoint: originUrl + "/token",
    userinfo_endpoint: originUrl + "/userinfo",
  };
}

// Serves the minimal set of required metadata
router.get("/metadata-mock/minimal", (req, res) => {
  let metadata = createMockMetadata(req);
  const { issuer, authorization_endpoint, token_endpoint } = metadata;
  metadata = { issuer, authorization_endpoint, token_endpoint };
  res.end(JSON.stringify(metadata));
});

// Serves metadata for the OIDCClient unit test
router.get("/metadata-mock/oidc-client-test", (req, res) => {
  let metadata = createMockMetadata(req);
  let { issuer, authorization_endpoint, token_endpoint } = metadata;
  token_endpoint += "/oidc-client-test";
  metadata = { issuer, authorization_endpoint, token_endpoint };
  res.end(JSON.stringify(metadata));
});

router.post("/token/:testCase", (req, res) => {
  const testCase = req.params.testCase;

  if (testCase === "invalid-json") {
    res.end("junk");
    return;
  }

  console.log(req.body);
  // Validates the values sent by the OIDCClient test case for completeAuthentication
  if (req.body.grant_type !== "authorization_code") {
    res.writeHead(400, "Invalid grant_type: " + req.body.grant_type).end();
  } else if (req.body.code !== "123") {
    res.writeHead(400, "Invalid code: " + req.body.code).end();
  } else if (req.body.client_id !== "client-id") {
    res.writeHead(400, "Invalid client_id: " + req.body.client_id).end();
  } else if (req.body.redirect_uri !== "redirect-url") {
    res.writeHead(400, "Invalid redirect_uri: " + req.body.redirect_uri).end();
  } else if (req.body.code_verifier !== "code-verifier") {
    res
      .writeHead(400, "Invalid code_verifier: " + req.body.code_verifier)
      .end();
  } else {
    // Create a minimal dummy ID token and return it, such that is passes the ID token validation
    const id_token = jwt.sign(
      {
        iss: createMockMetadata(req).issuer,
        aud: "client-id",
      },
      "dummy-hmac-secret"
    );
    res.end(
      JSON.stringify({
        id_token,
        access_token: "OPAQUE_TOKEN",
      })
    );
  }
});

// Serves invalid json
router.get("/metadata-mock/invalid-json", (req, res) => {
  res.end("something that is not JSON{}");
});

// Serves valid JSON, but not an object at the root
router.get("/metadata-mock/unexpected-json", (req, res) => {
  res.end("123");
});

// Overwrite a field with something that's not a string
router.get("/metadata-mock/invalid-field/:field", (req, res) => {
  const mockMetadata = createMockMetadata(req);
  mockMetadata[req.params.field] = {};
  res.end(JSON.stringify(mockMetadata));
});

// Remove a required field
router.get("/metadata-mock/missing-field/:field", (req, res) => {
  const mockMetadata = createMockMetadata(req);
  delete mockMetadata[req.params.field];
  res.end(JSON.stringify(mockMetadata));
});

// Replace the issuer with something else
router.get("/metadata-mock/invalid-issuer", (req, res) => {
  const mockMetadata = createMockMetadata(req);
  mockMetadata.issuer = "https://google.com";
  res.end(JSON.stringify(mockMetadata));
});

module.exports = router;
