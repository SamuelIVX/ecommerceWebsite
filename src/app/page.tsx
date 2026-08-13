/**
 * Storefront home page — hero slider, featured products, category strip, and
 * a second product row. Forced dynamic so CI builds do not prerender against
 * live Wix (FEATURED_PRODUCTS_CATEGORY_ID must be set in env).
 */
import CategoryList from "@/components/CategoryList";
import ProductList from "@/components/ProductList";
import Slider from "@/components/Slider";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

/**
 * Renders the marketing home layout with Suspense around Wix-backed lists.
 * @returns The home page React tree.
 * @example
 * // Route `/` — featured ProductList uses FEATURED_PRODUCTS_CATEGORY_ID
 * <HomePage />
 */
const HomePage = async () => {
  return (
    <div className="">
      <Slider />
      <div className="mt-24 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <h1 className="text-2xl">Featured Products</h1>
        <Suspense fallback={"loading"}>
          <ProductList
            categoryId={process.env.FEATURED_PRODUCTS_CATEGORY_ID!}
            limit={4}
          />
        </Suspense>
      </div>
      <div className="mt-24 ">
        <h1 className="text-2x px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 mb-12">
          Categories
        </h1>
        <Suspense fallback={"loading"}>
          <CategoryList />
        </Suspense>
      </div>
      <div className="mt-24 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <h1 className="text-2xl">New Products</h1>
        <ProductList
          categoryId={process.env.FEATURED_PRODUCTS_CATEGORY_ID!}
          limit={4}
        />
      </div>
    </div>
  );
};

export default HomePage;
