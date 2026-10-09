import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { callBackend, errorResponse, upstreamMessage } from "@/lib/server/backend";
import { profileFromTokens, writeProfileCookie, writeSessionCookies } from "@/lib/server/session";
import { registerSchema } from "@/lib/validation";
import type { TokenPairDto } from "@/types/api";

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse(400, parsed.error.issues[0]?.message ?? "Check the form and try again");
  }

  const { firstName, lastName, email, password, phoneNumber } = parsed.data;

  /* The backend field really is called rawPassword — see CustomerCreateRequestDto. */
  const created = await callBackend("/customers/create", {
    method: "POST",
    body: JSON.stringify({ email, rawPassword: password, firstName, lastName, phoneNumber }),
  });

  if (!created.ok) {
    return errorResponse(created.status, await upstreamMessage(created, "Could not create your account"));
  }

  /*
   * POST /customers/create returns a profile but no tokens, so sign in straight
   * away to spare the customer a second form. If this second call fails the
   * account still exists — send them to the login page rather than erroring.
   */
  const loggedIn = await callBackend("/customers/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!loggedIn.ok) {
    return NextResponse.json({ ok: true, signedIn: false });
  }

  const tokens = (await loggedIn.json()) as TokenPairDto;

  const response = NextResponse.json({ ok: true, signedIn: true });
  writeSessionCookies(response, tokens);
  writeProfileCookie(response, profileFromTokens(tokens, email, firstName, lastName));

  return response;
}
