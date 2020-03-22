import React, { useEffect, useState } from "react";
import oidcClient from "./oidcClient";
import { Link } from "react-router-dom";
import { IDToken, IDTokenClaims } from "../../../src/IDToken";

function AuthCallback() {
  const [claims, setClaims] = useState<IDTokenClaims>();
  const [accessToken, setAccessToken] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    oidcClient.completeAuthentication().then(
      ({ idToken, accessToken }) => {
        setClaims(idToken.claims);
        setAccessToken(accessToken);
      },
      err => {
        setError(err.toString());
      }
    );
  }, []);

  if (claims) {
    return (
      <>
        <table>
          <caption>IDToken Claims</caption>
          {Object.entries(claims).map(([name, value]) => {
            return (
              <tr key={name}>
                <th scope="row" style={{ textAlign: "right" }}>
                  {name}
                </th>
                <td style={{ textAlign: "left" }}>{JSON.stringify(value)}</td>
              </tr>
            );
          })}
        </table>
        <hr />
        <code style={{overflowWrap: 'anywhere'}}>{accessToken}</code>
      </>
    );
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
