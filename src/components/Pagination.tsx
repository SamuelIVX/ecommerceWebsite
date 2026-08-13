"use client";

/**
 * Prev/next controls that update the `page` query param on the current path.
 */
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Prev/next buttons that rewrite the `page` search param on the current path.
 * @param currentPage - Zero-based page index from the Wix query result.
 * @param hasPrev - Whether a previous page exists.
 * @param hasNext - Whether a next page exists.
 * @returns Previous/Next controls for the product list.
 * @example
 * <Pagination currentPage={0} hasPrev={false} hasNext={true} />
 */
const Pagination = ({
  currentPage,
  hasPrev,
  hasNext,
}: {
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mt-12 flex justify-between w-full">
      <button
        className="rounded-md bg-lama text-white p-2 text-sm w-24 cursor-pointer disabled:cursor-not-allowed disabled:bg-pink-200"
        disabled={!hasPrev}
        onClick={() => createPageUrl(currentPage - 1)}
      >
        Previous
      </button>
      <button
        className="rounded-md bg-lama text-white p-2 text-sm w-24 cursor-pointer disabled:cursor-not-allowed disabled:bg-pink-200"
        disabled={!hasNext}
        onClick={() => createPageUrl(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
