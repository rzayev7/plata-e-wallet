import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/server/proxy";

/*
 * Catch-all proxy for every authenticated backend call: /api/accounts,
 * /api/accounts/{id}/deposit, and so on map straight onto the Spring paths.
 * The /api/auth/* handlers are more specific, so they win over this route.
 */

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
