import React, { useEffect } from "react";
import oidcClient from "./oidcClient";

function AuthLogin() {
  useEffect(() => {
    oidcClient.requestAuthentication(true);
  }, []);

  return <div>Redirecting to SSO...</div>;
}

export default AuthLogin;
