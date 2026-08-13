/**
 * Server component that queries Wix products with optional name/type/price/sort
 * filters and pagination. Sanitizes the `shortDesc` additional-info HTML via
 * DOMPurify before `dangerouslySetInnerHTML`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { wixClientServer } from "@/lib/wixClientServer";
import { products } from "@wix/stores";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "./Pagination";

const PRODUCT_PER_PAGE = 8;

/**
 * Queries Wix and renders a product card grid (optional filters + pagination).
 * @param categoryId - Wix collection id to filter products.
 * @param limit - Optional page size override (default 8).
 * @param searchParams - Optional list filters (`name`, `type`, `min`, `max`, `sort`, `page`);
 *   `cat` is only a category-page marker that enables pagination (not a Wix filter).
 * @returns Product card grid, with pagination when filtering by cat/name.
 * @example
 * <ProductList categoryId={collectionId} limit={4} />
 * <ProductList categoryId={cat.collection?._id!} searchParams={searchParams} />
 */
const ProductList = async ({
  categoryId,
  limit,
  searchParams,
}: {
  categoryId: string;
  limit?: number;
  searchParams?: any;
}) => {
  const wixClient = await wixClientServer();
  const params = await searchParams;

  let productQuery = wixClient.products
    .queryProducts()
    .startsWith("name", params?.name || "")
    .eq("collectionIds", categoryId)
    .hasSome(
      "productType",
      params?.type ? [params.type] : ["physical", "digital"]
    )
    .gt("priceData.price", params?.min || 0)
    .lt("priceData.price", params?.max || 999999)
    .limit(limit || PRODUCT_PER_PAGE)
    .skip(
      params?.page ? parseInt(params.page) * (limit || PRODUCT_PER_PAGE) : 0
    );

  if (params?.sort) {
    const [sortType, sortBy] = params.sort.split(" ") || [
      "asc",
      "priceData.price",
    ];

    if (sortType === "asc") {
      productQuery = productQuery.ascending(sortBy);
    }
    if (sortType === "desc") {
      productQuery = productQuery.descending(sortBy);
    }
  }

  const res = await productQuery.find();

  return (
    <div className="mt-12 flex gap-x-8 gap -y-16 justify-between flex-wrap">
      {res.items.map((product: products.Product) => (
        <Link
          href={"/" + product.slug}
          className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
          key={product._id}
        >
          <div className="relative w-full h-80">
            <Image
              src={product.media?.mainMedia?.image?.url || "/product.png"}
              alt=""
              fill
              sizes="25vw"
              className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
            />
            {product.media?.items && (
              <Image
                src={product.media?.items[1]?.image?.url || "/product.png"}
                alt=""
                fill
                sizes="25vw"
                className="absolute object-cover rounded-md"
              />
            )}
          </div>
          <div className="flex justify-between">
            <span className="font-medium">{product.name}</span>
            <span className="font-semibold">${product.price?.price}</span>
          </div>
          {product.additionalInfoSections && (
            <div
              className="text-sm text-gray-500"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  product.additionalInfoSections.find(
                    (section: any) => section.title === "shortDesc"
                  )?.description || ""
                ),
              }}
            ></div>
          )}
          <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
            Add to Cart
          </button>
        </Link>
      ))}
      {params?.cat || params?.name ? (
        <Pagination
          currentPage={res.currentPage || 0}
          hasPrev={res.hasPrev()}
          hasNext={res.hasNext()}
        />
      ) : null}
    </div>
  );
};

export default ProductList;
