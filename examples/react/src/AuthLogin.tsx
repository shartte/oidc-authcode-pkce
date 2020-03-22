import React, { useEffect } from "react";
import oidcClient from "./oidcClient";

function AuthLogin() {
  useEffect(() => {
    oidcClient.requestAuthentication({
      applicationState: {
        location: window.location.href
      },
      replaceLocation: true
    });
  }, []);

  return <div>Redirecting to SSO...</div>;
}

export default AuthLogin;
