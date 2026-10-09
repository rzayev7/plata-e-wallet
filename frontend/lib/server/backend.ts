import { NextResponse } from "next/server";

import { BACKEND_URL } from "@/lib/env";
import type { ErrorResponseDto, TokenPairDto } from "@/types/api";

/** One call to Spring. `accessToken` is omitted for the public endpoints. */
export async function callBackend(
  path: string,
  init: { method?: string; body?: string; contentType?: string | null; accessToken?: string } = {},
): Promise<Response> {
  const headers = new Headers({ accept: "application/json" });

  if (init.body !== undefined) {
    headers.set("content-type", init.contentType ?? "application/json");
  }
  if (init.accessToken) {
    headers.set("authorization", `Bearer ${init.accessToken}`);
  }

  return fetch(`${BACKEND_URL}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    /* Never let Next cache a wallet response. */
    cache: "no-store",
  });
}

/*
 * Refresh tokens are single-use: RefreshTokenService.consume() revokes the old
 * row before issuing a new one. So two requests that both hit a 401 at the same
 * moment must not each spend the token — the second would fail and log the
 * customer out. Concurrent callers share one in-flight refresh instead.
 *
 * This is per-process. Behind more than one Next instance the dedupe has to
 * move somewhere shared (Redis), or the backend has to tolerate a replayed
 * refresh within a grace window.
 */
const inFlightRefreshes = new Map<string, Promise<TokenPairDto | null>>();

export function refreshTokens(refreshToken: string): Promise<TokenPairDto | null> {
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) {
    return existing;
  }

  const attempt = requestRefresh(refreshToken);
  inFlightRefreshes.set(refreshToken, attempt);
  void attempt.finally(() => inFlightRefreshes.delete(refreshToken));

  return attempt;
}

async function requestRefresh(refreshToken: string): Promise<TokenPairDto | null> {
  try {
    const response = await callBackend("/customers/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }
    return (await response.json()) as TokenPairDto;
  } catch {
    /* Backend unreachable — treat as "could not refresh" and let the caller 401. */
    return null;
  }
}

/** Copies an upstream response through to the browser, status and JSON body intact. */
export async function relay(upstream: Response): Promise<NextResponse> {
  const body = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  if (!body) {
    return new NextResponse(null, { status: upstream.status });
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}

/** An ErrorResponse-shaped body, so the browser client has one error format to parse. */
export function errorResponse(status: number, message: string): NextResponse {
  const body: ErrorResponseDto = {
    timestamp: new Date().toISOString(),
    status,
    error: message,
    message,
  };
  return NextResponse.json(body, { status });
}

/** Pulls `message` out of an upstream ErrorResponse, falling back to the status. */
export async function upstreamMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ErrorResponseDto>;
    if (body?.message) {
      return body.message;
    }
  } catch {
    /* 401s from HttpStatusEntryPoint have an empty body. */
  }
  return fallback;
}
