/**
 * Ensures every anonymous visitor has a Wix visitor refresh token cookie.
 * Known mismatch: this middleware writes `refreshTokens` (plural) while
 * `wixClientServer` / client context read `refreshToken` (singular), so the
 * handoff is currently broken. SECURITY: cookie holds a Wix refresh token —
 * do not log it.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { NextRequest, NextResponse } from "next/server";

/**
 * Mint visitor tokens when the plural cookie is missing, then continue the request.
 * @param request - Incoming Next.js request (cookies inspected for `refreshTokens`).
 * @returns NextResponse, optionally with a newly set `refreshTokens` cookie.
 */
export const middleware = async (request: NextRequest) => {
  const cookies = request.cookies;
  const res = NextResponse.next();

  if (cookies.get("refreshTokens")) {
    return res;
  }

  const wixClient = createClient({
    auth: OAuthStrategy({ clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID! }),
  });

  const tokens = await wixClient.auth.generateVisitorTokens();
  res.cookies.set("refreshTokens", JSON.stringify(tokens.refreshToken), {
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
};
