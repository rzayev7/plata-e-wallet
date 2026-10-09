import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { callBackend, refreshTokens, relay } from "@/lib/server/backend";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  writeSessionCookies,
} from "@/lib/server/session";
import type { TokenPairDto } from "@/types/api";

/**
 * Forwards an authenticated browser request on to Spring.
 *
 * The browser sends cookies; this adds the bearer token. On a 401 it spends the
 * refresh token once, retries, and writes the rotated pair back as cookies.
 */
export async function proxyToBackend(request: NextRequest, segments: string[]): Promise<NextResponse> {
  const jar = await cookies();
  const path = `/${segments.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;
  const contentType = request.headers.get("content-type");

  let upstream = await callBackend(path, {
    method: request.method,
    body: body || undefined,
    contentType,
    accessToken: jar.get(ACCESS_COOKIE)?.value,
  });

  let rotated: TokenPairDto | null = null;

  if (upstream.status === 401) {
    const refreshToken = jar.get(REFRESH_COOKIE)?.value;

    if (refreshToken) {
      rotated = await refreshTokens(refreshToken);

      if (rotated) {
        upstream = await callBackend(path, {
          method: request.method,
          body: body || undefined,
          contentType,
          accessToken: rotated.accessToken,
        });
      }
    }
  }

  const response = await relay(upstream);

  if (upstream.status === 401) {
    /* Refresh was missing, spent or rejected: the session is over. */
    clearSessionCookies(response);
  } else if (rotated) {
    writeSessionCookies(response, rotated);
  }

  return response;
}
