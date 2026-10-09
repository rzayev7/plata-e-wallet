/**
 * Reads the payload of a JWT without verifying it.
 *
 * That is safe here and only here: the token was just handed to us by the
 * Spring API over a server-to-server call, and the claims are used purely to
 * label the session (customer id) and size the cookie. Every actual
 * authorisation decision is still made by the backend, which does verify.
 */
export interface AccessTokenClaims {
  sub?: string;
  role?: string;
  exp?: number;
}

export function decodeAccessToken(token: string): AccessTokenClaims {
  const payload = token.split(".")[1];
  if (!payload) {
    return {};
  }
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return {};
  }
}

/** Seconds until the token expires, floored at 0; null when it carries no exp. */
export function secondsUntilExpiry(claims: AccessTokenClaims): number | null {
  if (typeof claims.exp !== "number") {
    return null;
  }
  return Math.max(0, claims.exp - Math.floor(Date.now() / 1000));
}
