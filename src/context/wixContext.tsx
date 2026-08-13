"use client";

/**
 * Browser Wix SDK client + React context provider used by cart/auth UI.
 * Reads `refreshToken` from js-cookie at module load. SECURITY: token lives
 * in a cookie and on the client instance — do not log it.
 */
import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { currentCart } from "@wix/ecom";
import Cookies from "js-cookie";
import { createContext, ReactNode } from "react";

const refreshToken = JSON.parse(Cookies.get("refreshToken") || "{}");

const wixClient = createClient({
  modules: {
    products,
    collections,
    currentCart,
  },
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
    tokens: {
      refreshToken,
      accessToken: { value: "", expiresAt: 0 },
    },
  }),
});

/** Inferred type of the shared browser Wix client instance. */
export type WixClient = typeof wixClient;

/** React context holding the singleton browser Wix client. */
export const WixClientContext = createContext<WixClient>(wixClient);

/**
 * Provides the browser Wix client to the App Router tree (navbar, cart, login).
 * @param children - App content wrapped by the provider in `RootLayout`.
 * @returns Context provider element.
 * @example
 * <WixClientContextProvider>
 *   <Navbar />
 *   {children}
 * </WixClientContextProvider>
 */
export const WixClientContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <WixClientContext.Provider value={wixClient}>
      {children}
    </WixClientContext.Provider>
  );
};
