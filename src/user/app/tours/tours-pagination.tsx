import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Khớp query `pageSize` gửi API và cách tính tổng trang */
export const TOURS_PAGE_SIZE = 12;

type Props = {
  page: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
};

function buildToursListHref(
  searchParams: Props["searchParams"],
  nextPage: number,
): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (key === "page" || key === "featured") continue;
    const v = Array.isArray(val) ? val[0] : val;
    if (v != null && String(v) !== "") q.set(key, String(v));
  }
  if (nextPage > 1) q.set("page", String(nextPage));
  const s = q.toString();
  return s ? `/tours?${s}` : "/tours";
}

export function ToursPagination({ page, total, searchParams }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / TOURS_PAGE_SIZE));
  if (total === 0 || totalPages <= 1) return null;

  const prevHref = buildToursListHref(searchParams, page - 1);
  const nextHref = buildToursListHref(searchParams, page + 1);

  return (
    <nav
      className="mt-10 flex justify-center border-t border-stone-200/80 pt-8"
      aria-label="Phân trang danh sách tour"
    >
      <div className="flex items-center gap-1">
        {page <= 1 ? (
          <span
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400"
            aria-disabled
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </span>
        ) : (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-800 shadow-sm transition hover:bg-sky-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Link>
        )}
        <span className="px-3 py-2 text-sm tabular-nums text-stone-700">
          {page} / {totalPages}
        </span>
        {page >= totalPages ? (
          <span
            className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400"
            aria-disabled
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-800 shadow-sm transition hover:bg-sky-50"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}
