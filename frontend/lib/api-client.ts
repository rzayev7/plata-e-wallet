import { ApiError } from "@/lib/api-error";
import type { ErrorResponseDto } from "@/types/api";

/*
 * Browser-side API client. Every call goes to Next's own /api routes, which
 * hold the tokens and forward to Spring — so there is no Authorization header
 * to manage here, and no CORS to configure.
 */

export type ApiPath = `/${string}`;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function api<T>(path: ApiPath, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });

  if (response.status === 401) {
    /*
     * The proxy already cleared the cookies. A full document load (rather than a
     * router push) is deliberate: it drops every cached balance and re-runs the
     * server layouts, which are the things that read the session.
     */
    if (typeof window !== "undefined") {
      window.location.href = new URL("/login?expired=1", window.location.origin).toString();
    }
    throw new ApiError(401, "Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readMessage(response, `Request failed (${response.status})`));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function readMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ErrorResponseDto>;
    if (body?.message) {
      return body.message;
    }
  } catch {
    /* Empty or non-JSON body. */
  }
  return fallback;
}

export function messageOf(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
