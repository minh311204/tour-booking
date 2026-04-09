"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
};

const navBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900/80 dark:disabled:text-slate-600";

export function AdminPagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  function goTo(next: number) {
    onPageChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex justify-center border-t border-slate-200 pt-4 dark:border-slate-700">
      <div
        className="flex items-center justify-center gap-1.5"
        role="navigation"
        aria-label="Phân trang"
      >
        <span className="sr-only">
          Trang {page} trên {totalPages}, {total} bản ghi, {pageSize} mục mỗi trang.
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          className={navBtn}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <div
          className="flex min-h-9 min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800"
          aria-current="page"
        >
          <span className="text-base font-bold tabular-nums text-sky-900 dark:text-sky-100">
            {page}
          </span>
        </div>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          className={navBtn}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
