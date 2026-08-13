"use client";

/**
 * Mobile full-screen nav overlay toggled from the hamburger icon.
 * Link targets are currently empty placeholders.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/**
 * Compact mobile menu for the navbar.
 * @returns Hamburger toggle and full-screen overlay links.
 * @example
 * <Menu />
 */
const Menu = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="">
      <Image
        src="/menu.png"
        alt=""
        width={28}
        height={28}
        className="cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && (
        <div className="absolute bg-black text-white left-0 top-20 w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-8 text-xl z-10">
          <Link href="">Homepage</Link>
          <Link href="">Shop</Link>
          <Link href="">Deals</Link>
          <Link href="">About</Link>
          <Link href="">Contact</Link>
          <Link href="">Logout</Link>
          <Link href="">Cart{1}</Link>
        </div>
      )}
    </div>
  );
};

export default Menu;
