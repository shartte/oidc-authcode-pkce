import React, { useEffect, useState } from "react";
import "./App.css";
import { idpMetadata, urlSafeRandom } from "oidc-authcode-pkce";

function App() {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    async function authorize() {
      const { authorizationEndpoint } = await idpMetadata({
        issuer: "http://192.168.0.5:32773/auth/realms/master/"
      });

      return (
        authorizationEndpoint +
        "?" +
        new URLSearchParams({
          scope: "openid",
          response_type: "code",
          client_id: "testclient",
          redirect_uri: "http://localhost:3000/auth/callback",
          state: urlSafeRandom(8)
        }).toString()
      );
    }

    authorize().then(setUrl, console.error);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <a href={url} className="App-link">
          {url}
        </a>
      </header>
    </div>
  );
}

export default App;
