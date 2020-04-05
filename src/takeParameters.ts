/**
 * Get and remove the IDP's parameters from the query string or fragment (depending on client configuration).
 */
export default function takeParameters(
  location: Location,
  history: History,
  queryString: boolean | undefined
): URLSearchParams {
  const paramsString = queryString ? location.search : location.hash;

  const params = new URLSearchParams(paramsString.substring(1));

  // Strip out the parameters supplied from the IDP from the browser history
  // This avoids issues when reloading the current page using F5 that arise
  // from the state parameter no longer being valid.
  const startOfParams = location.href.lastIndexOf(paramsString);
  if (startOfParams !== -1) {
    history.replaceState(null, "", location.href.substr(0, startOfParams));
  }

  return params;
}
