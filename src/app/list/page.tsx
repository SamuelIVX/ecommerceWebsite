/**
 * Category / search listing page — campaign banner, filter controls, and a
 * ProductList for the collection resolved from `?cat=` (defaults to
 * all-products). Forced dynamic to avoid live Wix prerender in CI.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Filter from "@/components/Filter";
import ProductList from "@/components/ProductList";
import { wixClientServer } from "@/lib/wixClientServer";
import Image from "next/image";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

/**
 * @param searchParams - Promise/object of list query params (`cat`, filters, etc.).
 * @returns The category listing page.
 */
const ListPage = async ({ searchParams }: { searchParams: any }) => {
  const params = await searchParams;
  const wixClient = await wixClientServer();
  const cat = await wixClient.collections.getCollectionBySlug(
    params.cat || "all-products"
  );

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative">
      {/* CAMPAIGN */}
      <div className="hidden bg-pink-50 px-4 sm:flex justify-between h-64">
        <div className="w-2/3 flex flex-col items-center justify-center gap-8">
          <h1 className="text-4xl font-semibold leading-[48px] text-gray-700">
            Grab up to 50% off on <br />
            Selected Products
          </h1>
          <button className="rounded-3xl bg-lama text-white w-max py-3 px-5 text-sm ">
            Buy Now
          </button>
        </div>
        <div className="relative w-1/3">
          <Image src="/woman.png" alt="" fill className="object-contain" />
        </div>
      </div>
      {/* FILTER */}
      <Filter />
      {/* PRODUCTS */}
      <h1 className="mt-12 text-xl font-semibold">
        {cat?.collection?.name} For You!
      </h1>
      <Suspense fallback={"loading"}>
        <ProductList
          categoryId={
            cat.collection?._id || "00000000-000000-000000-000000000001"
          }
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
};

export default ListPage;
