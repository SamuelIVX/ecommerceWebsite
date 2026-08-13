"use client";

/**
 * Navbar profile / notifications / cart icons. Loads the cart on mount, opens
 * CartModel, and handles logout (clears `refreshToken` cookie). SECURITY:
 * logout clears the refresh token cookie.
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CartModel from "./CartModel";
import { useWixClient } from "@/hooks/useWixClient";
import Cookies from "js-cookie";
import { useCartStore } from "@/hooks/useCartStore";

/**
 * Profile menu + cart badge; redirects unauthenticated profile clicks to /login.
 */
const NavIcons = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const wixClient = useWixClient();
  const isLoggedIn = wixClient.auth.loggedIn();

  const handleProfile = () => {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      setIsProfileOpen((prev) => !prev);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    Cookies.remove("refreshToken");
    const { logoutUrl } = await wixClient.auth.logout(window.location.href);
    setIsLoading(false);
    setIsProfileOpen(false);
    router.push(logoutUrl);
  };

  const { counter, getCart } = useCartStore();

  useEffect(() => {
    getCart(wixClient);
  }, [wixClient, getCart]);

  return (
    <div className="flex items-center gap-4 xl:gap-6 relative">
      <button onClick={handleProfile} className="cursor-pointer" aria-label="Profile">
        <Image
          src="/profile.png"
          alt=""
          width={22}
          height={22}
          className="cursor-pointer"
        />
      </button>
      {isProfileOpen && (
        <div className="absolute p-4 rounded-md top-12 left-0 bg-white text-sm shadow-[0_3px_10px_rgb(0,0,0,0.2)] z-20">
          <Link href="/">Profile</Link>
          <button
            className="mt-2 block cursor-pointer"
            onClick={handleLogout}
          >
            {isLoading ? "Logging Out..." : "Logout"}
          </button>
        </div>
      )}
      <button className="cursor-pointer" aria-label="Notifications">
        <Image
          src="/notification.png"
          alt=""
          width={22}
          height={22}
          className="cursor-pointer"
        />
      </button>
      <button
        className="relative cursor-pointer"
        onClick={() => setIsCartOpen((prev) => !prev)}
        aria-label="Shopping cart"
      >
        <Image src="/cart.png" alt="" width={22} height={22} />
        <div className="absolute -top-4 -right-4 w-6 h-6 bg-lama rounded-full text-white text-sm flex items-center justify-center">
          {counter}
        </div>
      </button>
      {isCartOpen && <CartModel />}
    </div>
  );
};

export default NavIcons;
