/**
 * Server-side Wix SDK client factory for App Router Server Components.
 * Reads the singular `refreshToken` cookie (see middleware cookie-name mismatch).
 * SECURITY: refresh token comes from cookies — never log tokens.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { cookies } from "next/headers";

/**
 * Builds a Wix client authenticated with the visitor refresh token from cookies.
 * Falls back to an empty token object when the cookie is missing or unparsable.
 * SECURITY: returned client carries the refresh token — do not log tokens.
 * @returns A Wix client with `products` and `collections` modules.
 * @example
 * const wixClient = await wixClientServer();
 * const products = await wixClient.products.queryProducts().find();
 */
export const wixClientServer = async () => {
  let refreshToken;
  try {
    const cookieStore = await cookies();
    refreshToken = JSON.parse(cookieStore.get("refreshToken")?.value || "{}");
  } catch (e) {
    console.error("Failed to fetch products", e);
  }

  const wixClient = createClient({
    modules: {
      products,
      collections,
    },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      tokens: {
        refreshToken,
        accessToken: { value: "", expiresAt: 0 },
      },
    }),
  });

  return wixClient;
};
