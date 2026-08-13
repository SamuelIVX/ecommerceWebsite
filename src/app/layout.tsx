/**
 * Root App Router layout — wraps every page with Wix client context, navbar,
 * and footer. Sets default site metadata.
 */
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WixClientContextProvider } from "@/context/wixContext";

export const metadata: Metadata = {
  title: "Samuel's E-Commerce Application",
  description: "A complete e-commerce application with Next.js and Wix",
};

/**
 * @param children - Page content for the active route.
 * @returns The HTML shell with shared chrome.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <WixClientContextProvider>
          <Navbar />
          {children}
          <Footer />
        </WixClientContextProvider>
      </body>
    </html>
  );
}
