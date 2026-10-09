import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { callBackend, errorResponse, upstreamMessage } from "@/lib/server/backend";
import { profileFromTokens, writeProfileCookie, writeSessionCookies } from "@/lib/server/session";
import { loginSchema } from "@/lib/validation";
import type { TokenPairDto } from "@/types/api";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse(400, "Enter your email and password");
  }

  const upstream = await callBackend("/customers/login", {
    method: "POST",
    body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
  });

  if (!upstream.ok) {
    return errorResponse(upstream.status, await upstreamMessage(upstream, "Could not sign you in"));
  }

  const tokens = (await upstream.json()) as TokenPairDto;

  /* Tokens stop here: they go into httpOnly cookies, never into the response body. */
  const response = NextResponse.json({ ok: true });
  writeSessionCookies(response, tokens);
  writeProfileCookie(response, profileFromTokens(tokens, parsed.data.email));

  return response;
}
