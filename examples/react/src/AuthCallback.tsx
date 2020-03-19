import React, { useEffect, useState } from "react";
import oidcClient from "./oidcClient";
import { Link } from "react-router-dom";

function AuthCallback() {
  const [result, setResult] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    oidcClient.completeAuthentication().then(
      ({ idToken }) => {
        const name = idToken.claims.name;
        setResult(name);
      },
      err => {
        setError(err.toString());
      }
    );
  }, []);

  if (result) {
    return <div>{result}</div>;
  }

  if (error) {
    return (
      <>
        <p>{error}</p>
        <Link to="/auth/login" replace={true}>
          Retry
        </Link>
      </>
    );
  }
  return <div>Logging you in...</div>;
}

export default AuthCallback;
