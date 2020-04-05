import { ErrorCode } from "./completeAuthentication";

/**
 * Represents an error that was returned by the IDP after attempting to authenticate.
 */
export default class IdpError extends Error {
  private static buildMessage(
    error: ErrorCode,
    description?: string,
    uri?: string
  ) {
    let message = error;
    if (description) {
      message += ": " + description;
    }
    if (uri) {
      message += ". See: " + uri;
    }
    return message;
  }

  constructor(
    readonly error: ErrorCode,
    readonly description?: string,
    readonly uri?: string
  ) {
    super(IdpError.buildMessage(error, description, uri));
  }
}
