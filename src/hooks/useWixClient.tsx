"use client";

/**
 * Convenience hook for reading the shared browser Wix client from context.
 */
import { WixClientContext } from "@/context/wixContext";
import { useContext } from "react";

/**
 * Reads the shared browser Wix client from context.
 * @returns The Wix client instance from `WixClientContext`.
 * @example
 * const wixClient = useWixClient();
 * const loggedIn = wixClient.auth.loggedIn();
 */
export const useWixClient = () => {
  return useContext(WixClientContext);
};
