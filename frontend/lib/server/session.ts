import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { IS_PRODUCTION } from "@/lib/env";
import { decodeAccessToken, secondsUntilExpiry } from "@/lib/server/jwt";
import type { SessionProfile, TokenPairDto } from "@/types/api";

export const ACCESS_COOKIE = "plata_at";
export const REFRESH_COOKIE = "plata_rt";
export const PROFILE_COOKIE = "plata_profile";

/*
 * All three are httpOnly: no script on the page can read the refresh token,
 * which matters because it is a 30-day bearer secret. The browser never sees
 * a token — it sends cookies to Next, and Next attaches the Authorization
 * header on the way to Spring.
 */
const BASE_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PRODUCTION,
  path: "/",
} as const;

const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // matches jwt.refresh-token-expiration-days
const ACCESS_FALLBACK_MAX_AGE_SECONDS = 60 * 60;

export function writeSessionCookies(response: NextResponse, tokens: TokenPairDto): void {
  const maxAge = secondsUntilExpiry(decodeAccessToken(tokens.accessToken)) ?? ACCESS_FALLBACK_MAX_AGE_SECONDS;

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...BASE_COOKIE, maxAge });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...BASE_COOKIE,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function writeProfileCookie(response: NextResponse, profile: SessionProfile): void {
  response.cookies.set(PROFILE_COOKIE, JSON.stringify(profile), {
    ...BASE_COOKIE,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, PROFILE_COOKIE]) {
    response.cookies.set(name, "", { ...BASE_COOKIE, maxAge: 0 });
  }
}

export function profileFromTokens(tokens: TokenPairDto, email: string, firstName?: string, lastName?: string): SessionProfile {
  return {
    customerId: decodeAccessToken(tokens.accessToken).sub ?? "",
    email,
    firstName,
    lastName,
  };
}

/**
 * The session as seen by a server component. Presence of the refresh cookie is
 * what counts: the access token is short-lived and may well have expired, in
 * which case the first API call through the proxy silently renews it.
 */
export async function readSession(): Promise<SessionProfile | null> {
  const jar = await cookies();

  if (!jar.get(REFRESH_COOKIE)?.value) {
    return null;
  }

  const raw = jar.get(PROFILE_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionProfile;
  } catch {
    return null;
  }
}
