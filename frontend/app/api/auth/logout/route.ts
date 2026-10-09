import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { callBackend } from "@/lib/server/backend";
import { REFRESH_COOKIE, clearSessionCookies } from "@/lib/server/session";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    /* Revoke server-side so the token is dead even if a copy leaked. */
    await callBackend("/customers/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);

  return response;
}
