/**
 * Regression tests for the anonymous-visitor token handoff (spec 03, R3/R4).
 * Mocks `@wix/sdk` token generation and `next/server` so the real middleware
 * runs against a fake request; asserts the minted visitor token is written
 * under the singular `refreshToken` name the clients read.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/lib/authCookies";
import { middleware } from "@/middleware";

const visitorToken = { value: "visitor-refresh-token", role: "VISITOR" };

const generateVisitorTokens = vi.fn(async () => ({
    accessToken: { value: "access", expiresAt: 3600 },
    refreshToken: visitorToken,
}));

vi.mock("@wix/sdk", () => ({
  createClient: vi.fn(() => ({
    auth: {
      generateVisitorTokens,
    },
  })),
  OAuthStrategy: vi.fn(() => ({})),
}));

type SetCookieSpy = { set: ReturnType<typeof vi.fn> };

const makeResponse = (): { cookies: SetCookieSpy } => {
  const cookies = {
    set: vi.fn(),
  };
  return { cookies };
};

const makeRequest = (hasCookie: boolean): NextRequest =>
  ({
    cookies: {
      get: vi.fn(() => (hasCookie ? { name: REFRESH_TOKEN_COOKIE, value: "x" } : undefined)),
    },
  }) as unknown as NextRequest;

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => makeResponse()),
  },
}));

describe("middleware visitor-token handoff", () => {
  beforeEach(() => {
    generateVisitorTokens.mockClear();
  });

  it("mints visitor tokens and sets the cookie under the singular refreshToken name when absent (R3)", async () => {
    const request = makeRequest(false);
    const res = (await middleware(request)) as unknown as { cookies: SetCookieSpy };

    expect(request.cookies.get).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);
    expect(generateVisitorTokens).toHaveBeenCalledTimes(1);
    expect(res.cookies.set).toHaveBeenCalledTimes(1);
    const [name, value] = res.cookies.set.mock.calls[0];
    expect(name).toBe("refreshToken");
    expect(JSON.parse(value)).toEqual({ value: "visitor-refresh-token", role: "VISITOR" });
  });

  it("passes through without minting when the cookie is already present (R4)", async () => {
    const request = makeRequest(true);
    const res = (await middleware(request)) as unknown as { cookies: SetCookieSpy };

    expect(request.cookies.get).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);
    expect(generateVisitorTokens).not.toHaveBeenCalled();
    expect(res.cookies.set).not.toHaveBeenCalled();
  });
});
