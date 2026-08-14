/**
 * Ensures every anonymous visitor has a Wix visitor refresh token cookie.
 * The visitor cookie is written under the same `refreshToken` name the
 * client/server clients read, so the anonymous handoff works. SECURITY:
 * cookie holds a Wix refresh token — do not log it.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/lib/authCookies";

/**
 * Mint visitor tokens when the cookie is missing, then continue the request.
 * SECURITY: may set a cookie containing a Wix refresh token — do not log it.
 * @param request - Incoming Next.js request (cookies inspected for `refreshToken`).
 * @returns NextResponse, optionally with a newly set `refreshToken` cookie.
 * @throws If `generateVisitorTokens` rejects (no try/catch around the Wix call).
 * @example
 * // First anonymous hit without `refreshToken` → response sets that cookie
 * // Subsequent hits with the cookie → NextResponse.next() unchanged
 */
export const middleware = async (request: NextRequest) => {
  const cookies = request.cookies;
  const res = NextResponse.next();

  if (cookies.get(REFRESH_TOKEN_COOKIE)) {
    return res;
  }

  const wixClient = createClient({
    auth: OAuthStrategy({ clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID! }),
  });

  const tokens = await wixClient.auth.generateVisitorTokens();
  res.cookies.set(REFRESH_TOKEN_COOKIE, JSON.stringify(tokens.refreshToken), {
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
};
