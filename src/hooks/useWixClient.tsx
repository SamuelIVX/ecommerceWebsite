"use client";

/**
 * Convenience hook for reading the shared browser Wix client from context.
 */
import { WixClientContext } from "@/context/wixContext";
import { useContext } from "react";

/**
 * @returns The Wix client instance from `WixClientContext`.
 */
export const useWixClient = () => {
  return useContext(WixClientContext);
};
